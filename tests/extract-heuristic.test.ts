// 핵심 약속 회귀 테스트 — "이미 말한 것은 다시 묻지 않는다"
// 이 약속이 깨지면 제품의 존재 이유가 사라진다(PRD v2 §3-2, §4).
// 실행: npm test   (Node 내장 러너 — 새 의존성 없음)

import { test } from "node:test";
import assert from "node:assert/strict";
import { heuristicExtract } from "../engine/extract-heuristic.ts";
import { missingQuestions, MAX_QUESTIONS, QUESTION_POOL } from "../engine/creation.ts";

/** 발화 → 추출 → 남은 질문의 elementKey 집합 */
function askedKeys(utterance: string): Set<string> {
  const el = heuristicExtract(utterance);
  return new Set(missingQuestions(el).map((q) => q.elementKey));
}

test("말한 요소는 다시 묻지 않는다 — 주인공", () => {
  const asked = askedKeys("유쾌한 복수극이면 좋겠고, 주인공은 평범한 회사원이었으면 해요.");
  assert.ok(!asked.has("heroDesc"), "주인공을 말했는데 다시 묻고 있다");
});

test("말한 요소는 다시 묻지 않는다 — 장면·장르·톤·결말", () => {
  const utterance =
    "꿈에서 본 장면이 하나 있어요. 옥상에서 주인공이 비리 서류를 쥐고 망설이는 장면인데 강렬해요. " +
    "유쾌하면서도 통쾌한 복수극이면 좋겠어요. 결말은 후련했으면 좋겠어요.";
  const asked = askedKeys(utterance);
  for (const key of ["scene", "genre", "tone", "ending"]) {
    assert.ok(!asked.has(key), `${key}를 말했는데 다시 묻고 있다`);
  }
});

test("장면은 내용이 잘리지 않고 보존된다", () => {
  const el = heuristicExtract(
    "꿈에서 본 장면이 하나 있어요. 옥상에서 주인공이 비리 서류를 쥐고 망설이는 장면인데 강렬해요."
  );
  assert.ok(el.scene, "장면을 추출하지 못했다");
  assert.ok(el.scene!.includes("옥상"), "장면 내용이 잘렸다 — 첫 문장만 남았을 가능성");
  assert.ok(el.scene!.includes("비리"), "장면 내용이 잘렸다");
});

test("질문은 어떤 입력에도 10개를 넘지 않는다", () => {
  for (const utterance of ["", "안녕", "그냥 뭔가 만들고 싶어요", "가".repeat(500)]) {
    const asked = missingQuestions(heuristicExtract(utterance));
    assert.ok(asked.length <= MAX_QUESTIONS, `질문이 ${asked.length}개로 상한을 넘었다`);
  }
});

test("질문 풀은 10개이고 elementKey가 중복되지 않는다", () => {
  assert.equal(QUESTION_POOL.length, 10);
  const keys = new Set(QUESTION_POOL.map((q) => q.elementKey));
  assert.equal(keys.size, QUESTION_POOL.length, "elementKey가 중복된 질문이 있다");
});

test("말한 것이 없으면 질문으로 채운다", () => {
  const asked = askedKeys("뭔가 재밌는 걸 만들고 싶어요");
  assert.ok(asked.size >= 5, "아무것도 못 들었는데 질문이 너무 적다");
});

test("모르겠다는 답을 주인공으로 오인하지 않는다", () => {
  const el = heuristicExtract("주인공은 아직 잘 모르겠어요.");
  assert.equal(el.heroDesc, undefined, "'모르겠다'를 주인공 설정으로 잘못 잡았다");
});
