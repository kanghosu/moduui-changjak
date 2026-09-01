import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { isFallbackWorthy } from "../engine/anthropic-client.ts";

function apiError(status: number, type = "api_error") {
  return new Anthropic.APIError(status, { type }, `Anthropic ${status}`, undefined);
}

test("isFallbackWorthy는 Anthropic 인증·크레딧·서버 오류와 알 수 없는 예외를 폴백 대상으로 판정한다", () => {
  // Given: Anthropic SDK가 반환할 수 있는 인증·권한·크레딧·서버 오류와 SDK 밖의 예외
  const errors = [401, 403, 429, 500].map((status) => apiError(status));

  // When: 각 오류를 폴백 가능 여부로 판정한다
  const decisions = [...errors, new Error("알 수 없는 호출 실패")].map(isFallbackWorthy);

  // Then: 서비스가 계속 동작할 수 있는 폴백 경로로 전환한다
  assert.deepEqual(decisions, [true, true, true, true, true]);
});

test("isFallbackWorthy는 Anthropic 설정 오류인 invalid_request 400을 폴백 대상으로 판정한다", () => {
  // Given: 요청 형식은 유효하지만 Anthropic 설정이 잘못된 400 응답
  const error = apiError(400, "invalid_request_error");

  // When: 폴백 가능 여부를 판정한다
  const decision = isFallbackWorthy(error);

  // Then: 사용자에게 Anthropic 원문을 노출하지 않고 무키 경로로 전환한다
  assert.equal(decision, true);
});
