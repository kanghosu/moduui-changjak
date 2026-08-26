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

// 키 없이도 데모가 돌도록 하는 폴백 추출기.
// LLM을 대체하지는 못하지만, 한국어에서 흔한 표현은 잡아내 "이미 말한 걸 다시 묻는" 실패를 줄인다.
// (2026-08-25: 주인공을 말했는데도 되묻는 문제가 실사용 검증에서 발견되어 보강)
function heuristicExtract(utterance: string): ExtractedElements {
  const el: ExtractedElements = {};
  const text = utterance.replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  const find = (re: RegExp) => sentences.find((x) => re.test(x));
  const cap = (m: RegExpMatchArray | null, i = 1) => {
    const v = m?.[i]?.trim().replace(/[,.!?"'’”]+$/, "");
    return v && v.length >= 2 ? v : undefined;
  };

  // 인상적인 장면 — 장면을 언급한 문장을 통째로 살린다 (내용을 잘라먹지 않는 것이 핵심)
  const sceneSent = find(/장면|씬|이미지가|그림이/) || find(/꿈에서|꿈 ?속/);
  if (sceneSent) {
    const idx = sentences.indexOf(sceneSent);
    const next = sentences[idx + 1];
    el.scene = next && /인데|건데|장면|거기서|주인공|그때/.test(next) ? sceneSent + " " + next : sceneSent;
  }

  // 주인공 — "주인공은 X", "X인 주인공"
  const heroDesc =
    cap(text.match(/주인공은\s*([^.!?]{2,40}?)(?:이었으면|였으면|이면|이고|이다|입니다|예요|이에요|[.!?]|$)/)) ||
    cap(text.match(/([^\s.!?]{2,20}(?:인|한|의))\s*주인공/)) ||
    cap(text.match(/주인공(?:이|으로)\s*([^.!?]{2,30}?)(?:이었|였|으로|[.!?]|$)/));
  if (heroDesc && !/어떤|누구|잘 모르|모르겠/.test(heroDesc)) el.heroDesc = heroDesc;

  // 사건·소재
  const premise =
    cap(text.match(/([^.!?]{4,40})(?:하는|라는)\s*(?:사건|이야기|내용)/)) ||
    cap(text.match(/(?:소재는|사건은)\s*([^.!?]{2,40})/));
  if (premise) el.premise = premise;

  // 주제
  const theme = cap(text.match(/([^.!?]{2,30})(?:에 관한|에 대한)\s*(?:이야기|것)/));
  if (theme) el.theme = theme;

  // 결말
  const ending =
    cap(text.match(/(?:결말은|끝은|마지막은)\s*([^.!?]{2,40})/)) ||
    cap(text.match(/([^.!?]{2,30})(?:로|으로)\s*(?:끝났으면|끝나면|마무리)/));
  if (ending) el.ending = ending;

  // 시대·배경
  const era = cap(text.match(/(\d{2,4}년대?|조선\s*시대|고려\s*시대|근미래|일제\s*강점기)/));
  if (era) el.era = era;

  const GENRE_HINTS: [RegExp, string][] = [
    [/복수/, "복수극"], [/코미디|유쾌|웃긴/, "코미디"], [/스릴러|긴장/, "스릴러"],
    [/로맨스|사랑|연애/, "로맨스"], [/공포|호러/, "공포"], [/판타지|마법/, "판타지"],
    [/SF|우주|미래/, "SF"], [/드라마/, "드라마"],
  ];
  for (const [re, g] of GENRE_HINTS) if (!el.genre && re.test(text)) el.genre = g;

  const TONE_HINTS: [RegExp, string][] = [
    [/유쾌[^.!?]*통쾌|통쾌[^.!?]*유쾌/, "유쾌하고 통쾌한"], [/통쾌/, "통쾌한"], [/유쾌/, "유쾌한"],
    [/비장|묵직|무겁/, "비장한"], [/따뜻|잔잔/, "따뜻하고 잔잔한"], [/어둡|암울/, "어두운"],
  ];
  for (const [re, t] of TONE_HINTS) if (!el.tone && re.test(text)) el.tone = t;

  // 참고 영화 — 라이브러리 제목이 발화에 실제로 등장할 때만
  const top = scoreBenchmarks(text)[0];
  if (top) {
    const plain = top.title.replace(/[<>]/g, "").split(",")[0].trim();
    if (plain.length >= 2 && text.includes(plain)) el.benchmark = top.title;
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
