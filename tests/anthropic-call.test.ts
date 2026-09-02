// 호출 헬퍼 회귀 테스트 — 거부 폴백이 핵심.
// 실제로 겪은 사례: Fable 5가 category="reasoning_extraction"으로 거부해 턴이 죽었다.

import { test } from "node:test";
import assert from "node:assert/strict";
import { callModelJson, RefusalError, extractJson, textOf, cachedSystem, cacheTtl } from "../engine/anthropic-call.ts";
import { fallbackModelFor } from "../engine/model-capabilities.ts";

/** 지정한 시나리오대로 응답하는 가짜 클라이언트 */
function fakeClient(script: (model: string, call: number) => { refuse?: boolean; text?: string }) {
  const calls: { model: string; body: Record<string, unknown> }[] = [];
  let n = 0;
  return {
    calls,
    client: {
      messages: {
        create: async (body: Record<string, unknown>) => {
          const model = body.model as string;
          calls.push({ model, body });
          const r = script(model, ++n);
          if (r.refuse) {
            return { content: [], stop_reason: "refusal", stop_details: { category: "reasoning_extraction" } };
          }
          return { content: [{ type: "text", text: r.text ?? '{"ok":true}' }], stop_reason: "end_turn" };
        },
      },
    },
  };
}

test("거부당하면 다른 모델로 넘어가 성공한다", async () => {
  const { client, calls } = fakeClient((model) => ({ refuse: model.includes("fable") }));
  const res = await callModelJson<{ ok: boolean }>(client, "claude-fable-5", {
    system: "s", user: "u", maxTokens: 1000,
  });
  assert.equal(res.data.ok, true);
  assert.equal(res.fellBack, true, "폴백했다고 표시해야 한다");
  assert.equal(res.modelUsed, "claude-opus-5");
  assert.ok(calls.some((c) => c.model === "claude-fable-5"), "원래 모델을 먼저 시도해야 한다");
});

test("폴백 대상이 없으면 RefusalError를 던진다", async () => {
  const { client } = fakeClient(() => ({ refuse: true }));
  await assert.rejects(
    () => callModelJson(client, "claude-sonnet-4-6", { system: "s", user: "u", maxTokens: 100 }),
    (e: unknown) => e instanceof RefusalError
  );
});

test("폴백을 껐으면 넘어가지 않는다", async () => {
  const { client, calls } = fakeClient(() => ({ refuse: true }));
  await assert.rejects(
    () => callModelJson(client, "claude-fable-5", {
      system: "s", user: "u", maxTokens: 100, allowFallback: false,
    }),
    (e: unknown) => e instanceof RefusalError
  );
  assert.equal(calls.length, 1, "폴백 금지인데 두 번 호출했다");
});

test("거부되지 않으면 폴백하지 않는다", async () => {
  const { client, calls } = fakeClient(() => ({}));
  const res = await callModelJson(client, "claude-fable-5", { system: "s", user: "u", maxTokens: 100 });
  assert.equal(res.fellBack, false);
  assert.equal(calls.length, 1, "불필요하게 두 번 호출했다");
});

test("JSON 파싱 실패는 더 강한 지시로 한 번 더 시도한다", async () => {
  const { client, calls } = fakeClient((_m, n) => ({ text: n === 1 ? "설명만 하고 JSON이 없음" : '{"ok":true}' }));
  const res = await callModelJson<{ ok: boolean }>(client, "claude-sonnet-4-6", {
    system: "s", user: "u", maxTokens: 100,
  });
  assert.equal(res.data.ok, true);
  assert.equal(calls.length, 2);
  assert.ok(String(calls[1].body.messages).includes("") && JSON.stringify(calls[1].body).includes("코드펜스"),
    "재시도에 더 강한 지시가 붙어야 한다");
});

test("모델 계약이 요청에 반영된다", async () => {
  const { client, calls } = fakeClient(() => ({}));
  await callModelJson(client, "claude-fable-5", { system: "s", user: "u", maxTokens: 8000, effort: "xhigh" });
  const body = calls[0].body as { temperature?: number; output_config?: { effort?: string }; max_tokens?: number };
  assert.equal(body.temperature, undefined, "fable에 temperature를 보내면 400이다");
  assert.equal(body.output_config?.effort, "xhigh");
  assert.equal(body.max_tokens, 8000);
});

test("폴백 대상 선택", () => {
  assert.equal(fallbackModelFor("claude-fable-5"), "claude-opus-5");
  assert.equal(fallbackModelFor("claude-opus-5"), "claude-sonnet-4-6");
  assert.equal(fallbackModelFor("claude-sonnet-4-6"), null);
});

test("텍스트 추출은 사고 블록을 건너뛴다", () => {
  const msg = { content: [{ type: "thinking", thinking: "내부" }, { type: "text", text: "답" }] };
  assert.equal(textOf(msg), "답");
});

test("코드펜스로 감싼 JSON도 파싱한다", () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.throws(() => extractJson("JSON이 없다"));
});

// ── 프롬프트 캐싱 ──────────────────────────────
// 시스템 프롬프트는 요청마다 같으므로 캐시 접두사로 보낸다. 재시도가 접두사를 바꾸면
// 캐시를 못 맞으므로 그 약속을 테스트로 고정한다.

test("시스템 프롬프트에 캐시 표시가 붙는다 (기본 5분)", () => {
  delete process.env.ANTHROPIC_CACHE_TTL;
  const blocks = cachedSystem("방법론 지침");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, "text");
  assert.equal(blocks[0].text, "방법론 지침");
  assert.deepEqual(blocks[0].cache_control, { type: "ephemeral" });
  assert.deepEqual(cachedSystem(""), [], "빈 텍스트 블록을 보내면 400이다");
});

test("ANTHROPIC_CACHE_TTL=1h 면 1시간 TTL을 붙인다", () => {
  process.env.ANTHROPIC_CACHE_TTL = "1h";
  try {
    assert.equal(cacheTtl(), "1h");
    assert.deepEqual(cachedSystem("지침")[0].cache_control, { type: "ephemeral", ttl: "1h" });
  } finally {
    delete process.env.ANTHROPIC_CACHE_TTL;
  }
  assert.equal(cacheTtl(), "5m", "그 외 값은 전부 5분");
});

test("호출 헬퍼는 시스템을 캐시 블록으로 보내고, 재시도에서도 접두사를 바꾸지 않는다", async () => {
  delete process.env.ANTHROPIC_CACHE_TTL;
  const { client, calls } = fakeClient((_m, n) => ({ text: n === 1 ? "JSON 없음" : '{"ok":true}' }));
  await callModelJson(client, "claude-opus-5", { system: "긴 방법론 지침", user: "u", maxTokens: 100 });
  assert.equal(calls.length, 2);
  const sys = calls[0].body.system as { text: string; cache_control?: unknown }[];
  assert.equal(sys[0].text, "긴 방법론 지침");
  assert.deepEqual(sys[0].cache_control, { type: "ephemeral" });
  assert.deepEqual(calls[1].body.system, calls[0].body.system, "재시도가 캐시 접두사를 바꾸면 캐시를 못 맞는다");
});
