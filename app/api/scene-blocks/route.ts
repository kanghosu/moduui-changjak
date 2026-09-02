import { promises as fs } from "node:fs";
import { isFallbackWorthy, makeAnthropicClient } from "@/engine/anthropic-client";
import { cachedSystem, logUsage } from "@/engine/anthropic-call";
import { buildRequestParams, refusalOf } from "@/engine/model-capabilities";
import { MODEL_MAIN } from "@/engine/models";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { buildConceptPromptContext } from "@/engine/knowledge";
import { findSimilarBenchmarks } from "@/engine/scene-benchmarks";
import { inferSceneBlocks, type SceneCandidate } from "@/engine/scene-analysis";
import { checkDailyGuard, checkGuard } from "@/engine/guard";

export const runtime = "nodejs";

const SceneRequestSchema = z.object({
  sceneText: z.string().trim().min(1, "sceneText가 필요합니다.").max(8_000, "sceneText는 8,000자 이하로 입력하세요."),
});

const SceneCandidateSchema = z.object({
  index: z.number().int().min(1).max(24),
  act: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  function: z.string().min(1),
  reason: z.string().min(1),
});

const SceneAiResponseSchema = z.object({
  candidates: z.array(SceneCandidateSchema).min(3).max(4),
}).refine((value) => new Set(value.candidates.map((candidate) => candidate.index)).size === value.candidates.length, "중복 블록 후보가 있습니다.");

class SceneJsonError extends Error {
  readonly name = "SceneJsonError";
}

const ROOT = process.cwd();

async function readFileSafe(relativePath: string): Promise<string> {
  try {
    return await fs.readFile(path.join(ROOT, relativePath), "utf8");
  } catch {
    return "";
  }
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new SceneJsonError("AI 응답에서 JSON 객체를 찾을 수 없습니다.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function buildSystemPrompt(blockGuide: string, conceptContext: string): string {
  return `너는 장면을 욕망의 레시피 4막·24블록에 역산 배치하는 분석가다.
사용자가 준 장면에 가장 들어맞는 블록 후보를 3~4개 고르고, 각 후보를 고른 이유를 한 문장으로 쓴다.
장면 내용을 새로 만들거나 결말을 단정하지 말고, 아래 구조 정의와 개념 컨텍스트만 근거로 JSON 객체 하나를 출력한다.

## 24블록 기능 정의
${blockGuide}

## 개념 컨텍스트
${conceptContext}

## 출력 형식
{"candidates":[{"index":13,"act":3,"function":"블록 기능","reason":"이 장면의 어떤 단서가 이 블록과 맞는지"}]}`;
}

async function callAnthropic(sceneText: string, blockGuide: string): Promise<readonly SceneCandidate[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const model = MODEL_MAIN;
  const conceptContext = buildConceptPromptContext(["플롯", "결핍", "욕망", "전환점"]);
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = makeAnthropicClient(apiKey);
  const response = await client.messages.create({
    model,
    ...buildRequestParams(model!, { maxTokens: 1_800 }),
    system: cachedSystem(buildSystemPrompt(blockGuide, conceptContext)),
    messages: [{ role: "user", content: `장면:\n${sceneText}` }],
  });
  // 안전 분류기가 거부하면 HTTP 200에 stop_reason="refusal"이 온다.
  // 확인하지 않으면 빈 content를 정상 응답으로 착각해 파싱 오류로 둔갑한다.
  logUsage("scene-blocks", response);
  const _refusal = refusalOf(response);
  if (_refusal.refused) throw new Error(`모델이 요청을 거부했습니다${_refusal.category ? ` (${_refusal.category})` : ""}.`);
  const text = response.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  return SceneAiResponseSchema.parse(extractJson(text)).candidates;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }
  const guard = await checkGuard(request, (JSON.stringify(body) ?? "").length, { consumeDaily: false });
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });

  const parsed = SceneRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "장면을 입력하세요." }, { status: 400 });
  }

  const { sceneText } = parsed.data;
  const blockGuide = await readFileSafe("knowledge/method/24block.md");
  const heuristicCandidates = inferSceneBlocks(sceneText, blockGuide);
  const benchmarks = await findSimilarBenchmarks(sceneText, heuristicCandidates.map((candidate) => candidate.index));

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ candidates: heuristicCandidates, benchmarks, engine: "heuristic", mode: "scene-reverse" });
  }

  const dailyGuard = await checkDailyGuard(request);
  if (!dailyGuard.ok) return NextResponse.json({ error: dailyGuard.message }, { status: dailyGuard.status });

  try {
    const candidates = await callAnthropic(sceneText, blockGuide);
    const model = MODEL_MAIN;
    return NextResponse.json({ candidates, benchmarks, engine: "anthropic", model, mode: "scene-reverse" });
  } catch (error) {
    if (!isFallbackWorthy(error)) {
      return NextResponse.json({ error: "장면 분석에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;
    const message = error instanceof Error ? error.message : "알 수 없는 Anthropic 오류";
    console.error("[AI fallback]", "scene-blocks", status, message);
    // checkDailyGuard가 실제 호출 직전에 올린 카운터는 호출 실패 후에도 시도 비용으로 유지한다.
    return NextResponse.json({ candidates: heuristicCandidates, benchmarks, engine: "heuristic", mode: "scene-reverse", fallbackFrom: "anthropic" });
  }
}
