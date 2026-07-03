"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Story } from "@/engine/schema";

interface Project {
  story: Story;
  benchmarkName?: string;
  confirmed: Record<number, boolean>;
  snapshots: { ts: number; story: Story }[];
  originals?: Record<number, string>;
}

// 내 서재 — 내 프로젝트·스냅샷·초안이 사는 곳
export default function Library() {
  const [proj, setProj] = useState<Project | null>(null);
  const [draftLen, setDraftLen] = useState(0);
  const [theme, setTheme] = useState("paper");
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mc_project");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.story?.blocks) { p.confirmed ||= {}; p.snapshots ||= []; setProj(p); }
      }
      const d = localStorage.getItem("mc_draft");
      if (d) {
        const dd = JSON.parse(d);
        const f = dd?.form || {};
        setDraftLen((f.ideaNote || "").length + (f.logline || "").length);
      }
      const t = localStorage.getItem("mc_theme");
      if (t) setTheme(t);
    } catch { /* 무시 */ }
    setReady(true);
  }, []);

  function restore(ts: number) {
    if (!proj) return;
    const snap = proj.snapshots.find((s) => s.ts === ts);
    if (!snap) return;
    const next = { ...proj, story: snap.story };
    setProj(next);
    localStorage.setItem("mc_project", JSON.stringify(next));
    setFlash(`${fmt(ts)} 버전으로 복원했어요 — 작업실에서 이어가세요`);
    setTimeout(() => setFlash(""), 3000);
  }

  const fmt = (ts: number) => new Date(ts).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  if (!ready) return null;
  const confirmedCount = proj ? Object.values(proj.confirmed).filter(Boolean).length : 0;

  return (
    <main className="paper min-h-screen" data-theme={theme}>
      <div className="mx-auto max-w-4xl px-5 py-6">
        <header className="mb-6 flex flex-wrap items-center gap-2.5">
          <Link href="/" className="btn-ghost !px-2.5 !py-1.5 text-xs">🎬 탐색</Link>
          <Link href="/studio" className="btn-ghost !px-2.5 !py-1.5 text-xs">작업실</Link>
          <h1 className="text-[15px] font-bold">📚 내 서재</h1>
          <span className="flex-1" />
          <span className="pill pill-muted">작품은 이 브라우저에 저장돼요</span>
        </header>

        {flash && <p className="pill pill-ok mb-4 inline-block">✓ {flash}</p>}

        {!proj && draftLen === 0 && (
          <div className="card p-10 text-center">
            <p className="mb-2 text-lg font-bold">아직 서재가 비어 있어요</p>
            <p className="mb-4 text-sm" style={{ color: "var(--c-sub)" }}>
              탐색에서 좋아하는 영화의 뼈대를 고르고 첫 설계도를 만들어 보세요. 처음이라면 🎲 예시로 채우기가 제일 빨라요.
            </p>
            <Link href="/" className="btn-amber inline-block">🎬 첫 이야기 시작하기</Link>
          </div>
        )}

        {proj && (
          <section className="card mb-5 p-5">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold">{proj.story.logline}</h2>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {proj.benchmarkName && <span className="pill pill-line">뼈대: {proj.benchmarkName}</span>}
              <span className="pill pill-amber">{confirmedCount}/24 확정</span>
              <span className="pill pill-muted">인물 {proj.story.characters.length}명</span>
              {proj.story.hookNote && <span className="pill pill-ok">후크 ✓</span>}
            </div>
            {/* 진행 바 */}
            <div className="mb-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--c-surface2)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round((confirmedCount / 24) * 100)}%`, background: "var(--c-amber)" }} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/studio" className="btn-amber text-sm">🛠️ 작업실에서 이어가기</Link>
              <Link href="/" className="btn-ghost text-sm">다른 뼈대 탐색</Link>
            </div>
          </section>
        )}

        {proj && proj.snapshots.length > 0 && (
          <section className="card mb-5 p-5">
            <h3 className="mb-1 text-sm font-bold">📸 스냅샷 — 실험해도 잃지 않아요</h3>
            <p className="mb-3 text-xs" style={{ color: "var(--c-dim)" }}>다른 전개를 시도하기 전에 찍어둔 버전들. 언제든 그 시점으로 복원할 수 있어요.</p>
            <ul className="space-y-1.5">
              {[...proj.snapshots].reverse().map((s) => (
                <li key={s.ts} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--c-line)" }}>
                  <span className="font-semibold">{fmt(s.ts)}</span>
                  <span className="truncate" style={{ color: "var(--c-sub)" }}>{s.story.logline.slice(0, 40)}…</span>
                  <span className="flex-1" />
                  <button onClick={() => restore(s.ts)} className="font-semibold underline" style={{ color: "var(--c-amber-deep)" }}>이 버전으로 복원</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {draftLen > 0 && (
          <section className="card p-5">
            <h3 className="mb-1 text-sm font-bold">✍️ 쓰다 만 초안</h3>
            <p className="mb-3 text-xs" style={{ color: "var(--c-dim)" }}>아이디어 노트와 스토리 프로필에 적어둔 {draftLen.toLocaleString()}자가 자동 저장돼 있어요.</p>
            <Link href="/" className="btn-ghost inline-block text-sm">이어서 쓰기 →</Link>
          </section>
        )}

        <footer className="mt-8 border-t pt-3 text-[11px]" style={{ borderColor: "var(--c-line)", color: "var(--c-dim)" }}>
          4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120)
        </footer>
      </div>
    </main>
  );
}
