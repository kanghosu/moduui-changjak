"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiResult, Results, norm } from "@/components/BenchmarkResult";

interface LibItem { title: string; year?: string; keyword?: string; posterUrl?: string | null; backdropUrl?: string | null }

export default function MoviePage({ params }: { params: { title: string } }) {
  const title = decodeURIComponent(params.title);
  const router = useRouter();
  const [result, setResult] = useState<ApiResult | null>(null);
  const [lib, setLib] = useState<LibItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ☀️/🌙 저장된 모드 적용 (홈과 공유)
  useEffect(() => {
    try { const m = localStorage.getItem("mc_mode"); if (m === "light" || m === "dark") document.documentElement.setAttribute("data-mode", m); } catch { /* 무시 */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setResult(null); setError(null); setNotice(null);
    fetch("/api/benchmark").then((r) => r.json()).then((d) => { if (!cancelled) setLib(d.list || []); }).catch(() => {});
    fetch("/api/benchmark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) })
      .then(async (r) => {
        const d = (await r.json()) as ApiResult;
        if (cancelled) return;
        if (!r.ok) throw new Error(d.error || "분석 실패");
        if (d.needsKey) { setNotice(d.message || ""); return; }
        setResult(d);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "오류"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [title]);

  const posterOf = (t: string) => lib.find((m) => norm(m.title) === norm(t) || norm(m.title).includes(norm(t)))?.posterUrl || null;
  const backdropOf = (t: string) => lib.find((m) => norm(m.title) === norm(t))?.backdropUrl || null;

  function startVariation() {
    const s = result?.story; if (!s) return;
    router.push(`/write?benchmark=${encodeURIComponent(s.title || title)}`);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <header className="mb-6 flex items-center gap-4">
        <Link href="/explore" className="flex items-center gap-2.5 transition-opacity hover:opacity-80" title="처음 화면으로">
          <span className="h-2.5 w-2.5 rounded-full bg-cinema-amber" />
          <h1 className="text-lg font-semibold tracking-tight">모두의 영화 창작</h1>
        </Link>
        <span className="text-xs text-cinema-dim">시네마 스튜디오</span>
        <span className="flex-1" />
        <Link href="/explore" className="btn-ghost !px-2.5 !py-1.5 text-xs">← 라이브러리</Link>
      </header>

      {loading && <div className="card p-10 text-center text-cinema-sub">4막·24블록을 해부하는 중… 🎞️</div>}
      {notice && <p className="glass rounded-lg px-3 py-2 text-xs text-cinema-amber">🔑 {notice}</p>}
      {error && <p className="text-sm text-[#e2604c]">{error}</p>}

      {!loading && result?.story && (
        <div className="grid grid-cols-1 gap-6">
          <section className="min-w-0 space-y-5">
            <Results
              data={result}
              posterUrl={posterOf(result.story.title || title)}
              backdropUrl={backdropOf(result.story.title || title)}
              onStartVariation={result.mode === "benchmark" ? startVariation : undefined}
            />
          </section>
        </div>
      )}

      <footer className="mt-10 border-t border-cinema-line pt-4 text-[11px] text-cinema-dim">
        4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120) · This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </main>
  );
}
