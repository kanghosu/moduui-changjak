import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendLoglineHistory,
  emptySession,
  MAX_QUESTIONS,
  mergedElements,
  missingQuestions,
  normalizeElements,
  repeatQuestionRate,
  spokenElements,
  type CreationQuestion,
  type LoglineOption,
} from "../engine/creation.ts";

function option(id: string): LoglineOption {
  return {
    logline: `로그라인 ${id}`,
    premise: `사건 ${id}`,
    direction: `방향 ${id}`,
    benchmarkTitle: `작품 ${id}`,
    reason: `이유 ${id}`,
  };
}

test("로그라인 히스토리는 최근 3세트만 보관한다", () => {
  const history = [[option("1")], [option("2")], [option("3")]];

  const next = appendLoglineHistory(history, [option("4")]);

  assert.deepEqual(next.map((set) => set[0]?.logline), ["로그라인 2", "로그라인 3", "로그라인 4"]);
});

test("옛 문자열 형식 요소를 high 신뢰도 객체로 승격한다", () => {
  // Given: localStorage에 저장된 옛 문자열 형식 세션 요소
  const legacyElements = { heroDesc: "평범한 회사원" };

  // When: 저장 형식을 정규화한다
  const normalized = normalizeElements(legacyElements);

  // Then: 값과 high 신뢰도만 보존하고 근거는 추정하지 않는다
  assert.deepEqual(normalized.heroDesc, { value: "평범한 회사원", confidence: "high", source: "user" });
  assert.equal(normalized.heroDesc?.evidence, undefined);
});

test("옛 형식 세션에서 이미 채워진 요소를 다시 묻지 않는다", () => {
  // Given: 옛 세션의 주인공 요소를 새 형식으로 정규화한 상태
  const legacySession = { ...emptySession(), elements: { heroDesc: "평범한 회사원" } };
  const elements = normalizeElements(legacySession.elements);

  // When: 빈칸 질문 목록을 계산한다
  const questions = missingQuestions(elements);

  // Then: 이미 채워진 주인공 질문은 목록에 없다
  assert.equal(questions.some((question) => question.elementKey === "heroDesc"), false);
});

test("unknown 요소는 질문 목록에 나오지 않는다", () => {
  // Given: 사용자가 해당 요소가 없다고 명시한 상태
  const elements = {
    scene: { value: "", confidence: "high" as const, unknown: true, source: "user" as const },
  };

  // When: 빈칸 질문 목록을 계산한다
  const questions = missingQuestions(elements);

  // Then: unknown 요소는 비어 있어도 다시 묻지 않는다
  assert.equal(questions.some((question) => question.elementKey === "scene"), false);
});

test("값이 없는 요소는 여전히 질문 목록에 나온다", () => {
  // Given: 값만 비어 있고 unknown 표시는 없는 요소
  const elements = {
    heroDesc: { value: "", confidence: "high" as const, source: "user" as const },
  };

  // When: 빈칸 질문 목록을 계산한다
  const questions = missingQuestions(elements);

  // Then: 해당 요소는 보충 질문 대상이다
  assert.equal(questions.some((question) => question.elementKey === "heroDesc"), true);
});

test("질문 목록은 MAX_QUESTIONS 상한을 유지한다", () => {
  // Given: 모든 요소가 비어 있는 상태와 상한보다 큰 요청
  // When: 질문 목록을 계산한다
  const questions = missingQuestions({}, MAX_QUESTIONS + 5);

  // Then: 질문 수는 항상 상한 이하이다
  assert.equal(questions.length, MAX_QUESTIONS);
});

test("repeatQuestionRate는 근거 있는 반복 질문을 세고 빈 목록은 0이다", () => {
  // Given: 한 질문에는 추출 근거가 있고 다른 질문에는 근거가 없다
  const elements = {
    heroDesc: {
      value: "평범한 회사원",
      evidence: "주인공은 평범한 회사원",
      confidence: "high" as const,
      source: "extracted" as const,
    },
  };
  const questions: CreationQuestion[] = [
    { id: "q-hero", elementKey: "heroDesc", ask: "", priority: 1 },
    { id: "q-theme", elementKey: "theme", ask: "", priority: 2 },
  ];

  // When: 반복질문률을 계산한다
  const rate = repeatQuestionRate(elements, questions);

  // Then: 근거가 있는 한 질문만 반복으로 집계하고 빈 목록은 0이다
  assert.equal(rate, 0.5);
  assert.equal(repeatQuestionRate(elements, []), 0);
});

test("mergedElements는 사용자 답 '없음'을 unknown 요소로 만든다", () => {
  // Given: 주인공 질문에 사용자가 없음이라고 답한 세션
  const question: CreationQuestion = {
    id: "q-hero",
    elementKey: "heroDesc",
    ask: "",
    priority: 1,
  };
  const session = {
    ...emptySession(),
    questions: [question],
    answers: { [question.id]: "없음" },
  };

  // When: 추출 요소와 질문 답변을 병합한다
  const merged = mergedElements(session);

  // Then: 빈 값을 unknown으로 기록해 같은 질문을 다시 묻지 않는다
  assert.deepEqual(merged.heroDesc, {
    value: "",
    confidence: "high",
    evidence: "없음",
    unknown: true,
    source: "user",
  });
});

test("spokenElements는 source가 user인 요소를 반환한다", () => {
  // Given: 사용자가 직접 말한 요소가 세션에 저장된 상태
  const session = {
    ...emptySession(),
    elements: {
      heroDesc: { value: "평범한 회사원", confidence: "high" as const, source: "user" as const },
    },
  };

  // When: 사용자가 실제로 말한 요소를 추린다
  const spoken = spokenElements(session);

  // Then: user 출처 요소가 결과에 포함된다
  assert.deepEqual(spoken.heroDesc, {
    value: "평범한 회사원",
    confidence: "high",
    source: "user",
  });
});

test("spokenElements는 source가 extracted인 요소를 제외한다", () => {
  // Given: 추출기가 채운 요소만 있는 세션
  const session = {
    ...emptySession(),
    elements: {
      scene: { value: "옥상 장면", confidence: "low" as const, source: "extracted" as const },
    },
  };

  // When: 사용자가 실제로 말한 요소를 추린다
  const spoken = spokenElements(session);

  // Then: extracted 출처 요소는 사용자 발화로 취급하지 않는다
  assert.equal(spoken.scene, undefined);
});

test("spokenElements는 없음 답변을 user unknown 요소로 포함한다", () => {
  // Given: 사용자가 질문에 없음이라고 명시적으로 답한 세션
  const question: CreationQuestion = {
    id: "q-scene",
    elementKey: "scene",
    ask: "",
    priority: 1,
  };
  const session = {
    ...emptySession(),
    questions: [question],
    answers: { [question.id]: "없음" },
  };

  // When: 사용자가 실제로 말한 요소를 추린다
  const spoken = spokenElements(session);

  // Then: 명시적 없음이 다시 묻지 않는 user unknown으로 기록된다
  assert.deepEqual(spoken.scene, {
    value: "",
    confidence: "high",
    evidence: "없음",
    unknown: true,
    source: "user",
  });
});

test("spokenElements는 answers에 키가 없는 질문을 포함하지 않는다", () => {
  // Given: 질문은 있지만 사용자가 아직 답하지 않은 세션
  const question: CreationQuestion = {
    id: "q-scene",
    elementKey: "scene",
    ask: "",
    priority: 1,
  };
  const session = { ...emptySession(), questions: [question], answers: {} };

  // When: 사용자가 실제로 말한 요소를 추린다
  const spoken = spokenElements(session);

  // Then: 아직 보지 않은 질문은 결과에 들어가지 않는다
  assert.equal(spoken.scene, undefined);
});

test("재추출 병합은 사용자가 없음이라고 한 요소를 보존하고 다시 묻지 않는다", () => {
  // Given: 새 추출 결과와 사용자의 명시적 없음 답변이 함께 있는 세션
  const question: CreationQuestion = {
    id: "q-scene",
    elementKey: "scene",
    ask: "",
    priority: 1,
  };
  const fresh = {
    scene: { value: "새로 추출된 장면", confidence: "high" as const, source: "extracted" as const },
  };
  const session = {
    ...emptySession(),
    questions: [question],
    answers: { [question.id]: "없음" },
  };

  // When: 새 추출 결과 위에 사용자가 말한 내용을 병합한다
  const elements = { ...fresh, ...spokenElements(session) };

  // Then: 사용자의 unknown이 우선하고 해당 요소는 다시 질문하지 않는다
  assert.deepEqual(elements.scene, {
    value: "",
    confidence: "high",
    evidence: "없음",
    unknown: true,
    source: "user",
  });
  assert.equal(missingQuestions(elements).some((item) => item.elementKey === "scene"), false);
});

test("normalizeElements는 source가 없는 옛 객체를 user로 승격한다", () => {
  // Given: source 필드가 없던 이전 세션 객체
  const legacyElements = {
    heroDesc: { value: "평범한 회사원", confidence: "high" as const },
  };

  // When: 저장 형식을 정규화한다
  const normalized = normalizeElements(legacyElements);

  // Then: 출처를 user로 보수적으로 보강한다
  assert.equal(normalized.heroDesc?.source, "user");
});
