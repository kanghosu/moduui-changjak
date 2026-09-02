// 모델 계약 어댑터 회귀 테스트
// 핵심: 모르는 새 모델이 나와도 최신 계약으로 처리되어야 한다(코드 수정 없이).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capabilitiesOf, buildRequestParams, shouldStream, refusalOf,
} from "../engine/model-capabilities.ts";

test("fable은 thinking을 끌 수 없다 — disabled를 보내면 400이다", () => {
  const caps = capabilitiesOf("claude-fable-5");
  assert.equal(caps.canDisableThinking, false);
  const p = buildRequestParams("claude-fable-5", { disableThinking: true });
  assert.equal(p.thinking, undefined, "fable에 thinking:disabled를 보내면 안 된다");
});

test("fable은 샘플링 파라미터를 받지 않는다", () => {
  const p = buildRequestParams("claude-fable-5", { temperature: 0.7 });
  assert.equal(p.temperature, undefined, "fable에 temperature를 보내면 400이다");
});

test("옛 모델은 여전히 temperature를 받는다", () => {
  const p = buildRequestParams("claude-sonnet-4-5", { temperature: 0.7 });
  assert.equal(p.temperature, 0.7);
});

test("모르는 새 모델은 최신 계약으로 취급한다", () => {
  // 허용목록 방식이면 여기서 옛 경로로 떨어져 조용히 잘못 동작한다
  const caps = capabilitiesOf("claude-vega-9");
  assert.equal(caps.adaptiveThinking, true, "새 모델을 옛 계약으로 떨어뜨렸다");
  assert.equal(caps.forbidsSampling, true);
  assert.equal(caps.xhighEffort, true);
});

test("4.6 계열은 xhigh를 받지 못하므로 high로 낮춘다", () => {
  assert.equal(capabilitiesOf("claude-sonnet-4-6").xhighEffort, false);
  const p = buildRequestParams("claude-sonnet-4-6", { effort: "xhigh" }) as
    { output_config?: { effort?: string } };
  assert.equal(p.output_config?.effort, "high", "4.6에 xhigh를 보내면 거부된다");
});

test("xhigh를 받는 모델은 그대로 통과시킨다", () => {
  const p = buildRequestParams("claude-opus-5", { effort: "xhigh" }) as
    { output_config?: { effort?: string } };
  assert.equal(p.output_config?.effort, "xhigh");
});

test("max_tokens를 모델 상한으로 자른다", () => {
  const big = buildRequestParams("claude-sonnet-4-6", { maxTokens: 999_999 });
  assert.equal(big.max_tokens, 64_000, "4.6 상한을 넘겼다");
  const fable = buildRequestParams("claude-fable-5", { maxTokens: 999_999 });
  assert.equal(fable.max_tokens, 128_000);
});

test("우리가 실제로 쓰는 기본값은 어느 모델에서도 안전하다", () => {
  for (const m of ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-fable-5", "claude-opus-5"]) {
    const p = buildRequestParams(m, { maxTokens: 8_000 });
    assert.equal(p.max_tokens, 8_000, `${m}에서 max_tokens가 잘렸다`);
    assert.equal(p.temperature, undefined);
  }
});

test("큰 출력은 스트리밍을 권고한다", () => {
  assert.equal(shouldStream("claude-fable-5", 8_000), false);
  assert.equal(shouldStream("claude-fable-5", 64_000), true);
});

test("거부 응답을 정상 응답으로 착각하지 않는다", () => {
  assert.equal(refusalOf({ stop_reason: "end_turn" }).refused, false);
  const r = refusalOf({ stop_reason: "refusal", stop_details: { category: "cyber" } });
  assert.equal(r.refused, true);
  assert.equal(r.category, "cyber");
});

test("Claude가 아닌 모델에는 제약을 가정하지 않는다", () => {
  const caps = capabilitiesOf("gpt-5.6-luna");
  assert.equal(caps.isClaude, false);
  assert.equal(caps.forbidsSampling, false);
});
