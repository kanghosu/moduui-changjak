import { NextRequest, NextResponse } from "next/server";
import {
  QUESTION_POOL, MAX_QUESTIONS, missingQuestions,
  type ExtractedElements, type ElementKey,
} from "@/engine/creation";
import { scoreBenchmarks } from "@/engine/matcher";
import { MODEL_LIGHT } from "@/engine/models";

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

function sanitize(raw: unknown): ExtractedElements {
  const out: ExtractedElements = {};
  if (raw && typeof raw === "object") {
    for (const k of ELEMENT_KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === "string" && v.trim() && v.trim() !== "없음") out[k] = v.trim();
    }
  }
  return out;
}

// 키 없이도 데모가 돌도록 하는 최소 휴리스틱 — 벤치마크 언급·장르 신호만 잡고 나머지는 질문으로 넘긴다.
function heuristicExtract(utterance: string): ExtractedElements {
  const el: ExtractedElements = {};
  const top = scoreBenchmarks(utterance)[0];
  if (top && top.score >= 6 && utterance.includes(top.title.replace(/<|>/g, "").split(",")[0].slice(0, 3)))
    el.benchmark = top.title;
  const GENRE_HINTS: [RegExp, string][] = [
    [/복수/, "복수극"], [/코미디|유쾌|웃긴/, "코미디"], [/스릴러|긴장/, "스릴러"],
    [/로맨스|사랑|연애/, "로맨스"], [/공포|호러/, "공포"], [/판타지|마법/, "판타지"],
    [/SF|우주|미래/, "SF"], [/드라마/, "드라마"],
  ];
  for (const [re, g] of GENRE_HINTS) if (re.test(utterance)) { el.genre = el.genre ? el.genre : g; }
  if (/유쾌|통쾌/.test(utterance)) el.tone = "유쾌하고 통쾌한";
  if (/꿈에서|꿈 속|꿈속/.test(utterance)) {
    const m = utterance.match(/[^.\n!?]*꿈[^.\n!?]*[.!?\n]?/);
    if (m) el.scene = m[0].trim();
  }
  return el;
}

// POST { utterance } → { elements, questions, engine }
export async function POST(req: NextRequest) {
  let body: { utterance?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }
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
      elements = heuristicExtract(utterance);
      engine = "heuristic";
    } else {
      model = MODEL_LIGHT;
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
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

      const once = async (extra = "") => {
        const resp = await client.messages.create({
          model: model!,
          max_tokens: 1200,
          system,
          messages: [{ role: "user", content: utterance + extra }],
        });
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
