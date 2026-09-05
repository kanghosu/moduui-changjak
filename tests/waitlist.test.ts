import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/waitlist/route.ts";
import { createJsonlWaitlistStore, type WaitlistEntry } from "../engine/waitlist.ts";
import { waitlistPayloadSchema } from "../lib/waitlist-schema.ts";

test("waitlist payload schema rejects malformed email and overlong fields", () => {
  // Given: 이메일 형식이 잘못됐거나 길이 제한을 넘은 요청
  const invalid = waitlistPayloadSchema.safeParse({
    email: "not-an-email",
    name: "n".repeat(81),
    message: "m".repeat(2001),
    type: "waitlist",
    lang: "en",
    website: "",
  });

  // When: Zod 경계 검증을 실행한다
  // Then: 잘못된 요청을 거부한다
  assert.equal(invalid.success, false);
});

test("waitlist route returns ok without saving a honeypot submission", async () => {
  // Given: 허니팟 website가 채워진 유효한 요청
  const request = new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bot@example.com", type: "waitlist", lang: "en", website: "https://bot.example" }),
  });

  // When: API 경계에 요청한다
  const response = await POST(request);
  const body: unknown = await response.json();

  // Then: 저장 여부를 노출하지 않고 성공 응답을 반환한다
  assert.equal(response.status, 200);
  assert.deepEqual(body, { ok: true });
});

test("JSONL waitlist store normalizes email and detects duplicates", async () => {
  // Given: 비어 있는 임시 저장 파일과 대문자·공백이 있는 이메일
  const directory = await mkdtemp(path.join(os.tmpdir(), "modu-story-waitlist-"));
  const filePath = path.join(directory, "nested", "waitlist.jsonl");
  const store = createJsonlWaitlistStore(filePath);
  const entry: WaitlistEntry = {
    email: "  Person@Example.COM ",
    name: "Person",
    message: "Hello",
    type: "waitlist",
    lang: "en",
  };

  try {
    // When: 같은 의미의 이메일을 두 번 추가한다
    const first = await store.add(entry);
    const second = await store.add({ ...entry, email: "person@example.com" });
    const stored = await readFile(filePath, "utf8");

    // Then: 첫 번째만 추가되고 정규화된 이메일로 중복 판정한다
    assert.equal(first, "added");
    assert.equal(second, "duplicate");
    assert.equal(stored.split("\n").filter(Boolean).length, 1);
    assert.match(stored, /"email":"person@example\.com"/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
