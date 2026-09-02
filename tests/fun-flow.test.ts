import { test } from "node:test";
import assert from "node:assert/strict";
import { emptySession, QUESTION_POOL } from "../engine/creation.ts";
import {
  classifyElement,
  deriveWorkProgress,
  highlightLogline,
  profileElementState,
  profileElementsFromSession,
} from "../components/create/funFlow.ts";

test("프로필 요소는 확정·명시적 없음·빈칸을 구분한다", () => {
  const session = {
    ...emptySession(),
    elements: {
      premise: { value: "사라진 편지를 찾는 일", confidence: "high" as const, source: "user" as const },
      scene: { value: "", confidence: "high" as const, unknown: true, source: "user" as const },
    },
    questions: [QUESTION_POOL[0]],
    answers: {},
  };
  const elements = profileElementsFromSession(session);

  assert.equal(classifyElement(elements.premise), "confirmed");
  assert.equal(classifyElement(elements.scene), "unknown");
  assert.equal(classifyElement(elements.ending), "empty");
});

test("confidence가 low인 값은 AI 추측으로 표시할 수 있다", () => {
  const state = profileElementState({
    key: "genre",
    label: "장르",
    element: { value: "느와르", confidence: "low", source: "extracted" },
  });

  assert.equal(state.status, "confirmed");
  assert.equal(state.confidence, "low");
  assert.equal(state.isAiGuess, true);
});

test("작품 단위 진행은 요소 상태를 사용자 언어로 매핑한다", () => {
  const progress = deriveWorkProgress(
    {
      premise: { value: "사건", confidence: "high", source: "user" },
      ending: { value: "", confidence: "high", unknown: true, source: "user" },
    },
    [
      { key: "premise", label: "핵심 갈등" },
      { key: "ending", label: "결말" },
      { key: "heroDesc", label: "주인공" },
    ],
  );

  assert.deepEqual(progress.map((item) => [item.label, item.status]), [
    ["핵심 갈등", "confirmed"],
    ["결말", "unknown"],
    ["주인공", "empty"],
  ]);
});

test("로그라인 하이라이트는 빈 답과 특수문자를 안전하게 처리한다", () => {
  const segments = highlightLogline("주인공이 [낯선] 도시에서 복수한다.", ["[낯선]", "", "없음", "복수"]);

  assert.deepEqual(
    segments.filter((segment) => segment.highlighted).map((segment) => segment.text),
    ["[낯선]", "복수"],
  );
  assert.doesNotThrow(() => highlightLogline("문장", ["[", "\\", "^"]));
  assert.equal(highlightLogline("문장", ["", "없음"]).some((segment) => segment.highlighted), false);
});
