import { NextRequest, NextResponse } from "next/server";
import { makeAnthropicClient } from "@/engine/anthropic-client";
import { buildRequestParams, refusalOf } from "@/engine/model-capabilities";
import {
  QUESTION_POOL, MAX_QUESTIONS, missingQuestions,
  normalizeElements,
  type ExtractedElements, type ElementKey,
} from "@/engine/creation";
import { scoreBenchmarks } from "@/engine/matcher";
import { heuristicExtract } from "@/engine/extract-heuristic";
import { MODEL_LIGHT } from "@/engine/models";
import { checkDailyGuard, checkGuard } from "@/engine/guard";

export const runtime = "nodejs";

const ELEMENT_KEYS: ElementKey[] = [
  "scene", "heroDesc", "heroName", "heroWant", "heroNeed", "premise",
  "theme", "ending", "genre", "tone", "era", "benchmark", "choice", "hook",
];

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON 객체를 찾을 수 없음");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitize(raw: unknown): ExtractedElements {
  const out: ExtractedElements = {};
  if (!isRecord(raw)) return out;

  const normalized = normalizeElements(raw);
  for (const k of ELEMENT_KEYS) {
    const rawValue = raw[k];
    if (typeof rawValue === "string") {
      const value = rawValue.trim();
      if (!value) continue;
      out[k] = value === "없음"
        ? { value: "", confidence: "high", unknown: true, source: "extracted" }
        : { value, confidence: "high", source: "extracted" };
      continue;
    }

    const element = normalized[k];
    if (!element) continue;
    out[k] = element.value.trim() === "없음"
      ? { ...element, value: "", unknown: true, source: "extracted" }
      : { ...element, source: "extracted" };
  }
  return out;
}

// POST { utterance } → { elements, questions, engine }
export async function POST(req: NextRequest) {
  let body: { utterance?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }
  const guard = await checkGuard(req, (JSON.stringify(body) ?? "").length, { consumeDaily: false });
  if (!guard.ok) return NextResponse.json({ error: guard.message }, { status: guard.status });
  const utterance = body?.utterance?.trim();
  if (!utterance) {
    return NextResponse.json({ error: "하고 싶은 이야기를 먼저 쏟아내 주세요." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    let elements: ExtractedElements;
    let engine: string;
    let model: string | undefined;

    if (!apiKey) {
      elements = heuristicExtract(utterance, {
        findBenchmark: (text) => {
          const top = scoreBenchmarks(text)[0];
          if (!top) return undefined;
          const plain = top.title.replace(/[<>]/g, "").split(",")[0].trim();
          return plain.length >= 2 && text.includes(plain) ? top.title : undefined;
        },
      });
      engine = "heuristic";
    } else {
      model = MODEL_LIGHT;
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = makeAnthropicClient(apiKey);
      const system = [
        "너는 스토리 창작 코치의 '듣기 담당'이다. 사용자가 두서없이 쏟아낸 발화에서 이야기 구성 요소를 추출한다.",
        "규칙:",
        "1. 발화에 실제로 존재하는 내용만 추출한다. 지어내거나 보완하지 않는다. 없으면 그 키를 생략한다.",
        "2. 사용자의 표현을 최대한 보존한다 (요약은 허용, 창작은 금지).",
        "3. 반드시 JSON 객체 하나만 출력한다. 코드펜스·설명 금지.",
        "",
        "출력 스키마 (모든 키 선택적, 값은 문자열):",
        `{"elements": {${ELEMENT_KEYS.map((k) => `"${k}"?: string`).join(", ")}}}`,
        "",
        "키 의미: scene=인상적인 장면, heroDesc=주인공은 어떤 사람, heroName=주인공 이름, heroWant=주인공이 겉으로 원하는 것, heroNeed=진짜 필요한 것(결핍), premise=사건·소재, theme=주제, ending=원하는 결말·도착점, genre=장르, tone=톤, era=시대·배경, benchmark=언급된 참고 영화 제목, choice=주인공의 갈림길·선택, hook=본인만의 차별점",
      ].join("\n");

      const dailyGuard = await checkDailyGuard(req);
      if (!dailyGuard.ok) return NextResponse.json({ error: dailyGuard.message }, { status: dailyGuard.status });

      const once = async (extra = "") => {
        const resp = await client.messages.create({
          model: model!,
          ...buildRequestParams(model!, { maxTokens: 1200 }),
          system,
          messages: [{ role: "user", content: utterance + extra }],
        });
        // 안전 분류기가 거부하면 HTTP 200에 stop_reason="refusal"이 온다.
        // 확인하지 않으면 빈 content를 정상 응답으로 착각해 파싱 오류로 둔갑한다.
        const _refusal = refusalOf(resp);
        if (_refusal.refused) throw new Error(`모델이 요청을 거부했습니다${_refusal.category ? ` (${_refusal.category})` : ""}.`);
        const text = resp.content
          .filter((b): b is { type: "text"; text: string } => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        return extractJson(text) as { elements?: unknown };
      };

      let parsed: { elements?: unknown };
      try {
        parsed = await once();
      } catch {
        parsed = await once("\n\n반드시 JSON 객체 하나만 출력하라. 코드펜스/설명 금지.");
      }
      elements = sanitize(parsed.elements);
      engine = "anthropic";
    }

    const questions = missingQuestions(elements);
    return NextResponse.json({
      elements,
      questions,
      maxQuestions: MAX_QUESTIONS,
      poolSize: QUESTION_POOL.length,
      engine,
      model,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "추출 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
