import { test } from "node:test";
import assert from "node:assert/strict";
import en from "../messages/en.json" with { type: "json" };
import ko from "../messages/ko.json" with { type: "json" };
import zh from "../messages/zh.json" with { type: "json" };
import { getDictionary, pickLangFromAcceptLanguage, t, type Dictionary } from "../lib/i18n.ts";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
}

test("세 언어 사전은 같은 leaf 키 집합을 가진다", () => {
  // Given: 영어·한국어·중국어 사전이 로드되어 있다
  const expected = leafKeys(en).sort();

  // When: 각 사전의 leaf 키를 비교한다
  const actual = [leafKeys(ko).sort(), leafKeys(zh).sort()];

  // Then: 두 번역 사전이 영어와 같은 키 집합을 가진다
  assert.deepEqual(actual, [expected, expected]);
});

test("t는 번역에 없는 중첩 키를 영어 값으로 폴백한다", () => {
  // Given: hero.cta만 있는 부분 사전과 영어 기본 사전
  const partial: Dictionary = { hero: { cta: "번역된 CTA" } };

  // When: 번역되지 않은 hero.sub를 조회한다
  const value = t(partial, "hero.sub");

  // Then: 영어 사전의 값을 반환한다
  assert.equal(value, t(getDictionary("en"), "hero.sub"));
});

test("Accept-Language의 최고 q 언어를 지원 언어로 선택한다", () => {
  // Given: 지원 언어와 비지원 언어가 섞인 Accept-Language 헤더들
  const cases: readonly [string | null, "en" | "ko" | "zh"][] = [
    ["ko-KR,ko;q=0.9,en;q=0.8", "ko"],
    ["en-US,ko;q=0.5", "en"],
    ["zh-CN,zh;q=0.9", "zh"],
    ["zh-TW", "zh"],
    ["", "en"],
    [null, "en"],
    ["fr", "en"],
  ];

  // When: 각 헤더를 순수 파서에 전달한다
  const actual = cases.map(([header]) => pickLangFromAcceptLanguage(header));

  // Then: 최고 우선순위의 primary subtag만 라우팅 언어로 반영한다
  assert.deepEqual(actual, cases.map(([, expected]) => expected));
});
