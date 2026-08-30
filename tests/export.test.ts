import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseImport,
  safeFileName,
  toMarkdown,
  toWorkEnvelope,
  toWorksEnvelope,
} from "../engine/export.ts";
import {
  makeWork,
  projectForRegeneration,
  syncWorkFromProject,
  type Work,
  type WorkStore,
} from "../engine/library.ts";
import type { Act, Story } from "../engine/schema.ts";

function actForBlock(index: number): Act {
  if (index < 6) return 1;
  if (index < 12) return 2;
  if (index < 18) return 3;
  return 4;
}

function story(logline = "기억을 되찾으려는 기록자의 이야기"): Story {
  return {
    title: "기억의 기록",
    logline,
    premise: "사라진 기록을 추적하는 기록자",
    genre: "미스터리",
    target: "성인",
    tone: "서늘하고 따뜻한",
    hookNote: "마지막 단서는 주인공의 기억 속에 있다",
    characters: [
      { id: "hero", name: "서윤", role: "protagonist", want: "진실", need: "용서", arc: "회피에서 직면으로" },
      { id: "rival", name: "도현", role: "antagonist", want: "은폐", need: "인정", arc: "통제에서 붕괴로" },
    ],
    blocks: Array.from({ length: 24 }, (_, index) => ({
      index: index + 1,
      act: actForBlock(index),
      function: `기능 ${index + 1}`,
      beat: `사건 ${index + 1}`,
      characters: ["hero"],
    })),
    reversalPointIndex: 13,
    notes: ["마지막 장면은 여운을 남긴다"],
  };
}

function memoryStore(seed: Work[] = []): WorkStore {
  let works = [...seed];
  return {
    list: () => [...works],
    get: (id) => works.find((work) => work.id === id) ?? null,
    save: (work) => {
      const index = works.findIndex((item) => item.id === work.id);
      if (index === -1) works.push(work);
      else works[index] = work;
    },
    remove: (id) => { works = works.filter((work) => work.id !== id); },
  };
}

test("단일 JSON 봉투를 roundtrip하면 원본 핵심 데이터가 유지된다", () => {
  const work = makeWork(story(), { id: "roundtrip-work", now: 100 });
  const envelope = toWorkEnvelope(work, 200);
  const result = parseImport(JSON.stringify(envelope), []);

  assert.equal(envelope.format, "modu-story-work");
  assert.equal(envelope.version, 1);
  assert.equal(envelope.exportedAt, 200);
  if (!result.ok) throw new Error(result.reason);
  const imported = result.works[0];
  assert.ok(imported);
  assert.deepEqual(imported.story.blocks, work.story.blocks);
  assert.deepEqual(imported.story.characters, work.story.characters);
  assert.equal(imported.story.logline, work.story.logline);
});

test("전체 JSON 봉투를 roundtrip하면 모든 작품을 유지한다", () => {
  const works = [
    makeWork(story("첫 번째 로그라인"), { id: "work-1", now: 100 }),
    makeWork(story("두 번째 로그라인"), { id: "work-2", now: 200 }),
  ];
  const envelope = toWorksEnvelope(works, 300);
  const result = parseImport(JSON.stringify(envelope), []);

  assert.equal(Object.hasOwn(envelope, "works"), true);
  if (!result.ok) throw new Error(result.reason);
  assert.equal(result.works.length, works.length);
  assert.deepEqual(result.works.map((work) => work.story.logline), works.map((work) => work.story.logline));
});

test("ID 충돌 시 기존 작품을 건드리지 않고 가져온 작품에 새 ID를 준다", () => {
  const existing = makeWork(story("기존 작품"), { id: "same-id", now: 100 });
  const before = JSON.stringify(existing);
  const incoming = makeWork(story("가져온 작품"), { id: existing.id, now: 200 });
  const result = parseImport(JSON.stringify(toWorkEnvelope(incoming, 300)), [existing.id]);

  if (!result.ok) throw new Error(result.reason);
  const imported = result.works[0];
  assert.ok(imported);
  assert.notEqual(imported.id, existing.id);
  assert.equal(imported.story.logline, "가져온 작품");
  assert.equal(JSON.stringify(existing), before);
});

test("빈 파일·JSON 파싱 실패·형식 불일치·알 수 없는 버전을 서로 다르게 거부한다", () => {
  const work = makeWork(story(), { id: "invalid-case", now: 100 });
  const valid = toWorkEnvelope(work, 200);
  const results = [
    parseImport("", []),
    parseImport("{깨진 JSON", []),
    parseImport(JSON.stringify({ ...valid, format: "other-format" }), []),
    parseImport(JSON.stringify({ ...valid, version: 2 }), []),
  ];

  assert.ok(results.every((result) => !result.ok));
  const reasons = results.map((result) => result.ok ? "" : result.reason);
  assert.equal(new Set(reasons).size, 4);
});

test("Markdown은 제목부터 노트까지 4막·24블록과 인물 표를 담는다", () => {
  const work = makeWork(story(), { id: "markdown-work", now: 100 });
  const markdown = toMarkdown(work);

  assert.ok(markdown.startsWith("# "));
  assert.ok(markdown.indexOf("## 로그라인") < markdown.indexOf("## 프리미스"));
  assert.ok(markdown.indexOf("## 프리미스") < markdown.indexOf("## 장르 / 톤 / 타깃"));
  assert.ok(markdown.indexOf("## 장르 / 톤 / 타깃") < markdown.indexOf("## 후크"));
  assert.ok(markdown.indexOf("## 후크") < markdown.indexOf("## 인물"));
  assert.ok(markdown.includes("| 이름 | 역할 | 겉욕망 | 속결핍 | 변화 |"));
  for (const act of [1, 2, 3, 4]) assert.ok(markdown.includes(`## ${act}막`));
  for (let index = 1; index <= 24; index += 1) {
    assert.ok(markdown.includes(`- index: ${index}`));
    assert.ok(markdown.includes(`- act: ${actForBlock(index - 1)}`));
    assert.ok(markdown.includes(`- function: 기능 ${index}`));
    assert.ok(markdown.includes(`- beat: 사건 ${index}`));
  }
  assert.ok(markdown.indexOf("## 노트") > markdown.lastIndexOf("- beat: 사건 24"));
});

test("파일명은 금지 문자·제어 문자를 치환하고 날짜를 붙인다", () => {
  const now = Date.UTC(2026, 7, 30, 12);
  const filename = safeFileName('A\\B/C:D*E?F"G<H>I|\u0000', "json", now);

  assert.match(filename, /_20260830\.json$/);
  assert.doesNotMatch(filename, /[\\/:*?"<>|\u0000-\u001F\u007F]/);
  assert.equal(safeFileName("  ", "md", now), "제목 없는 이야기_20260830.md");
});

test("재생성 프로젝트는 기존 snapshots·confirmed·originals를 보존한다", () => {
  const original = makeWork(story("처음 만든 이야기"), { id: "regenerate-work", now: 100 });
  const snapshots = [{ ts: 200, story: story("복원할 이야기") }];
  const confirmed = { 13: true };
  const originals = { 13: "처음 초안" };
  const existing = { ...original, snapshots, confirmed, originals };
  const nextStory = story("재생성한 이야기");
  const project = projectForRegeneration(nextStory, existing.id, undefined, existing);

  assert.equal(project.story, nextStory);
  assert.deepEqual(project.snapshots, snapshots);
  assert.deepEqual(project.confirmed, confirmed);
  assert.deepEqual(project.originals, originals);

  const store = memoryStore([existing]);
  syncWorkFromProject(project, store);
  const saved = store.get(existing.id);
  assert.ok(saved);
  assert.equal(saved.story, nextStory);
  assert.deepEqual(saved.snapshots, snapshots);
  assert.deepEqual(saved.confirmed, confirmed);
  assert.deepEqual(saved.originals, originals);
});
