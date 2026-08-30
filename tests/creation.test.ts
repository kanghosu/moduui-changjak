import { test } from "node:test";
import assert from "node:assert/strict";
import { appendLoglineHistory, type LoglineOption } from "../engine/creation.ts";

function option(id: string): LoglineOption {
  return {
    logline: `로그라인 ${id}`,
    premise: `사건 ${id}`,
    direction: `방향 ${id}`,
    benchmarkTitle: `작품 ${id}`,
    reason: `이유 ${id}`,
  };
}

test("로그라인 히스토리는 최근 3세트만 보관한다", () => {
  const history = [[option("1")], [option("2")], [option("3")]];

  const next = appendLoglineHistory(history, [option("4")]);

  assert.deepEqual(next.map((set) => set[0]?.logline), ["로그라인 2", "로그라인 3", "로그라인 4"]);
});
