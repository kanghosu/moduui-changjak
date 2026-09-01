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

export type ElementConfidence = "high" | "low";
export type ElementSource = "user" | "extracted";

export interface ExtractedElement {
  /** 뽑아낸 값. unknown이면 빈 문자열일 수 있다 */
  value: string;
  /** 원문에서 이 값의 근거가 된 구간. 없으면 근거 없이 만들어진 값이다 */
  evidence?: string;
  confidence: ElementConfidence;
  /** 사용자가 "없음/모름"이라고 명시했다. 다시 묻지 않는다 */
  unknown?: boolean;
  /** 이 값이 어디서 왔나. user는 사용자가 직접 말하거나 답한 것이라 재추출이 덮지 않는다 */
  source: ElementSource;
}

export type ExtractedElements = Partial<Record<ElementKey, ExtractedElement>>;

/* ── 질문 풀 (최대 10, 초과 금지) ──────────────── */
// 정본: knowledge/method/question-pool.md (김태원 검수 대상). 이 배열은 그 문서와 1:1.
export interface CreationQuestion {
  id: string;
  elementKey: ElementKey;
  ask: string;
  hint?: string;
  makes?: string;
  priority: 1 | 2 | 3; // 낮을수록 먼저 묻는다
}

export const QUESTION_POOL: CreationQuestion[] = [
  { id: "q-scene", elementKey: "scene", priority: 1, ask: "머릿속에 가장 강렬하게 남아 있는 장면이 있나요?", hint: "꿈에서 본 한 컷이어도 좋아요. 없으면 '없음'이라고 해도 됩니다.", makes: "이야기의 핵심 장면이 잡혀요." },
  { id: "q-hero", elementKey: "heroDesc", priority: 1, ask: "주인공은 어떤 사람인가요?", hint: "이름은 없어도 돼요. '어떤 처지의 누구'면 충분합니다.", makes: "주인공의 모습과 성향이 선명해져요." },
  { id: "q-premise", elementKey: "premise", priority: 1, ask: "다루고 싶은 사건이나 소재는 무엇인가요?", hint: "뉴스, 경험, 상상 무엇이든.", makes: "핵심 갈등의 씨앗이 정해져요." },
  { id: "q-theme", elementKey: "theme", priority: 2, ask: "무엇에 관한 이야기를 하고 싶나요?", hint: "한 단어여도 좋아요 — 복수, 가족, 성장…", makes: "이야기가 건드릴 주제가 잡혀요." },
  { id: "q-ending", elementKey: "ending", priority: 2, ask: "결말은 어떤 기분이면 좋겠나요?", hint: "출발점과 도착점을 막연하게라도. '딱히 없음'도 답입니다.", makes: "이야기의 도착점이 정해져요." },
  { id: "q-genre", elementKey: "genre", priority: 2, ask: "장르나 톤의 느낌이 있나요?", hint: "유쾌한, 비장한, 스릴러, 로맨스…", makes: "이야기의 장르와 결이 잡혀요." },
  { id: "q-benchmark", elementKey: "benchmark", priority: 2, ask: "이 이야기를 떠올렸을 때 생각난 영화가 있나요?", hint: "예: 기생충. 없으면 넘어가도 됩니다.", makes: "참고할 이야기의 결이 연결돼요." },
  { id: "q-choice", elementKey: "choice", priority: 3, ask: "주인공이 놓이는 갈림길(선택)이 있나요?", hint: "있음/없음으로만 답해도 됩니다.", makes: "주인공이 맞닥뜨릴 갈림길이 생겨요." },
  { id: "q-era", elementKey: "era", priority: 3, ask: "시대나 배경이 정해져 있나요?", hint: "없으면 건너뛰어도 됩니다.", makes: "이야기가 펼쳐질 시간과 장소가 잡혀요." },
  { id: "q-hook", elementKey: "hook", priority: 3, ask: "'이건 나만 쓸 수 있다' 싶은 한 가지가 있나요?", hint: "대사 한 줄, 설정, 직접 겪은 경험…", makes: "당신만의 차별점이 기록돼요." },
];

export const MAX_QUESTIONS = 10;

const ELEMENT_KEYS: readonly ElementKey[] = QUESTION_POOL.map((question) => question.elementKey);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isElementConfidence(value: unknown): value is ElementConfidence {
  return value === "high" || value === "low";
}

function isElementSource(value: unknown): value is ElementSource {
  return value === "user" || value === "extracted";
}

export function normalizeElements(raw: unknown): ExtractedElements {
  const normalized: ExtractedElements = {};
  if (!isRecord(raw)) return normalized;

  for (const key of ELEMENT_KEYS) {
    const candidate = raw[key];
    if (typeof candidate === "string") {
      if (candidate.trim()) normalized[key] = { value: candidate, confidence: "high", source: "user" };
      continue;
    }

    if (!isRecord(candidate)) continue;
    const value = candidate.value;
    const confidence = candidate.confidence;
    const evidence = candidate.evidence;
    const unknown = candidate.unknown;
    const source = candidate.source;
    if (typeof value !== "string" || !isElementConfidence(confidence)) continue;
    if (evidence !== undefined && typeof evidence !== "string") continue;
    if (unknown !== undefined && typeof unknown !== "boolean") continue;
    if (source !== undefined && !isElementSource(source)) continue;
    if (!value.trim() && unknown !== true) continue;

    const element: ExtractedElement = { value, confidence, source: source ?? "user" };
    if (evidence !== undefined) element.evidence = evidence;
    if (unknown !== undefined) element.unknown = unknown;
    normalized[key] = element;
  }

  return normalized;
}

export function spokenElements(s: CreationSession): ExtractedElements {
  const spoken: ExtractedElements = {};
  const normalized = normalizeElements(s.elements);

  for (const key of ELEMENT_KEYS) {
    const element = normalized[key];
    if (element?.source === "user") spoken[key] = element;
  }

  for (const question of s.questions) {
    const answer = s.answers[question.id];
    if (answer === undefined) continue;

    const trimmedAnswer = answer.trim();
    const unknown = trimmedAnswer === "" || /^없(음|어요?)$/.test(trimmedAnswer);
    spoken[question.elementKey] = {
      value: unknown ? "" : trimmedAnswer,
      confidence: "high",
      evidence: answer,
      ...(unknown ? { unknown: true } : {}),
      source: "user",
    };
  }

  return spoken;
}

// 추출로 채워지지 않은 요소만 골라 질문한다 (priority 순, 상한 강제)
export function missingQuestions(elements: ExtractedElements, cap = MAX_QUESTIONS): CreationQuestion[] {
  return QUESTION_POOL
    .filter((q) => {
      const element = elements[q.elementKey];
      return !element || (element.unknown !== true && element.value.trim() === "");
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, Math.min(cap, MAX_QUESTIONS));
}

export function repeatQuestionRate(
  elements: ExtractedElements,
  questions: readonly CreationQuestion[],
): number {
  if (questions.length === 0) return 0;
  const repeatedQuestions = questions.filter((question) => Boolean(elements[question.elementKey]?.evidence?.trim()));
  return repeatedQuestions.length / questions.length;
}

/* ── 로그라인 3안 ─────────────────────────────── */
export interface LoglineOption {
  logline: string;        // 사맥 4줄: "~던 주인공이 ~한 사건을 겪으며 ~을 깨닫는 이야기"
  premise: string;
  direction: string;      // 갈등·결말 방향 라벨
  benchmarkTitle: string; // 라이브러리 실존 작품
  reason: string;         // 왜 이 벤치마크인가
}

/** 재생성 전의 로그라인 세트를 최근 3개까지만 보관한다. */
export function appendLoglineHistory(
  history: LoglineOption[][] | undefined,
  previous: LoglineOption[],
): LoglineOption[][] {
  const existing = history ?? [];
  return previous.length === 0 ? [...existing] : [...existing, previous].slice(-3);
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
  loglineHistory?: LoglineOption[][];
  chosenIndex: number | null;
  deepenNote: string;                  // 심화 메모 (인물/사건/플롯/취재)
  hookNote: string;
  stage: 1 | 2 | 3 | 4 | 5;
}

export function emptySession(): CreationSession {
  return {
    utterance: "", source: "text", elements: {}, questions: [], answers: {},
    loglineOptions: [], loglineHistory: [], chosenIndex: null, deepenNote: "", hookNote: "", stage: 1,
  };
}

// 질문 답변을 요소에 합친다
export function mergedElements(s: CreationSession): ExtractedElements {
  const merged = normalizeElements(s.elements);
  for (const q of s.questions) {
    const a = (s.answers[q.id] || "").trim();
    const unknown = !a || /^없(음|어요?)$/.test(a);
    merged[q.elementKey] = {
      value: unknown ? "" : a,
      confidence: "high",
      evidence: a,
      ...(unknown ? { unknown: true } : {}),
      source: "user",
    };
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
    el.scene?.value ? `\n[인상적인 장면] ${el.scene.value}` : "",
    qa ? `\n[보충 답변]\n${qa}` : "",
    s.deepenNote.trim() ? `\n[심화 메모]\n${s.deepenNote.trim()}` : "",
  ].join("\n").trim();

  return {
    logline: opt?.logline || "",
    premise: el.premise?.value || opt?.premise || "",
    genre: el.genre?.value || "",
    target: "",
    tone: el.tone?.value || "",
    hookNote: s.hookNote.trim() || el.hook?.value || "",
    benchmarkName: opt?.benchmarkTitle || el.benchmark?.value || undefined,
    ideaNote,
    theme: el.theme?.value || "",
    heroName: el.heroName?.value || "",
    heroWant: el.heroWant?.value || "",
    heroNeed: el.heroNeed?.value || "",
  };
}
