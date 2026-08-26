// 내 서재 — 저장 계층 회귀 테스트
// 가장 중요한 것: 두 번째 이야기를 만들어도 첫 번째가 사라지지 않는다.
// 그리고 옛 사용자의 작업(mc_project 단일 슬롯)을 잃지 않는다.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeWork, titleFrom, sortWorks, parseWorks, migrateLegacy,
  type Work, type WorkStore,
} from "../engine/library.ts";
import type { Story } from "../engine/schema.ts";

function story(logline: string, title?: string): Story {
  return {
    logline, premise: logline, genre: "드라마", target: "일반", tone: "잔잔한",
    characters: [{ id: "p", name: "주인공", role: "protagonist", want: "", need: "", arc: "" }],
    blocks: Array.from({ length: 24 }, (_, i) => ({ index: i + 1, act: 1 as const, function: `f${i}` })),
    reversalPointIndex: 13, notes: [], title,
  };
}

/** 메모리 저장소 — localStorage 없이 로직만 검증한다 */
function memoryStore(seed: Work[] = []): WorkStore {
  let works = [...seed];
  return {
    list: () => sortWorks(works),
    get: (id) => works.find((w) => w.id === id) ?? null,
    save: (w) => {
      const i = works.findIndex((x) => x.id === w.id);
      if (i >= 0) works[i] = w; else works.push(w);
    },
    remove: (id) => { works = works.filter((w) => w.id !== id); },
  };
}

test("두 번째 이야기를 저장해도 첫 번째가 남는다", () => {
  const store = memoryStore();
  store.save(makeWork(story("첫 번째 이야기")));
  store.save(makeWork(story("두 번째 이야기")));
  assert.equal(store.list().length, 2, "이전 작품이 덮어써졌다");
});

test("같은 작품을 다시 저장하면 늘어나지 않는다", () => {
  const store = memoryStore();
  const w = makeWork(story("하나뿐인 이야기"));
  store.save(w);
  store.save({ ...w, title: "이름만 바꿈" });
  assert.equal(store.list().length, 1);
  assert.equal(store.get(w.id)?.title, "이름만 바꿈");
});

test("제목은 로그라인 첫 문장에서 만들고, 지나치게 길면 자른다", () => {
  assert.equal(titleFrom(story("복수를 꿈꾸는 회사원. 뒷문장은 버린다")), "복수를 꿈꾸는 회사원");
  assert.equal(titleFrom(story("", "명시적 제목")), "명시적 제목");
  assert.equal(titleFrom(story("")), "제목 없는 이야기");
  assert.ok(titleFrom(story("가".repeat(60))).length <= 29);
});

test("최근 수정 순으로 정렬한다", () => {
  const a = { ...makeWork(story("옛날")), updatedAt: 100 };
  const b = { ...makeWork(story("최근")), updatedAt: 900 };
  assert.equal(sortWorks([a, b])[0].story.logline, "최근");
});

test("손상된 저장값에도 죽지 않는다", () => {
  assert.deepEqual(parseWorks(null), []);
  assert.deepEqual(parseWorks("깨진 JSON"), []);
  assert.deepEqual(parseWorks('{"not":"array"}'), []);
  assert.deepEqual(parseWorks('[{"id":"x"}]'), [], "story 없는 항목을 걸러야 한다");
});

test("옛 단일 슬롯 작업을 서재로 옮긴다", () => {
  const legacy = JSON.stringify({ story: story("옛날에 만든 이야기"), confirmed: {}, snapshots: [] });
  const migrated = migrateLegacy([], legacy);
  assert.equal(migrated.length, 1, "옛 작업을 잃었다");
  assert.equal(migrated[0].story.logline, "옛날에 만든 이야기");
  assert.equal(migrated[0].origin, "write");
});

test("이미 옮긴 작업을 두 번 넣지 않는다", () => {
  const s = story("중복될 이야기");
  const legacy = JSON.stringify({ story: s, confirmed: {}, snapshots: [] });
  const existing = [makeWork(s)];
  assert.equal(migrateLegacy(existing, legacy).length, 1, "같은 작품이 두 개가 됐다");
});

test("빈·손상된 옛 슬롯은 무시한다", () => {
  assert.equal(migrateLegacy([], null).length, 0);
  assert.equal(migrateLegacy([], "깨진 값").length, 0);
  assert.equal(migrateLegacy([], '{"story":{}}').length, 0, "블록 없는 story를 작품으로 만들면 안 된다");
});
