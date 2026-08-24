// 모두의 창작 — 자유 발화 창작 플로우 (정리 → 분석 → 확장 → 선택 → 배치)
// 회의 확정(2026-08-19): 질문지를 먼저 주지 않는다. 떠들게 하고, 추출하고, 부족한 것만 묻는다.
// 질문은 어떤 경우에도 10개를 넘지 않는다.

import type { GenerateInput } from "./mock";

/* ── 이야기 구성 요소 ─────────────────────────── */
export type ElementKey =
  | "scene"      // 인상적인 장면
  | "heroDesc"   // 주인공 (어떤 처지의 누구)
  | "heroName"   // 주인공 이름 (있으면)
  | "heroWant"   // 겉욕망
  | "heroNeed"   // 속결핍
  | "premise"    // 사건·소재
  | "theme"      // 주제 (무엇에 관한 이야기)
  | "ending"     // 원하는 결말·도착점
  | "genre"      // 장르
  | "tone"       // 톤
  | "era"        // 시대·배경 (선택)
  | "benchmark"  // 떠올랐던 영화
  | "choice"     // 주인공의 갈림길(선택지)
  | "hook";      // 나만의 차별점

export type ExtractedElements = Partial<Record<ElementKey, string>>;

/* ── 질문 풀 (최대 10, 초과 금지) ──────────────── */
// 정본: knowledge/method/question-pool.md (김태원 검수 대상). 이 배열은 그 문서와 1:1.
export interface CreationQuestion {
  id: string;
  elementKey: ElementKey;
  ask: string;
  hint?: string;
  priority: 1 | 2 | 3; // 낮을수록 먼저 묻는다
}

export const QUESTION_POOL: CreationQuestion[] = [
  { id: "q-scene", elementKey: "scene", priority: 1, ask: "머릿속에 가장 강렬하게 남아 있는 장면이 있나요?", hint: "꿈에서 본 한 컷이어도 좋아요. 없으면 '없음'이라고 해도 됩니다." },
  { id: "q-hero", elementKey: "heroDesc", priority: 1, ask: "주인공은 어떤 사람인가요?", hint: "이름은 없어도 돼요. '어떤 처지의 누구'면 충분합니다." },
  { id: "q-premise", elementKey: "premise", priority: 1, ask: "다루고 싶은 사건이나 소재는 무엇인가요?", hint: "뉴스, 경험, 상상 무엇이든." },
  { id: "q-theme", elementKey: "theme", priority: 2, ask: "무엇에 관한 이야기를 하고 싶나요?", hint: "한 단어여도 좋아요 — 복수, 가족, 성장…" },
  { id: "q-ending", elementKey: "ending", priority: 2, ask: "결말은 어떤 기분이면 좋겠나요?", hint: "출발점과 도착점을 막연하게라도. '딱히 없음'도 답입니다." },
  { id: "q-genre", elementKey: "genre", priority: 2, ask: "장르나 톤의 느낌이 있나요?", hint: "유쾌한, 비장한, 스릴러, 로맨스…" },
  { id: "q-benchmark", elementKey: "benchmark", priority: 2, ask: "이 이야기를 떠올렸을 때 생각난 영화가 있나요?", hint: "예: 기생충. 없으면 넘어가도 됩니다." },
  { id: "q-choice", elementKey: "choice", priority: 3, ask: "주인공이 놓이는 갈림길(선택)이 있나요?", hint: "있음/없음으로만 답해도 됩니다." },
  { id: "q-era", elementKey: "era", priority: 3, ask: "시대나 배경이 정해져 있나요?", hint: "없으면 건너뛰어도 됩니다." },
  { id: "q-hook", elementKey: "hook", priority: 3, ask: "'이건 나만 쓸 수 있다' 싶은 한 가지가 있나요?", hint: "대사 한 줄, 설정, 직접 겪은 경험…" },
];

export const MAX_QUESTIONS = 10;

// 추출로 채워지지 않은 요소만 골라 질문한다 (priority 순, 상한 강제)
export function missingQuestions(elements: ExtractedElements, cap = MAX_QUESTIONS): CreationQuestion[] {
  return QUESTION_POOL
    .filter((q) => !(elements[q.elementKey] || "").trim())
    .sort((a, b) => a.priority - b.priority)
    .slice(0, Math.min(cap, MAX_QUESTIONS));
}

/* ── 로그라인 3안 ─────────────────────────────── */
export interface LoglineOption {
  logline: string;        // 사맥 4줄: "~던 주인공이 ~한 사건을 겪으며 ~을 깨닫는 이야기"
  premise: string;
  direction: string;      // 갈등·결말 방향 라벨
  benchmarkTitle: string; // 라이브러리 실존 작품
  reason: string;         // 왜 이 벤치마크인가
}

/* ── 세션 (localStorage: mc_session) ───────────── */
export const SESSION_KEY = "mc_session";

export interface CreationSession {
  utterance: string;
  source: "text" | "voice" | "mixed";
  elements: ExtractedElements;
  questions: CreationQuestion[];       // 이번 세션에서 실제로 묻기로 한 것
  answers: Record<string, string>;     // questionId -> 답 (빈 답 = 건너뜀)
  loglineOptions: LoglineOption[];
  chosenIndex: number | null;
  deepenNote: string;                  // 심화 메모 (인물/사건/플롯/취재)
  hookNote: string;
  stage: 1 | 2 | 3 | 4 | 5;
}

export function emptySession(): CreationSession {
  return {
    utterance: "", source: "text", elements: {}, questions: [], answers: {},
    loglineOptions: [], chosenIndex: null, deepenNote: "", hookNote: "", stage: 1,
  };
}

// 질문 답변을 요소에 합친다
export function mergedElements(s: CreationSession): ExtractedElements {
  const merged: ExtractedElements = { ...s.elements };
  for (const q of s.questions) {
    const a = (s.answers[q.id] || "").trim();
    if (a && !/^없(음|어요?)$/.test(a)) merged[q.elementKey] = a;
  }
  return merged;
}

// 세션 → 기존 24블록 엔진 입력 계약 (engine/mock.ts GenerateInput)
export function sessionToGenerateInput(s: CreationSession): GenerateInput {
  const el = mergedElements(s);
  const opt = s.chosenIndex != null ? s.loglineOptions[s.chosenIndex] : undefined;
  const qa = s.questions
    .map((q) => {
      const a = (s.answers[q.id] || "").trim();
      return a ? `- ${q.ask} → ${a}` : null;
    })
    .filter(Boolean)
    .join("\n");
  const ideaNote = [
    s.utterance.trim(),
    el.scene ? `\n[인상적인 장면] ${el.scene}` : "",
    qa ? `\n[보충 답변]\n${qa}` : "",
    s.deepenNote.trim() ? `\n[심화 메모]\n${s.deepenNote.trim()}` : "",
  ].join("\n").trim();

  return {
    logline: opt?.logline || "",
    premise: el.premise || opt?.premise || "",
    genre: el.genre || "",
    target: "",
    tone: el.tone || "",
    hookNote: s.hookNote.trim() || el.hook || "",
    benchmarkName: opt?.benchmarkTitle || el.benchmark || undefined,
    ideaNote,
    theme: el.theme || "",
    heroName: el.heroName || "",
    heroWant: el.heroWant || "",
    heroNeed: el.heroNeed || "",
  };
}
