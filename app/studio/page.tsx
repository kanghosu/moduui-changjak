"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Story } from "@/engine/schema";
import { validateStructure } from "@/engine/schema";
import { syncWorkFromProject } from "@/engine/library";

interface Project {
  story: Story;
  benchmarkName?: string;
  confirmed: Record<number, boolean>;
  snapshots: { ts: number; story: Story }[];
  originals?: Record<number, string>; // 블록별 처음 초안 (수정 대비용)
  workId?: string;
}
interface Suggestion { label: string; source?: string; text: string; draft?: string }

const ACT_BG: Record<number, string> = { 1: "#3b82c4", 2: "#7c5fc9", 3: "#c74e7b", 4: "#c56a38" };
const ACT_NAME: Record<number, string> = { 1: "1막 · 설정과 도입", 2: "2막 · 즉자적 욕망", 3: "3막 · 대자적 욕망", 4: "4막 · 결사항전" };
const KEY = "mc_project";
const THEME_KEY = "mc_theme";

// 글쓰기 테마 — 취향대로 고르는 책상
const THEMES = [
  { id: "paper", emoji: "📜", name: "원고지", dot: "#faf9f6" },
  { id: "sepia", emoji: "🏛", name: "세피아", dot: "#f1e8d4" },
  { id: "midnight", emoji: "🌙", name: "심야 서재", dot: "#14161a" },
  { id: "forest", emoji: "🌲", name: "숲속 새벽", dot: "#0f1713" },
  { id: "typewriter", emoji: "⌨️", name: "타자기", dot: "#efece3" },
] as const;

function load(): Project | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.story?.blocks) return null;
    p.confirmed ||= {}; p.snapshots ||= []; p.originals ||= {};
    return p;
  } catch { return null; }
}

export default function Studio() {
  const [proj, setProj] = useState<Project | null>(null);
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [bench, setBench] = useState<Story | null>(null);
  const [sugs, setSugs] = useState<Suggestion[] | null>(null);
  const [sugNote, setSugNote] = useState("");
  const [beat, setBeat] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [todayChars, setTodayChars] = useState(0);
  const [theme, setTheme] = useState<string>("paper");

  function persist(p: Project) {
    localStorage.setItem(KEY, JSON.stringify(p));
    try {
      syncWorkFromProject(p);
      setStorageNotice(null);
    } catch (cause: unknown) {
      setStorageNotice(cause instanceof Error ? cause.message : "서재에 최신 내용을 저장하지 못했습니다.");
    }
  }

  function pickTheme(id: string) {
    setTheme(id);
    try { localStorage.setItem(THEME_KEY, id); } catch { /* 무시 */ }
  }

  useEffect(() => {
    setProj(load()); setReady(true);
    try { const t = localStorage.getItem(THEME_KEY); if (t) setTheme(t); } catch { /* 무시 */ }
    // 오늘 쓴 글자 수 (김은희 모드 — 매일의 생산량이 보이게)
    try {
      const s = JSON.parse(localStorage.getItem("mc_stats") || "{}");
      const today = new Date().toISOString().slice(0, 10);
      setTodayChars(s.d === today ? s.c || 0 : 0);
    } catch { /* 무시 */ }
  }, []);

  function addChars(delta: number) {
    if (delta <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    setTodayChars((prev) => {
      const next = prev + delta;
      try { localStorage.setItem("mc_stats", JSON.stringify({ d: today, c: next })); } catch { /* 무시 */ }
      return next;
    });
  }

  // 벤치마크 참고 로드 (1회)
  useEffect(() => {
    if (!proj?.benchmarkName) return;
    fetch("/api/benchmark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: proj.benchmarkName }) })
      .then((r) => r.json()).then((d) => { if (d?.story) setBench(d.story); }).catch(() => {});
  }, [proj?.benchmarkName]);

  // 블록 선택 → 초안 로드 + 제안 요청
  useEffect(() => {
    if (!proj || sel == null) return;
    const b = proj.story.blocks[sel - 1];
    setBeat(b?.beat || b?.summary || "");
    setSugs(null); setSugNote("");
    fetch("/api/suggest", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: sel, benchmarkName: proj.benchmarkName, logline: proj.story.logline, genre: proj.story.genre }),
    }).then((r) => r.json()).then((d) => { setSugs(d.suggestions || []); setSugNote(d.note || ""); }).catch(() => setSugs([]));
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  const issues = useMemo(() => (proj ? validateStructure(proj.story) : []), [proj]);
  const confirmedCount = proj ? Object.values(proj.confirmed).filter(Boolean).length : 0;

  function saveBeat(confirm = false) {
    if (!proj || sel == null) return;
    const prev = proj.story.blocks[sel - 1];
    const prevText = prev?.beat || prev?.summary || "";
    const next: Project = { ...proj, story: { ...proj.story, blocks: proj.story.blocks.map((b) => (b.index === sel ? { ...b, beat } : b)) } };
    // 처음 초안 보존 — 무엇이 어떻게 바뀌었는지 항상 볼 수 있게
    if (next.originals![sel] === undefined && prevText !== beat) next.originals = { ...next.originals, [sel]: prevText };
    if (confirm) next.confirmed = { ...next.confirmed, [sel]: true };
    setProj(next); persist(next);
    addChars(beat.length - prevText.length);
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200);
    if (confirm && sel < 24) setSel(sel + 1);
  }
  function continueWriting() {
    if (!proj) return;
    const nextIdx = proj.story.blocks.find((b) => !proj.confirmed[b.index])?.index ?? 13;
    setSel(nextIdx);
  }
  function snapshot() {
    if (!proj) return;
    // 스냅샷은 최근 10개만 보관하며, 11번째부터는 이 화면에서 복원할 수 없다.
    const next = { ...proj, snapshots: [...proj.snapshots, { ts: Date.now(), story: proj.story }].slice(-10) };
    setProj(next); persist(next);
  }

  if (!ready) return null;
  if (!proj) {
    return (
      <main className="paper flex min-h-screen items-center justify-center" data-theme={theme}>
        <div className="card max-w-md p-8 text-center">
          <p className="mb-2 text-lg font-semibold">아직 작업 중인 이야기가 없어요</p>
          <p className="mb-4 text-sm" style={{ color: "var(--c-sub)" }}>탐색에서 뼈대를 고르고 「내 24블록 설계」를 누르면 여기로 이어져요.</p>
          <Link href="/" className="btn-amber inline-block">🎬 탐색으로 가기</Link>
        </div>
      </main>
    );
  }

  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const selBlock = sel != null ? proj.story.blocks[sel - 1] : null;
  const benchBlock = sel != null && bench ? bench.blocks[sel - 1] : null;

  return (
    <main className="paper min-h-screen" data-theme={theme}>
      <div className="mx-auto max-w-6xl px-5 py-6">
        {/* 상단 바 */}
        <header className="mb-5 flex flex-wrap items-center gap-2.5">
          <Link href="/" className="btn-ghost !px-2.5 !py-1.5 text-xs" title="탐색(홈)으로">🎬 탐색</Link>
          <Link href="/library" className="btn-ghost !px-2.5 !py-1.5 text-xs">내 서재</Link>
          <h1 className="max-w-[380px] truncate text-[15px] font-bold">{proj.story.logline}</h1>
          {proj.benchmarkName && <span className="pill pill-line">뼈대: {proj.benchmarkName}</span>}
          <span className="flex-1" />
          <button onClick={continueWriting} className="btn-amber !px-3 !py-1.5 text-xs">▶ 이어쓰기</button>
          <span className="pill pill-amber">{confirmedCount}/24 확정</span>
          <span className="pill pill-muted">오늘 {todayChars.toLocaleString()}자 ✍</span>
          {errors.length === 0
            ? <span className="pill pill-ok">✓ 구조 검증</span>
            : <span className="pill pill-warn">error {errors.length}</span>}
          {warns.length > 0 && <span className="pill pill-warn">▲ {warns.length}</span>}
          <button onClick={snapshot} className="btn-ghost !px-2.5 !py-1.5 text-xs">📸 스냅샷 {proj.snapshots.length > 0 ? proj.snapshots.length : ""}</button>
        </header>

        {storageNotice && (
          <p className="card mb-4 p-3 text-xs" style={{ color: "var(--c-danger)" }} role="alert">
            서재에 최신 내용을 반영하지 못했어요. 작업실의 현재 작업은 저장되어 있습니다. {storageNotice}
          </p>
        )}

        {/* 시스템 단계 + 테마 선택 */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px]">
          {["① 쏟아내기", "② 정리", "③ 설계", "④ 블록 다듬기", "⑤ 원고"].map((s, i) => (
            <span key={s} className="rounded-full px-2.5 py-1"
              style={i === 3 ? { background: "var(--c-amber)", color: "#fff", fontWeight: 700 } : i < 3 ? { background: "var(--c-surface2)", color: "var(--c-text)" } : { border: "1px solid var(--c-line)", color: "var(--c-dim)" }}>
              {s}
            </span>
          ))}
          <span className="flex-1" />
          <span className="text-[10px]" style={{ color: "var(--c-dim)" }}>책상 분위기</span>
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => pickTheme(t.id)} className={`theme-dot ${theme === t.id ? "on" : ""}`} title={t.name}>
              <span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ background: t.dot, borderColor: "var(--c-line)" }} />
              {t.emoji} {t.name}
            </button>
          ))}
        </div>

        {/* 4막 레인 보드 */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((act) => {
            const blocks = proj.story.blocks.filter((b) => b.act === act);
            const done = blocks.filter((b) => proj.confirmed[b.index]).length;
            return (
              <div key={act}>
                <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: ACT_BG[act] }}>
                  <span>{ACT_NAME[act]}</span><span className="opacity-80">{done}/6</span>
                </div>
                <div className="space-y-1.5">
                  {blocks.map((b) => {
                    const conf = !!proj.confirmed[b.index];
                    const has = !!(b.beat || b.summary);
                    const label = (b.subtitle || b.beat || b.function || "").replace(/^\[.*?\]\s*/, "").slice(0, 16);
                    return (
                      <button key={b.index} onClick={() => setSel(b.index)}
                        className={`blk ${!has ? "empty" : ""} ${sel === b.index ? "sel" : ""} ${b.isReversal ? "reversal" : ""}`}>
                        <span className="mr-1 font-bold" style={{ color: b.isReversal ? "var(--c-amber)" : ACT_BG[act] }}>{b.index}</span>
                        {conf ? <span style={{ color: "var(--c-ok)" }}>✓ </span> : has ? <span style={{ color: "var(--c-amber)" }}>✦ </span> : null}
                        {b.isReversal && <span style={{ color: "var(--c-amber)", fontWeight: 700 }}>전환점 · </span>}
                        {label || "비어 있음"}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 블록 에디터 */}
        {selBlock ? (
          <div className="card p-5" style={selBlock.isReversal ? { borderColor: "var(--c-amber)", borderWidth: 2 } : undefined}>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="pill pill-amber">블록 {selBlock.index}</span>
              <span className="text-sm font-semibold">{selBlock.function}</span>
              {selBlock.isReversal && <span className="text-[11px]" style={{ color: "var(--c-amber)" }}>★ 즉자→대자 욕망이 뒤집히는 자리 · 주제가 떠오릅니다</span>}
            </div>

            {benchBlock && (
              <p className="mb-3 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: "var(--c-surface2)", color: "var(--c-sub)" }}>
                📖 <b>{bench!.title}</b>의 같은 블록 — {benchBlock.subtitle && <b>{benchBlock.subtitle}: </b>}{(benchBlock.summary || "").slice(0, 170)}
                <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "var(--c-surface)", border: "1px solid var(--c-line)" }}>{bench?.origin === "master" ? "거장 확정" : "AI 분석 초안"}</span>
              </p>
            )}

            <div className="mb-1 flex items-baseline justify-between">
              <label className="text-xs font-semibold" style={{ color: "var(--c-sub)" }}>이 블록의 내 사건 — 마음껏 길게</label>
              <span className="text-[11px]" style={{ color: "var(--c-dim)" }}>{beat.length.toLocaleString()}자</span>
            </div>
            <textarea className="input min-h-[150px] text-[15px] leading-7" value={beat} onChange={(e) => setBeat(e.target.value)} placeholder="장면이 보이게, 하고 싶은 만큼 길게 적어요. 대사·묘사·메모 전부 환영 — 분량 제한 없습니다." />
            {proj.originals?.[selBlock.index] !== undefined && proj.originals[selBlock.index] !== beat && (
              <div className="mt-2 rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed" style={{ borderColor: "var(--c-line)", background: "var(--c-surface2)", color: "var(--c-dim)" }}>
                <span className="font-semibold" style={{ color: "var(--c-sub)" }}>처음 초안</span> · {(proj.originals[selBlock.index] || "(비어 있었음)").slice(0, 160)}
                <button onClick={() => setBeat(proj.originals![selBlock.index] || "")} className="ml-2 font-semibold underline" style={{ color: "var(--c-amber)" }}>되돌리기</button>
              </div>
            )}

            {/* 제안 카드 */}
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold" style={{ color: "var(--c-sub)" }}>제안 {sugNote && <span className="font-normal" style={{ color: "var(--c-dim)" }}>· {sugNote}</span>}</p>
              {!sugs ? (
                <p className="text-xs" style={{ color: "var(--c-dim)" }}>제안을 불러오는 중…</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {sugs.map((s, i) => (
                    <div key={i} className="rounded-lg border p-2.5" style={{ borderColor: "var(--c-line)", background: "var(--c-bg)" }}>
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold" style={{ color: "var(--c-amber)" }}>
                        {s.label}
                        {s.source && <span className="rounded-full border px-1.5 py-0.5 font-normal" style={{ borderColor: "var(--c-line)", color: "var(--c-dim)" }}>{s.source}</span>}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--c-text)" }}>{s.text}</p>
                      {(s.draft || s.label === "기계적 대입") && (
                        <button onClick={() => setBeat((s.draft || "") + (s.draft ? "" : s.text))} className="mt-1.5 text-[11px] font-semibold underline" style={{ color: "var(--c-amber)" }}>
                          초안으로 가져오기
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => saveBeat(false)} className="btn-ghost text-xs">저장</button>
              <button onClick={() => saveBeat(true)} className="btn-amber text-sm">✓ 확정하고 다음 블록 →</button>
              {savedFlash && <span className="text-xs" style={{ color: "var(--c-ok)" }}>저장됨</span>}
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center text-sm" style={{ color: "var(--c-sub)" }}>
            보드에서 블록을 누르면 여기서 다듬을 수 있어요. <b style={{ color: "var(--c-amber)" }}>전환점 13</b>부터 잡는 걸 추천해요 — 거장의 시작점입니다.
          </div>
        )}

        <footer className="mt-8 border-t pt-3 text-[11px]" style={{ borderColor: "var(--c-line)", color: "var(--c-dim)" }}>
          4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120) · 확정 ✓ {confirmedCount} / 초안 ✦ {proj.story.blocks.filter((b) => (b.beat || b.summary) && !proj.confirmed[b.index]).length}
        </footer>
      </div>
    </main>
  );
}
