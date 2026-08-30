"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { Story } from "@/engine/schema";
import { localWorkStore, ensureMigrated, syncWorkFromProject, type Work, type CurrentProject } from "@/engine/library";
import { exportWork, exportWorks, filenameFor, parseImport, safeFileName, workToMarkdown } from "@/engine/export";

interface Project {
  story: Story;
  benchmarkName?: string;
  confirmed: Record<number, boolean>;
  snapshots: { ts: number; story: Story }[];
  originals?: Record<number, string>;
  workId?: string;
}

// 내 서재 — 내 프로젝트·스냅샷·초안이 사는 곳
export default function Library() {
  const [proj, setProj] = useState<Project | null>(null);
  const [draftLen, setDraftLen] = useState(0);
  const [theme, setTheme] = useState("paper");
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState("");
  const [flashTone, setFlashTone] = useState<"ok" | "warn">("ok");
  const [works, setWorks] = useState<Work[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      ensureMigrated();
      setWorks(localWorkStore.list());
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

  /** 작품을 작업실이 보는 현재 슬롯에 올린다 */
  function openWork(w: Work) {
    const current: CurrentProject = {
      story: w.story,
      benchmarkName: w.benchmarkName,
      confirmed: w.confirmed ?? {},
      snapshots: w.snapshots ?? [],
      originals: w.originals ?? {},
      workId: w.id,
    };
    localStorage.setItem("mc_project", JSON.stringify(current));
    location.href = "/studio";
  }

  function removeWork(w: Work) {
    if (!confirm(`「${w.title}」을(를) 서재에서 지울까요? 되돌릴 수 없어요.`)) return;
    localWorkStore.remove(w.id);
    setWorks(localWorkStore.list());
    showFlash(`「${w.title}」을(를) 지웠어요`);
  }

  function restore(ts: number) {
    if (!proj) return;
    const snap = proj.snapshots.find((s) => s.ts === ts);
    if (!snap) return;
    const next = { ...proj, story: snap.story };
    setProj(next);
    localStorage.setItem("mc_project", JSON.stringify(next));
    try {
      syncWorkFromProject(next);
    } catch (cause: unknown) {
      showFlash(cause instanceof Error ? `복원했지만 서재 저장에 실패했어요: ${cause.message}` : "복원했지만 서재 저장에 실패했어요.", "warn");
      return;
    }
    showFlash(`${fmt(ts)} 버전으로 복원했어요 — 작업실에서 이어가세요`);
  }

  function showFlash(message: string, tone: "ok" | "warn" = "ok") {
    setFlashTone(tone);
    setFlash(message);
    window.setTimeout(() => setFlash(""), 3000);
  }

  function downloadText(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadJson(w: Work) {
    const now = Date.now();
    downloadText(exportWork(w, now), filenameFor(w, "json", now), "application/json;charset=utf-8");
    showFlash(`「${w.title}」 JSON을 내보냈어요`);
  }

  function downloadMarkdown(w: Work) {
    const now = Date.now();
    downloadText(workToMarkdown(w), filenameFor(w, "md", now), "text/markdown;charset=utf-8");
    showFlash(`「${w.title}」 Markdown을 내보냈어요`);
  }

  function downloadAll() {
    const now = Date.now();
    downloadText(exportWorks(works, now), safeFileName("모두의 창작", "json", now), "application/json;charset=utf-8");
    showFlash(`서재의 ${works.length}편을 내보냈어요`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      const raw = await file.text();
      const result = parseImport(raw, localWorkStore.list().map((work) => work.id));
      if (!result.ok) {
        showFlash(result.reason, "warn");
        return;
      }
      for (const work of result.works) localWorkStore.save(work);
      setWorks(localWorkStore.list());
      showFlash(`${result.works.length}편을 가져왔어요`);
    } catch (cause: unknown) {
      if (cause instanceof Error) {
        showFlash(`가져오기에 실패했어요: ${cause.message}`, "warn");
        return;
      }
      throw cause;
    }
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
          <button type="button" onClick={downloadAll} className="btn-ghost text-xs">전체 내보내기</button>
          <button type="button" onClick={() => importInputRef.current?.click()} className="btn-ghost text-xs">가져오기</button>
          <input ref={importInputRef} type="file" accept="application/json" onChange={handleImport} className="sr-only" aria-label="가져올 JSON 파일" />
          <span className="pill pill-muted">작품은 이 브라우저에 저장돼요</span>
        </header>

        {flash && <p className={`pill ${flashTone === "warn" ? "pill-warn" : "pill-ok"} mb-4 inline-block`} role={flashTone === "warn" ? "alert" : undefined}>{flashTone === "ok" ? "✓ " : ""}{flash}</p>}

        {works.length === 0 && !proj && draftLen === 0 && (
          <div className="card p-10 text-center">
            <p className="mb-2 text-lg font-bold">아직 서재가 비어 있어요</p>
            <p className="mb-4 text-sm" style={{ color: "var(--c-sub)" }}>
              탐색에서 좋아하는 영화의 뼈대를 고르고 첫 설계도를 만들어 보세요. 처음이라면 🎲 예시로 채우기가 제일 빨라요.
            </p>
            <Link href="/" className="btn-amber inline-block">🎬 첫 이야기 시작하기</Link>
          </div>
        )}

        {works.length > 0 && (
          <section className="mb-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-2">
              <h2 className="text-base font-bold">내 이야기 {works.length}편</h2>
              <span className="text-xs" style={{ color: "var(--c-dim)" }}>
                새 이야기를 만들어도 여기 있는 작품은 지워지지 않아요.
              </span>
              <span className="flex-1" />
              <Link href="/create" className="btn-ghost !px-2.5 !py-1 text-xs">+ 새 이야기</Link>
            </div>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {works.map((w) => (
                <li key={w.id} className="card p-4">
                  <h3 className="mb-1 text-sm font-bold leading-snug">{w.title}</h3>
                  <p className="mb-2 line-clamp-2 text-xs" style={{ color: "var(--c-sub)" }}>{w.story.logline}</p>
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    <span className="pill pill-muted">{fmt(w.updatedAt)}</span>
                    {w.benchmarkName && <span className="pill pill-line">뼈대: {w.benchmarkName}</span>}
                    {w.story.hookNote && <span className="pill pill-ok">후크 ✓</span>}
                  </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openWork(w)} className="btn-amber text-xs">작업실에서 열기</button>
                      <button onClick={() => removeWork(w)} className="btn-ghost text-xs">지우기</button>
                      <button onClick={() => downloadJson(w)} className="btn-ghost text-xs">JSON 내보내기</button>
                      <button onClick={() => downloadMarkdown(w)} className="btn-ghost text-xs">Markdown 내보내기</button>
                    </div>
                </li>
              ))}
            </ul>
          </section>
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
