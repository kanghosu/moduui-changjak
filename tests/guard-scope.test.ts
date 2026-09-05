import { test } from "node:test";
import assert from "node:assert/strict";
import { checkGuard } from "../engine/guard.ts";

/** 같은 IP로 보이도록 헤더 없는 요청을 쓴다. */
function request(): Request {
  return new Request("http://localhost/api/waitlist", { method: "POST" });
}

test("대기리스트 폼은 창작 라우트의 분당 한도를 갉아먹지 않는다", async () => {
  // Given: 분당 2회로 좁힌 가드
  const previousRpm = process.env.GUARD_RPM;
  const previousDisabled = process.env.GUARD_DISABLED;
  process.env.GUARD_RPM = "2";
  delete process.env.GUARD_DISABLED;

  try {
    // When: 폼 스코프로 한도를 모두 소진한다
    const formResults = [];
    for (let i = 0; i < 3; i += 1) {
      formResults.push(await checkGuard(request(), 10, { consumeDaily: false, scope: "waitlist" }));
    }

    // Then: 3회차에서 폼만 막힌다
    assert.deepEqual(
      formResults.map((result) => result.ok),
      [true, true, false],
    );

    // Then: 같은 IP라도 창작(기본 ai) 스코프는 아직 열려 있다
    const ai = await checkGuard(request(), 10, { consumeDaily: false });
    assert.equal(ai.ok, true);
  } finally {
    if (previousRpm === undefined) delete process.env.GUARD_RPM;
    else process.env.GUARD_RPM = previousRpm;
    if (previousDisabled !== undefined) process.env.GUARD_DISABLED = previousDisabled;
  }
});
