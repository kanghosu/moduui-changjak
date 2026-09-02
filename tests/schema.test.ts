import assert from "node:assert/strict";
import { test } from "node:test";
import { validateStructure, type Character, type Story } from "../engine/schema.ts";

const BLOCKS: Story["blocks"] = Array.from({ length: 24 }, (_, index) => ({
  index: index + 1,
  act: 1 as const,
  function: `기능 ${index + 1}`,
  isReversal: index === 12,
  antagonistEscalation: index === 8 || index === 13 || index === 17,
  bStory: index === 7 || index === 14 || index === 21,
}));

const PROTAGONIST: Character = {
  id: "protagonist",
  name: "주인공",
  role: "protagonist",
  want: "",
  need: "",
  arc: "",
};

const SUPPORTING: Character = {
  id: "supporting",
  name: "조연",
  role: "supporting",
  want: "",
  need: "",
  arc: "",
};

function storyWithCharacters(characters: Character[]): Story {
  return {
    logline: "로그라인",
    premise: "프리미스",
    genre: "드라마",
    target: "일반",
    tone: "잔잔한",
    characters,
    blocks: BLOCKS,
    reversalPointIndex: 13,
    notes: [],
  };
}

test("인물이 한 명 이하이면 적대자 없음 대신 인물 자료 미입력 경고를 낸다", () => {
  // Given: 인물이 비어 있거나 주인공 한 명만 입력된 이야기
  for (const characters of [[], [PROTAGONIST]]) {
    const story = storyWithCharacters(characters);

    // When: 구조를 검증한다
    const issues = validateStructure(story);

    // Then: 자료 미입력 경고를 내고 적대자 없음으로 단정하지 않는다
    assert.ok(issues.some((issue) => issue.level === "warn" && issue.message === "인물 자료가 입력되지 않았습니다"));
    assert.equal(issues.some((issue) => issue.message === "적대자가 없습니다."), false);
  }
});

test("인물이 두 명 이상이고 적대자 역할이 없으면 적대자 없음 경고를 낸다", () => {
  // Given: 주인공과 조연은 입력됐지만 적대자는 없는 이야기
  const story = storyWithCharacters([PROTAGONIST, SUPPORTING]);

  // When: 구조를 검증한다
  const issues = validateStructure(story);

  // Then: 기존 적대자 없음 경고를 유지하고 자료 미입력으로 바꾸지 않는다
  assert.ok(issues.some((issue) => issue.level === "warn" && issue.message === "적대자가 없습니다."));
  assert.equal(issues.some((issue) => issue.message === "인물 자료가 입력되지 않았습니다"), false);
});
