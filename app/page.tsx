"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PosterCard, posterColor } from "@/components/BenchmarkResult";

/* ── 타입 ─────────────────────────────────────── */
interface LibItem { title: string; year?: string; keyword?: string; analyst?: string; origin?: string; posterUrl?: string | null; backdropUrl?: string | null }
interface TmdbHit { id: number; title: string; year: string; posterUrl: string | null; overview: string }
interface MatchItem { title: string; year?: string; keyword?: string; logline: string; score: number; matched: string[] }

/* ── 한글 초성 검색 유틸 ───────────────────────── */
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const choseong = (s: string) => Array.from(s).map((c) => { const n = c.charCodeAt(0) - 0xac00; return n >= 0 && n < 11172 ? CHO[Math.floor(n / 588)] : c; }).join("");
const norm = (s: string) => (s || "").toLowerCase().replace(/[\s<>:,·\[\]()「」'".\-]/g, "");
const isChoQuery = (s: string) => /^[ㄱ-ㅎ]+$/.test(s.replace(/\s/g, ""));

function libMatch(lib: LibItem[], q: string): LibItem[] {
  const nq = norm(q);
  if (!nq) return [];
  return lib.filter((m) => {
    const nt = norm(m.title);
    if (nt.includes(nq) || nq.includes(nt)) return true;
    if (isChoQuery(q) && choseong(nt).includes(q.replace(/\s/g, ""))) return true;
    return false;
  }).slice(0, 6);
}

/* ── 페이지 ───────────────────────────────────── */
export default function Home() {
  const [lib, setLib] = useState<LibItem[]>([]);
  const [q, setQ] = useState("");
  const [tmdbHits, setTmdbHits] = useState<TmdbHit[]>([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [ideaMode, setIdeaMode] = useState(false);
  const [idea, setIdea] = useState("");
  const [matches, setMatches] = useState<MatchItem[] | null>(null);
  const [matchNote, setMatchNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [hydrated, setHydrated] = useState(false);

  // ☀️/🌙 모드 — 마운트 시 저장값 읽기 (hydrated 이전엔 쓰지 않아 초기값이 저장값을 덮어쓰지 않게)
  useEffect(() => {
    try { const m = localStorage.getItem("mc_mode"); if (m === "light" || m === "dark") setMode(m); } catch { /* 무시 */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    if (hydrated) { try { localStorage.setItem("mc_mode", mode); } catch { /* 무시 */ } }
  }, [mode, hydrated]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/benchmark").then((r) => r.json()).then((d) => setLib(d.list || [])).catch(() => {});
  }, []);

  const libHits = useMemo(() => libMatch(lib, q), [lib, q]);
  const posterOf = (title: string) => lib.find((m) => norm(m.title) === norm(title) || norm(m.title).includes(norm(title)))?.posterUrl || null;

  /* TMDb 자동완성 (라이브러리 매치가 부족할 때) */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2 || isChoQuery(q)) { setTmdbHits([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/tmdb?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        setTmdbHits((d.hits || []).slice(0, 4));
      } catch { setTmdbHits([]); }
    }, 350);
  }, [q]);

  // 로고/탐색 = 언제나 처음 화면으로
  function resetHome() {
    setMatches(null); setError(null);
    setQ(""); setIdeaMode(false); setDropOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 영화 뼈대는 각각의 실제 페이지(/movie/제목)로 — 브라우저 뒤로가기가 그대로 돌아온다
  function goToMovie(title: string) {
    if (!title.trim()) return;
    setDropOpen(false);
    router.push(`/movie/${encodeURIComponent(title)}`);
  }

  async function findByIdea() {
    if (!idea.trim()) { setError("쓰고 싶은 이야기를 한두 줄 적어주세요."); return; }
    setError(null); setAnalyzing(true);
    try {
      const r = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "매칭 실패");
      setMatches(d.matches || []); setMatchNote(d.note || "");
    } catch (e) { setError(e instanceof Error ? e.message : "오류"); }
    finally { setAnalyzing(false); }
  }

  const masters = lib.filter((m) => m.origin !== "ai");
  const aiLib = lib.filter((m) => m.origin === "ai");

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      {/* 헤더 — 로고 클릭 = 언제나 처음 화면 */}
      <header className="mb-6 flex items-center gap-4">
        <button onClick={resetHome} className="flex items-center gap-2.5 transition-opacity hover:opacity-80" title="처음 화면으로">
          <span className="h-2.5 w-2.5 rounded-full bg-cinema-amber" />
          <h1 className="text-lg font-semibold tracking-tight">모두의 영화 창작</h1>
        </button>
        <span className="text-xs text-cinema-dim">시네마 스튜디오</span>
        <span className="flex-1" />
        <nav className="flex items-center gap-4 text-[15px]">
          <button onClick={resetHome} className="border-b-2 border-cinema-amber pb-0.5 font-semibold text-cinema-amber">탐색</button>
          <Link href="/create" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">만들기</Link>
          <Link href="/write" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">글쓰기</Link>
          <Link href="/studio" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">작업실</Link>
          <Link href="/library" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">내 서재</Link>
          <Link href="/about" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">소개</Link>
          <button
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            className="rounded-full border border-cinema-line px-3 py-1.5 text-sm transition-colors hover:border-cinema-dim"
            title={mode === "dark" ? "라이트 모드로" : "다크 모드로"}
          >
            {mode === "dark" ? "☀️ 라이트" : "🌙 다크"}
          </button>
        </nav>
      </header>

      {/* 히어로 — 시네마 스포트라이트 */}
      <section className="hero relative z-20 mb-8">
        <div className="relative z-10 max-w-[640px] px-7 py-9 md:px-10 md:py-12">
          <p className="mb-2.5 text-[11px] font-bold tracking-[0.22em] text-cinema-amber">PLOT은 AI에게 · HOOK은 당신에게</p>
          <h2 className="hero-title">
            오늘 밤, 당신의 이야기가<br />
            <em>개봉</em>합니다
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cinema-sub">
            좋아하는 영화의 뼈대(4막·24블록)를 빌려, 10분 만에 첫 설계도를 세워요.
          </p>

          <div className="seg glass mb-3 mt-7">
            <button className={!ideaMode ? "on" : ""} onClick={() => { setIdeaMode(false); setMatches(null); }}>🎬 영화로 시작</button>
            <button className={ideaMode ? "on" : ""} onClick={() => { setIdeaMode(true); setDropOpen(false); }}>✍️ 내 이야기로 시작</button>
          </div>

          {!ideaMode ? (
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-[26px] -translate-y-1/2 text-base opacity-70">🔍</span>
              <input
                className="hero-input glass"
                value={q}
                onChange={(e) => { setQ(e.target.value); setDropOpen(true); }}
                onFocus={() => setDropOpen(true)}
                onKeyDown={(e) => { if (e.key === "Enter" && (libHits[0] || q.trim())) goToMovie(libHits[0]?.title || q); if (e.key === "Escape") setDropOpen(false); }}
                placeholder="어떤 영화처럼 쓰고 싶나요?"
              />
              {dropOpen && (libHits.length > 0 || tmdbHits.length > 0) && (
                <div className="dropdown-panel absolute inset-x-0 top-[58px] z-30 overflow-hidden rounded-xl">
                  {libHits.map((m) => (
                    <button key={m.title} onClick={() => { setQ(m.title); goToMovie(m.title); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cinema-line/40">
                      <PosterThumb title={m.title} url={m.posterUrl} w={30} />
                      <span className="text-sm">{m.title}</span>
                      <span className="text-xs text-cinema-dim">{m.year}</span>
                      {m.origin === "ai"
                        ? <span className="ml-auto rounded-full bg-cinema-line/60 px-2 py-0.5 text-[10px] text-cinema-sub">AI 분석</span>
                        : <span className="ml-auto rounded-full bg-cinema-amber/15 px-2 py-0.5 text-[10px] text-cinema-amber">거장 확정</span>}
                    </button>
                  ))}
                  {tmdbHits.filter((h) => !libHits.some((l) => norm(l.title) === norm(h.title))).map((h) => (
                    <button key={h.id} onClick={() => { setQ(h.title); goToMovie(h.title); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cinema-line/40">
                      <PosterThumb title={h.title} url={h.posterUrl} w={30} />
                      <span className="text-sm">{h.title}</span>
                      <span className="text-xs text-cinema-dim">{h.year}</span>
                      <span className="ml-auto text-[10px] text-cinema-dim">TMDB · AI 분석</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-cinema-dim">바로 해보기</span>
                <button className="chip" onClick={() => goToMovie("기생충")}>기생충</button>
                <button className="chip" onClick={() => goToMovie("부산행")}>부산행</button>
                <button className="chip" onClick={() => { setQ("ㄱㅎㅈㅇ"); setDropOpen(true); }}>초성 ㄱㅎㅈㅇ</button>
                <button className="chip" onClick={() => { setIdeaMode(true); setDropOpen(false); }}>제목이 기억 안 나요 →</button>
                <button className="chip" onClick={() => router.push("/write")}>뼈대 없이 바로 쓰기 ✍️</button>
              </div>
            </div>
          ) : (
            <div>
              <textarea
                className="hero-input glass min-h-[104px] !pl-4"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="예: 가난한 삼남매가 부잣집에 하나씩 취직하면서 벌어지는 이야기. 가족이 함께 사기를 치는데 점점 위험해지는…"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={findByIdea} disabled={analyzing} className="btn-amber disabled:opacity-50">{analyzing ? "찾는 중… 🎞️" : "🍿 닮은 뼈대 찾기"}</button>
                <span className="text-xs text-cinema-dim">아이디어와 닮은 거장의 작품을 찾아, 플롯을 훑어보고 고르세요</span>
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-[#e2604c]">{error}</p>}
        </div>
      </section>

      {/* 아이디어 매칭 결과 */}
      {matches && (
        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold">이 이야기와 닮은 뼈대 <span className="text-cinema-dim">— 플롯을 훑어보고 마음에 드는 걸 고르세요</span></h2>
          <p className="mb-3 text-xs text-cinema-dim">{matchNote}</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {matches.map((m) => (
              <div key={m.title} className="card flex gap-3 p-3.5">
                <PosterThumb title={m.title} url={posterOf(m.title)} w={64} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.title} <span className="text-xs font-normal text-cinema-dim">{m.year}</span></p>
                  {m.matched.length > 0 && (
                    <p className="mt-0.5 flex flex-wrap gap-1">
                      {m.matched.slice(0, 4).map((t) => <span key={t} className="rounded bg-cinema-line/60 px-1.5 py-0.5 text-[10px] text-cinema-sub">#{t}</span>)}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-cinema-sub">{m.logline}</p>
                  <button onClick={() => goToMovie(m.title)} className="mt-2 text-xs font-semibold text-cinema-amber hover:underline">플롯 24블록 보기 →</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {analyzing && (
        <div className="card mb-6 p-10 text-center text-cinema-sub">닮은 뼈대를 찾는 중… 🍿</div>
      )}

      {/* 라이브러리 — 거장 확정 + AI 분석 */}
      <section className="min-w-0 space-y-8">
        <div>
          <h2 className="mb-3 text-[16px] font-semibold text-cinema-sub">거장 확정 라이브러리 <span className="text-cinema-dim">{masters.length}편 — 포스터를 누르면 뼈대가 열립니다</span></h2>
          <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5" style={{ perspective: "1100px" }}>
            {masters.map((m) => (
              <TiltCard key={m.title} onClick={() => goToMovie(m.title)}>
                <PosterCard title={m.title} url={m.posterUrl} />
                <p className="mt-2 truncate text-[13.5px] font-medium">{m.title}</p>
                <p className="text-xs text-cinema-dim">{m.year}{m.keyword ? ` · ${m.keyword}` : ""}</p>
              </TiltCard>
            ))}
          </div>
        </div>
        {aiLib.length > 0 && (
          <div>
            <h2 className="mb-3 text-[16px] font-semibold text-cinema-sub">AI 분석 라이브러리 <span className="text-cinema-dim">{aiLib.length}편 — 흥행작을 같은 24블록 틀로 분석했어요</span></h2>
            <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5" style={{ perspective: "1100px" }}>
              {aiLib.map((m) => (
                <TiltCard key={m.title} onClick={() => goToMovie(m.title)}>
                  <PosterCard title={m.title} url={m.posterUrl} />
                  <p className="mt-2 truncate text-[13.5px] font-medium">{m.title}</p>
                  <p className="text-xs text-cinema-dim">{m.year}{m.keyword ? ` · ${m.keyword}` : ""}</p>
                </TiltCard>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="mt-10 border-t border-cinema-line pt-4 text-[11px] text-cinema-dim">
        4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120) · This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </main>
  );
}

/* 마우스를 따라 기우는 3D 포스터 카드 */
function TiltCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      className="poster-tile text-left"
      onMouseMove={(e) => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${(x * 10).toFixed(1)}deg) rotateX(${(-y * 10).toFixed(1)}deg) translateY(-4px) scale(1.02)`;
      }}
      onMouseLeave={() => { if (ref.current) ref.current.style.transform = ""; }}
    >
      {children}
    </button>
  );
}

function PosterThumb({ title, url, w }: { title: string; url?: string | null; w: number }) {
  const [broken, setBroken] = useState(false);
  const h = Math.round(w * 1.5);
  if (url && !broken)
    return <img src={url} alt="" onError={() => setBroken(true)} width={w} height={h} className="shrink-0 rounded object-cover" style={{ width: w, height: h }} loading="lazy" />;
  return <span className="flex shrink-0 items-center justify-center rounded text-xs font-semibold text-white/85" style={{ width: w, height: h, background: posterColor(title) }}>{title.slice(0, 1)}</span>;
}
