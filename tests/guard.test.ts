import { test } from "node:test";
import assert from "node:assert/strict";
import { guardConfig, limitDecision, tooLong } from "../engine/guard.ts";

test("guardConfig는 숫자 환경변수와 잘못된 값의 기본값을 구분한다", () => {
  // Given: 일부 값은 유효하고 일부 값은 빈 문자열·음수·NaN이다
  const config = guardConfig({
    GUARD_RPM: "12",
    GUARD_DAILY: "",
    GUARD_MAX_INPUT: "-1",
    GUARD_DISABLED: "0",
  });

  // When: 환경변수 설정을 가드 설정으로 변환한다
  // Then: 유효한 값만 반영하고 나머지는 기본값을 쓴다
  assert.equal(config.rpm, 12);
  assert.equal(config.daily, 300);
  assert.equal(config.maxInput, 4000);
  assert.equal(config.disabled, false);
  assert.equal(guardConfig({ GUARD_RPM: "NaN" }).rpm, 6);
});

test("tooLong은 최대 길이 경계를 정확히 판정한다", () => {
  // Given: 최대 길이가 4자인 입력 두 개
  const atLimit = "네글자값";
  const overLimit = `${atLimit}초과`;

  // When: 각각 최대 길이와 비교한다
  // Then: 경계값은 통과하고 한 글자 초과만 막는다
  assert.equal(tooLong(atLimit, 4), false);
  assert.equal(tooLong(overLimit, 4), true);
});

test("limitDecision은 분당 한도를 넘으면 rate 사유를 반환한다", () => {
  // Given: IP별 요청 수가 분당 한도보다 많다
  const config = guardConfig({ GUARD_RPM: "6", GUARD_DAILY: "300" });

  // When: 분당·일일 한도를 함께 판정한다
  const decision = limitDecision({ perIpCount: 7, dailyCount: 1, config });

  // Then: 분당 제한으로 거부한다
  assert.deepEqual(decision, { allowed: false, reason: "rate" });
});

test("limitDecision은 일일 한도를 넘으면 daily 사유를 반환한다", () => {
  // Given: 전체 일일 요청 수가 일일 한도보다 많다
  const config = guardConfig({ GUARD_RPM: "6", GUARD_DAILY: "300" });

  // When: 분당·일일 한도를 함께 판정한다
  const decision = limitDecision({ perIpCount: 1, dailyCount: 301, config });

  // Then: 일일 제한으로 거부한다
  assert.deepEqual(decision, { allowed: false, reason: "daily" });
});

test("limitDecision은 두 한도에 여유가 있으면 허용한다", () => {
  // Given: 분당·일일 카운터가 각각의 한도 이내다
  const config = guardConfig({ GUARD_RPM: "6", GUARD_DAILY: "300" });

  // When: 한도를 판정한다
  const decision = limitDecision({ perIpCount: 6, dailyCount: 300, config });

  // Then: 요청을 허용한다
  assert.deepEqual(decision, { allowed: true });
});

test("GUARD_DISABLED가 1이면 limitDecision이 모든 카운터를 통과시킨다", () => {
  // Given: 비활성화 설정과 이미 초과한 카운터가 있다
  const config = guardConfig({ GUARD_DISABLED: "1", GUARD_RPM: "0", GUARD_DAILY: "0" });

  // When: 한도를 판정한다
  const decision = limitDecision({ perIpCount: 999, dailyCount: 999, config });

  // Then: 비활성화 상태에서는 허용한다
  assert.deepEqual(decision, { allowed: true });
});
