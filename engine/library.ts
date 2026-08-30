// 내 서재 — 완성한 이야기가 쌓이는 곳.
//
// 왜 있나: 창작 도구의 재방문 이유는 "내 작업이 거기 있다"는 것 하나다.
// 지금까지는 mc_project 한 칸뿐이라 두 번째 이야기를 만들면 첫 번째가 사라졌다.
//
// 설계 원칙: 저장소를 인터페이스로 분리한다. 지금은 localStorage지만
// 계정·서버 저장(PRD v2 §6 B층)으로 옮길 때 어댑터만 갈아끼우면 되게 한다.

import type { Story } from "./schema";

export const WORKS_KEY = "mc_works";
/** 작업실(/studio)이 보고 있는 "지금 편집 중" 슬롯. 기존 화면과의 호환을 위해 유지한다. */
export const CURRENT_KEY = "mc_project";

export interface Work {
  readonly id: string;
  /** 사용자가 보는 이름. 없으면 로그라인 앞부분에서 만든다. */
  title: string;
  story: Story;
  snapshots?: { ts: number; story: Story }[];
  confirmed?: Record<number, boolean>;
  originals?: Record<number, string>;
  benchmarkName?: string;
  /** 어느 화면에서 만들었나 — 지표용 */
  origin: "create" | "write";
  createdAt: number;
  updatedAt: number;
}

/** 작업실이 읽고 쓰는 현재 프로젝트 형태 (기존 계약 유지) */
export interface CurrentProject {
  story: Story;
  benchmarkName?: string;
  confirmed: Record<number, boolean>;
  snapshots: { ts: number; story: Story }[];
  originals?: Record<number, string>;
  /** 어느 작품을 편집 중인지 — 서재와 연결 */
  workId?: string;
}

export interface WorkStore {
  list(): Work[];
  get(id: string): Work | null;
  save(work: Work): void;
  remove(id: string): void;
}

/* ── 순수 함수 (테스트 대상) ─────────────────── */

export function titleFrom(story: Story): string {
  const raw = (story.title || story.logline || "").trim();
  if (!raw) return "제목 없는 이야기";
  const cut = raw.split(/[.!?\n]/)[0].trim();
  return cut.length > 28 ? cut.slice(0, 28) + "…" : cut || "제목 없는 이야기";
}

export function makeWork(
  story: Story,
  opts: { benchmarkName?: string; origin?: Work["origin"]; id?: string; now?: number } = {}
): Work {
  const now = opts.now ?? Date.now();
  return {
    id: opts.id ?? `w_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: titleFrom(story),
    story,
    benchmarkName: opts.benchmarkName,
    origin: opts.origin ?? "create",
    createdAt: now,
    updatedAt: now,
  };
}

/** 최근 수정 순 */
export function sortWorks(works: readonly Work[]): Work[] {
  return [...works].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** 저장된 값이 Work 배열인지 방어적으로 확인한다 (손상된 localStorage 대비) */
export function parseWorks(raw: string | null): Work[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((w): w is Work =>
      Boolean(w) && typeof w === "object" &&
      typeof (w as Work).id === "string" &&
      Boolean((w as Work).story?.blocks)
    );
  } catch {
    return [];
  }
}

/**
 * 옛 단일 슬롯(mc_project)에 있던 작업을 서재로 옮긴다.
 * 기존 사용자의 작업을 잃지 않는 것이 목적이라, 이미 서재에 같은 로그라인이 있으면 건너뛴다.
 */
export function migrateLegacy(works: readonly Work[], legacyRaw: string | null, now?: number): Work[] {
  if (!legacyRaw) return [...works];
  try {
    const legacy = JSON.parse(legacyRaw) as CurrentProject;
    if (!legacy?.story?.blocks?.length) return [...works];
    const already = works.some((w) => w.story.logline === legacy.story.logline);
    if (already) return [...works];
    return [...works, makeWork(legacy.story, {
      benchmarkName: legacy.benchmarkName,
      origin: "write",
      now,
    })];
  } catch {
    return [...works];
  }
}

/** 작업실의 최신 상태를 연결된 작품에 반영한다. 연결이 끊긴 옛 슬롯은 그대로 둔다. */
export function syncWorkFromProject(proj: CurrentProject, store: WorkStore = localWorkStore): void {
  if (!proj.workId) return;
  const work = store.get(proj.workId);
  if (!work) return;
  store.save({
    ...work,
    story: proj.story,
    snapshots: proj.snapshots,
    confirmed: proj.confirmed,
    originals: proj.originals,
    updatedAt: Date.now(),
  });
}

/** /write 재생성 시 작품의 작업실 상태를 유지하고 새 story만 교체한다. */
export function projectForRegeneration(
  story: Story,
  workId: string,
  benchmarkName: string | undefined,
  existingWork: Work | null,
): CurrentProject {
  return {
    story,
    benchmarkName,
    confirmed: existingWork?.confirmed ?? {},
    snapshots: existingWork?.snapshots ?? [],
    originals: existingWork?.originals ?? {},
    workId,
  };
}

/* ── localStorage 어댑터 ─────────────────────── */

function readAll(): Work[] {
  if (typeof window === "undefined") return [];
  return parseWorks(window.localStorage.getItem(WORKS_KEY));
}

function writeAll(works: readonly Work[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WORKS_KEY, JSON.stringify(works));
  } catch {
    // 용량 초과 등 — 조용히 실패시키지 않고 호출부가 알 수 있게 던진다
    throw new Error("작품을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
  }
}

export const localWorkStore: WorkStore = {
  list: () => sortWorks(readAll()),
  get: (id) => readAll().find((w) => w.id === id) ?? null,
  save: (work) => {
    const works = readAll();
    const idx = works.findIndex((w) => w.id === work.id);
    if (idx >= 0) works[idx] = { ...work, updatedAt: Date.now() };
    else works.push(work);
    writeAll(works);
  },
  remove: (id) => writeAll(readAll().filter((w) => w.id !== id)),
};

/** 앱 시작 시 1회 — 옛 데이터를 서재로 흡수한다 */
export function ensureMigrated(store: WorkStore = localWorkStore): void {
  if (typeof window === "undefined") return;
  const legacyRaw = window.localStorage.getItem(CURRENT_KEY);
  const migrated = migrateLegacy(store.list(), legacyRaw);
  for (const w of migrated) if (!store.get(w.id)) store.save(w);
}

/** 이야기를 서재에 넣고, 작업실이 이어서 열 수 있도록 현재 슬롯도 채운다 */
export function saveWork(
  story: Story,
  opts: { benchmarkName?: string; origin?: Work["origin"] } = {},
  store: WorkStore = localWorkStore
): Work {
  const work = makeWork(story, opts);
  store.save(work);
  if (typeof window !== "undefined") {
    const current: CurrentProject = {
      story, benchmarkName: opts.benchmarkName, confirmed: {}, snapshots: [], workId: work.id,
    };
    try { window.localStorage.setItem(CURRENT_KEY, JSON.stringify(current)); } catch { /* 서재 저장은 이미 됐다 */ }
  }
  return work;
}
