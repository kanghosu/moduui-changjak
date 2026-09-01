import { NextRequest, NextResponse } from "next/server";
import { makeAnthropicClient } from "@/engine/anthropic-client";
import { buildRequestParams, refusalOf } from "@/engine/model-capabilities";
import { MODEL_MAIN } from "@/engine/models";
import { promises as fs } from "fs";
import path from "path";
import { validateStructure, type Story } from "@/engine/schema";
import { mockGenerate, type GenerateInput } from "@/engine/mock";
import {
  orchestrate,
  makeMockRunner,
  type OrchestrateFiles,
  type StageRunner,
} from "@/engine/orchestrate";
import { checkDailyGuard, checkGuard } from "@/engine/guard";

export const runtime = "nodejs";

const ROOT = process.cwd();

async function readFileSafe(rel: string): Promise<string> {
  try {
    return await fs.readFile(path.join(ROOT, rel), "utf8");
  } catch {
    return "";
  }
}

function buildSystemPrompt(parts: {
  template: string;
  skill: string;
  blocks: string;
  ontology: string;
  schema: string;
}): string {
  return parts.template
    .replace("{SKILL}", parts.skill)
    .replace("{BLOCKS}", parts.blocks)
    .replace("{ONTOLOGY}", parts.ontology)
    .replace("{SCHEMA}", parts.schema);
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON 객체를 찾을 수 없음");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function loadOrchestrateFiles(): Promise<OrchestrateFiles> {
  const [skill, blocks, ontology, schema, genreGuide, masters, r1, r2, r3] = await Promise.all([
    readFileSafe("skills/jakbeop-engine/SKILL.md"),
    readFileSafe("knowledge/method/24block.md"),
    readFileSafe("knowledge/method/ontology.md"),
    readFileSafe("engine/schema.ts"),
    readFileSafe("knowledge/method/genre-guidelines.md"),
    readFileSafe("knowledge/method/masters-crosswalk.md"),
    readFileSafe(".claude/agents/r1-chwijae.md"),
    readFileSafe(".claude/agents/r2-structure.md"),
    readFileSafe(".claude/agents/r3-character.md"),
  ]);
  return { skill, blocks, ontology, schema, genreGuide, masters, agents: { r1, r2, r3 } };
}

export async function POST(req: NextRequest) {
  let body: GenerateInput & { pipeline?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }
  const guard = await checkGuard(req, (JSON.stringify(body) ?? "").length, { consumeDaily: false });
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  if (!body?.logline?.trim()) {
    return NextResponse.json({ error: "logline은 필수입니다." }, { status: 400 });
  }

  const { pipeline, ...input } = body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    // ── 오케스트레이션 모드 (R1→R2→R3) ──────────────
    if (pipeline) {
      const files = await loadOrchestrateFiles();
      let runner: StageRunner;
      let engine: string;
      let model: string | undefined;

      if (apiKey) {
        model = MODEL_MAIN;
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = makeAnthropicClient(apiKey);
        runner = async ({ system, user }) => {
          const once = async (extra = "") => {
            const resp = await client.messages.create({
              model: model!,
              ...buildRequestParams(model!, { maxTokens: 8000 }),
              system,
              messages: [{ role: "user", content: user + extra }],
            });
            // 안전 분류기가 거부하면 HTTP 200에 stop_reason="refusal"이 온다.
            // 확인하지 않으면 빈 content를 정상 응답으로 착각해 파싱 오류로 둔갑한다.
            const _refusal = refusalOf(resp);
            if (_refusal.refused) throw new Error(`모델이 요청을 거부했습니다${_refusal.category ? ` (${_refusal.category})` : ""}.`);
            const text = resp.content
              .filter((b): b is { type: "text"; text: string } => b.type === "text")
              .map((b) => b.text)
              .join("\n");
            return extractJson(text);
          };
          try {
            return await once();
          } catch {
            return await once("\n\n반드시 JSON 객체 하나만 출력하라. 코드펜스/설명 금지.");
          }
        };
        engine = "anthropic";
        const dailyGuard = await checkDailyGuard(req);
        if (!dailyGuard.ok) return NextResponse.json({ error: dailyGuard.message }, { status: dailyGuard.status });
      } else {
        runner = makeMockRunner(input);
        engine = "mock";
      }

      const { story, trace } = await orchestrate(input, files, runner);
      const issues = validateStructure(story);
      return NextResponse.json({ story, issues, trace, engine, model, mode: "pipeline" });
    }

    // ── 단일 호출 모드 ───────────────────────────────
    if (!apiKey) {
      const story = mockGenerate(input);
      const issues = validateStructure(story);
      return NextResponse.json({ story, issues, engine: "mock", mode: "single" });
    }

    const [template, skill, blocks, ontology, schema] = await Promise.all([
      readFileSafe("engine/prompts/generate.system.md"),
      readFileSafe("skills/jakbeop-engine/SKILL.md"),
      readFileSafe("knowledge/method/24block.md"),
      readFileSafe("knowledge/method/ontology.md"),
      readFileSafe("engine/schema.ts"),
    ]);

    const system = buildSystemPrompt({ template, skill, blocks, ontology, schema });
    const model = MODEL_MAIN;

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = makeAnthropicClient(apiKey);

    const userMsg = JSON.stringify({
      logline: input.logline,
      premise: input.premise ?? "",
      genre: input.genre ?? "",
      target: input.target ?? "",
      tone: input.tone ?? "",
      hookNote: input.hookNote ?? "",
      benchmarkName: input.benchmarkName ?? "",
      theme: input.theme ?? "",
      heroName: input.heroName ?? "",
      heroWant: input.heroWant ?? "",
      heroNeed: input.heroNeed ?? "",
      ideaNote: input.ideaNote ?? "",
    });

    const callOnce = async (extra = ""): Promise<Story> => {
      const resp = await client.messages.create({
        model,
        ...buildRequestParams(model!, { maxTokens: 8000 }),
        system,
        messages: [{ role: "user", content: userMsg + extra }],
      });
      // 안전 분류기가 거부하면 HTTP 200에 stop_reason="refusal"이 온다.
      // 확인하지 않으면 빈 content를 정상 응답으로 착각해 파싱 오류로 둔갑한다.
      const _refusal = refusalOf(resp);
      if (_refusal.refused) throw new Error(`모델이 요청을 거부했습니다${_refusal.category ? ` (${_refusal.category})` : ""}.`);
      const text = resp.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return extractJson(text) as Story;
    };

    const dailyGuard = await checkDailyGuard(req);
    if (!dailyGuard.ok) return NextResponse.json({ error: dailyGuard.message }, { status: dailyGuard.status });

    let story: Story;
    try {
      story = await callOnce();
    } catch {
      story = await callOnce("\n\n반드시 스키마를 만족하는 JSON 객체 하나만 출력하라. 코드펜스/설명 금지.");
    }

    const issues = validateStructure(story);
    return NextResponse.json({ story, issues, engine: "anthropic", model, mode: "single" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "엔진 호출 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
