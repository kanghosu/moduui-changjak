"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Block, Character, Story, ValidationIssue } from "@/engine/schema";

/* ── 타입 ─────────────────────────────────────── */
interface FormState {
  logline: string; premise: string; genre: string; target: string; tone: string; hookNote: string;
  ideaNote: string; theme: string; heroName: string; heroWant: string; heroNeed: string;
}
interface StageTrace { stage: "R1" | "R2" | "R3"; agent: string; title: string; detail: string }
interface ApiResult {
  story?: Story; issues?: ValidationIssue[];
  engine: string; model?: string; mode?: string; trace?: StageTrace[];
  error?: string; needsKey?: boolean; message?: string;
}
interface LibItem { title: string; year?: string; keyword?: string; analyst?: string; posterUrl?: string | null; backdropUrl?: string | null }
interface TmdbHit { id: number; title: string; year: string; posterUrl: string | null; overview: string }
interface MatchItem { title: string; year?: string; keyword?: string; logline: string; score: number; matched: string[] }

/* ── 상수 ─────────────────────────────────────── */
const ACT_BG: Record<number, string> = { 1: "#4e8cd9", 2: "#8b6fd9", 3: "#d9608c", 4: "#d97a45" };
const ACT_NAME: Record<number, string> = { 1: "1막 · 설정과 도입", 2: "2막 · 즉자적 욕망", 3: "3막 · 대자적 욕망", 4: "4막 · 결사항전" };
const POSTER_COLORS = ["#185FA5", "#534AB7", "#993556", "#0F6E56", "#993C1D", "#444441", "#72243E", "#0C447C"];
const EMPTY: FormState = { logline: "", premise: "", genre: "", target: "", tone: "", hookNote: "", ideaNote: "", theme: "", heroName: "", heroWant: "", heroNeed: "" };
const DRAFT_KEY = "mc_draft";

// 🎲 예시 데이터 — 처음 온 사람이 결과물까지 원클릭으로 체험
const EXAMPLE: FormState = {
  ideaNote: [
    "- 새벽 인력시장에서 본 아버지들의 얼굴, 번호표처럼 서 있던 등",
    '- "패는 읽는 게 아니라 기다리는 거야" — 꼭 쓰고 싶은 대사',
    "- 돈이 아니라 '남은 시간'을 판돈으로 거는 지하 도박장이 있다면?",
    "- 형이라 부르게 된 판주. 그런데 그 판이 아버지의 빚에서 시작됐다면",
    "- 결말은 이기고도 전부 잃은 기분. 그런데 이상하게 후련한",
    "- 참고하고 싶은 결: 기생충의 계급 대비, 명량의 두려움→용기",
  ].join("\n"),
  logline: "빚에 쫓기던 한도수가 '시간을 거는' 지하 도박장에 잠입해 판주와 형제가 되지만, 그 판이 아버지의 빚에서 시작됐음을 알게 되는 이야기",
  theme: "신뢰가 사치가 된 세상에서, 그래도 한 사람을 믿는다는 것",
  premise: "돈 대신 수명을 판돈으로 거는 비밀 도박장",
  heroName: "한도수",
  heroWant: "아버지 빚 청산",
  heroNeed: "믿을 수 있는 단 한 사람",
  genre: "범죄 드라마",
  target: "20-40대",
  tone: "비장하지만 따뜻한",
  hookNote: "패가 아니라 사람을 읽는 도박 — 그리고 마지막 판의 판돈은 자기 자신",
};

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

function posterColor(title: string) {
  let h = 0; for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return POSTER_COLORS[h % POSTER_COLORS.length];
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
  const [result, setResult] = useState<ApiResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [benchmark, setBenchmark] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pipeline, setPipeline] = useState(true);
  const [writingMode, setWritingMode] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [mode, setMode] = useState<"dark" | "light">("dark");

  // ☀️/🌙 모드 — html에 적용 + 저장
  useEffect(() => {
    try { const m = localStorage.getItem("mc_mode"); if (m === "light" || m === "dark") setMode(m); } catch { /* 무시 */ }
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    try { localStorage.setItem("mc_mode", mode); } catch { /* 무시 */ }
  }, [mode]);
  const formRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const draftRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/benchmark").then((r) => r.json()).then((d) => setLib(d.list || [])).catch(() => {});
    // 초안 복원 — 작가의 글은 절대 사라지지 않는다
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.form) { setForm({ ...EMPTY, ...d.form }); if (d.benchmark) setBenchmark(d.benchmark); if (Object.values(d.form).some((v) => v)) setWritingMode(true); }
      }
    } catch { /* 무시 */ }
  }, []);

  // 초안 자동 저장 (1.2초 디바운스)
  useEffect(() => {
    clearTimeout(draftRef.current);
    draftRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, benchmark }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 1500);
      } catch { /* 무시 */ }
    }, 1200);
  }, [form, benchmark]);

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

  function update<K extends keyof FormState>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  // 로고/탐색 = 언제나 처음 화면으로 (작성 중인 글은 자동 저장돼 있어 안전)
  function resetHome() {
    setResult(null); setMatches(null); setNotice(null); setError(null);
    setQ(""); setIdeaMode(false); setDropOpen(false); setWritingMode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 결과 → 라이브러리로 돌아가기 (작성 패널은 유지)
  function backToLibrary() {
    setResult(null); setMatches(null); setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 🎲 예시로 채우기 — 처음 온 사람이 결과물까지 원클릭 체험
  function fillExample() {
    setForm(EXAMPLE);
    setBenchmark((b) => b ?? "기생충");
    setWritingMode(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  async function analyze(title: string) {
    if (!title.trim()) return;
    setDropOpen(false); setError(null); setNotice(null); setAnalyzing(true); setResult(null); setMatches(null);
    try {
      const r = await fetch("/api/benchmark", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
      const d = (await r.json()) as ApiResult;
      if (!r.ok) throw new Error(d.error || "분석 실패");
      if (d.needsKey) { setNotice(d.message || ""); return; }
      setResult(d);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setError(e instanceof Error ? e.message : "오류"); }
    finally { setAnalyzing(false); }
  }

  async function findByIdea() {
    if (!idea.trim()) { setError("쓰고 싶은 이야기를 한두 줄 적어주세요."); return; }
    setError(null); setNotice(null); setAnalyzing(true); setResult(null);
    try {
      const r = await fetch("/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "매칭 실패");
      setMatches(d.matches || []); setMatchNote(d.note || "");
    } catch (e) { setError(e instanceof Error ? e.message : "오류"); }
    finally { setAnalyzing(false); }
  }

  function startVariation() {
    const s = result?.story; if (!s) return;
    setBenchmark(s.title || "벤치마크");
    setForm((f) => ({ ...f, ideaNote: f.ideaNote || (ideaMode ? idea : ""), genre: s.genre || f.genre, tone: s.tone || f.tone, target: s.target || f.target }));
    setWritingMode(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.logline.trim()) { setError("한 줄이라도 좋아요 — 로그라인을 적어주세요."); return; }
    setError(null); setLoading(true); setResult(null); setMatches(null);
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, pipeline, benchmarkName: benchmark ?? undefined }) });
      const d = (await r.json()) as ApiResult;
      if (!r.ok) throw new Error(d.error || "생성 실패");
      setResult(d);
      // 작업실로 이어갈 수 있게 프로젝트 저장
      if (d.story) {
        try {
          localStorage.setItem("mc_project", JSON.stringify({ story: d.story, benchmarkName: benchmark ?? undefined, confirmed: {}, snapshots: [] }));
        } catch { /* 저장 실패는 무시 */ }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e2) { setError(e2 instanceof Error ? e2.message : "오류"); }
    finally { setLoading(false); }
  }

  const busy = analyzing || loading;

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      {/* 헤더 — 로고 클릭 = 언제나 처음 화면 */}
      <header className="mb-6 flex items-center gap-4">
        <button onClick={resetHome} className="flex items-center gap-2.5 transition-opacity hover:opacity-80" title="처음 화면으로">
          <span className="h-2.5 w-2.5 rounded-full bg-cinema-amber" />
          <h1 className="text-lg font-semibold tracking-tight">모두의 창작</h1>
        </button>
        <span className="text-xs text-cinema-dim">시네마 스튜디오</span>
        <span className="flex-1" />
        <nav className="flex items-center gap-4 text-[15px]">
          <button onClick={resetHome} className="border-b-2 border-cinema-amber pb-0.5 font-semibold text-cinema-amber">탐색</button>
          <Link href="/studio" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">작업실</Link>
          <Link href="/library" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">내 서재</Link>
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
                onKeyDown={(e) => { if (e.key === "Enter" && (libHits[0] || q.trim())) analyze(libHits[0]?.title || q); if (e.key === "Escape") setDropOpen(false); }}
                placeholder="어떤 영화처럼 쓰고 싶나요?"
              />
              {dropOpen && (libHits.length > 0 || tmdbHits.length > 0) && (
                <div className="dropdown-panel absolute inset-x-0 top-[58px] z-30 overflow-hidden rounded-xl">
                  {libHits.map((m) => (
                    <button key={m.title} onClick={() => { setQ(m.title); analyze(m.title); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cinema-line/40">
                      <PosterThumb title={m.title} url={m.posterUrl} w={30} />
                      <span className="text-sm">{m.title}</span>
                      <span className="text-xs text-cinema-dim">{m.year}</span>
                      <span className="ml-auto rounded-full bg-cinema-amber/15 px-2 py-0.5 text-[10px] text-cinema-amber">거장 확정</span>
                    </button>
                  ))}
                  {tmdbHits.filter((h) => !libHits.some((l) => norm(l.title) === norm(h.title))).map((h) => (
                    <button key={h.id} onClick={() => { setQ(h.title); analyze(h.title); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cinema-line/40">
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
                <button className="chip" onClick={() => analyze("기생충")}>기생충</button>
                <button className="chip" onClick={() => analyze("부산행")}>부산행</button>
                <button className="chip" onClick={() => { setQ("ㄱㅎㅈㅇ"); setDropOpen(true); }}>초성 ㄱㅎㅈㅇ</button>
                <button className="chip" onClick={() => { setIdeaMode(true); setDropOpen(false); }}>제목이 기억 안 나요 →</button>
                <button className="chip" onClick={() => { setWritingMode(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 60); }}>뼈대 없이 바로 쓰기 ✍️</button>
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
                <button onClick={findByIdea} disabled={busy} className="btn-amber disabled:opacity-50">{analyzing ? "찾는 중… 🎞️" : "🍿 닮은 뼈대 찾기"}</button>
                <span className="text-xs text-cinema-dim">아이디어와 닮은 거장의 작품을 찾아, 플롯을 훑어보고 고르세요</span>
              </div>
            </div>
          )}
          {notice && <p className="glass mt-4 rounded-lg px-3 py-2 text-xs text-cinema-amber">🔑 {notice}</p>}
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
                  <button onClick={() => analyze(m.title)} className="mt-2 text-xs font-semibold text-cinema-amber hover:underline">플롯 24블록 보기 →</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ✍️ 스토리 프로필 — 작가의 책상 (전체 폭) */}
      {writingMode && (
        <section ref={formRef} className="card mb-6 p-6">
          <form onSubmit={onGenerate}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-base font-bold">✍️ 스토리 프로필 — 여기가 당신의 책상</h2>
              {benchmark && <span className="rounded-full bg-cinema-amber/15 px-2.5 py-1 text-[11px] text-cinema-amber">🔗 뼈대: {benchmark}</span>}
              <span className="flex-1" />
              <Stages current={result?.story && result.mode !== "benchmark" ? 2 : form.logline || form.heroName ? 1 : 0} />
              <button type="button" onClick={fillExample} className="btn-ghost !px-2.5 !py-1 text-xs" title="예시 데이터로 전부 채워서 바로 체험">🎲 예시로 채우기</button>
              <button type="button" onClick={() => setWritingMode(false)} className="btn-ghost !px-2.5 !py-1 text-xs">접기</button>
            </div>

            <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.05fr_1fr]">
              {/* ① 쏟아내기 */}
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-cinema-amber">① 아이디어 노트 — 두서없이 쏟아내세요</span>
                  <span className="text-[11px] text-cinema-dim">{form.ideaNote.length.toLocaleString()}자{draftSaved ? " · 저장됨 ✓" : " · 자동 저장"}</span>
                </div>
                <p className="mb-2 text-xs leading-relaxed text-cinema-dim">
                  장면 하나, 대사 한 줄, 기억, 뉴스, 인물 스케치… 순서도 문법도 필요 없어요. <b className="text-cinema-sub">정리는 구조가 합니다.</b> 여기 적은 전부가 R1 취재 재료로 들어갑니다.
                </p>
                <textarea
                  className="input min-h-[340px] text-[15px] leading-7"
                  value={form.ideaNote}
                  onChange={(e) => update("ideaNote", e.target.value)}
                  placeholder={"예)\n- 새벽 인력시장에서 본 아버지들의 얼굴\n- \"패는 읽는 게 아니라 기다리는 거야\" — 이 대사 꼭 쓰고 싶다\n- 주인공이 돈이 아니라 '시간'을 거는 도박이라면?\n- 형이라 부르던 사람이 사실은…\n- 결말은 이기고도 전부 잃은 기분이면 좋겠다"}
                />
              </div>

              {/* ② 정리 */}
              <div className="space-y-3.5">
                <span className="block text-sm font-bold text-cinema-amber">② 정리 — 구조가 물어보는 것들</span>
                <Field label="로그라인 * — 위 노트를 한 줄로 누르면?">
                  <textarea className="input min-h-[60px] text-[15px]" value={form.logline} onChange={(e) => update("logline", e.target.value)} placeholder="[주인공]이 [욕망]을 위해 [행동]하지만, [갈등]에 부딪혀 [결단]하는 이야기" />
                </Field>
                <Field label="주제 · 기획의도 — 이 이야기로 무엇을 말하고 싶나요?">
                  <textarea className="input min-h-[52px] text-[15px]" value={form.theme} onChange={(e) => update("theme", e.target.value)} placeholder="예: 신뢰가 사치가 된 세상에서, 그래도 사람을 믿는다는 것" />
                </Field>
                <Field label="소재 / 사건">
                  <textarea className="input min-h-[48px]" value={form.premise} onChange={(e) => update("premise", e.target.value)} />
                </Field>
                <div className="grid grid-cols-3 gap-2.5">
                  <Field label="주인공 이름"><input className="input" value={form.heroName} onChange={(e) => update("heroName", e.target.value)} placeholder="이름/별명" /></Field>
                  <Field label="겉욕망 — 원하는 것"><input className="input" value={form.heroWant} onChange={(e) => update("heroWant", e.target.value)} placeholder="돈, 인정, 복수…" /></Field>
                  <Field label="속결핍 — 진짜 필요한 것"><input className="input" value={form.heroNeed} onChange={(e) => update("heroNeed", e.target.value)} placeholder="믿음, 가족, 자존…" /></Field>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <Field label="장르"><input className="input" value={form.genre} onChange={(e) => update("genre", e.target.value)} /></Field>
                  <Field label="타깃"><input className="input" value={form.target} onChange={(e) => update("target", e.target.value)} /></Field>
                  <Field label="톤"><input className="input" value={form.tone} onChange={(e) => update("tone", e.target.value)} /></Field>
                </div>
                <Field label="후크 — 나만의 차별점 ★ (AI가 채우지 않는 유일한 칸)">
                  <textarea className="input min-h-[64px] border-cinema-amber/40 text-[15px]" value={form.hookNote} onChange={(e) => update("hookNote", e.target.value)} placeholder="천 명이 같은 도구로 써도, 이건 나만 쓸 수 있다 — 그 비틀기." />
                </Field>
                <label className="flex items-center gap-2 rounded-lg bg-cinema-surface2 px-3 py-2 text-xs text-cinema-sub">
                  <input type="checkbox" checked={pipeline} onChange={(e) => setPipeline(e.target.checked)} />
                  R1 취재 → R2 구조 → R3 인물 순차 설계
                </label>
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={busy} className="btn-amber disabled:opacity-50">{loading ? "설계 중… 🛠️" : "✨ 24블록 설계도 만들기"}</button>
                  {benchmark && <button type="button" onClick={() => setBenchmark(null)} className="btn-ghost">뼈대 해제</button>}
                </div>
                {benchmark && <p className="text-xs text-cinema-amber">🔗 구조는 유지하고 결만 바꿉니다 (창조적 변주)</p>}
              </div>
            </div>
          </form>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* 결과 or 포스터 그리드 */}
        <section className="min-w-0 space-y-5">
          {busy && (
            <div className="card p-10 text-center text-cinema-sub">
              {analyzing ? "4막·24블록을 해부하는 중… 🎞️" : "엔진이 당신의 24블록을 설계하는 중… ⏳"}
            </div>
          )}
          {!busy && result?.story && (
            <div className="flex items-center gap-2">
              <button onClick={backToLibrary} className="btn-ghost !px-2.5 !py-1.5 text-xs">← 라이브러리</button>
              <span className="text-[11px] text-cinema-dim">다른 영화를 고르거나, 아래 결과를 이어서 다듬으세요</span>
            </div>
          )}
          {!busy && result?.story && (
            <Results
              data={result}
              posterUrl={posterOf(result.story.title || "")}
              backdropUrl={lib.find((m) => norm(m.title) === norm(result.story!.title || ""))?.backdropUrl || null}
              onStartVariation={result.mode === "benchmark" ? startVariation : undefined}
              onOpenStudio={result.mode !== "benchmark" ? () => router.push("/studio") : undefined}
            />
          )}
          {!busy && !result?.story && (
            <div>
              <h2 className="mb-3 text-[16px] font-semibold text-cinema-sub">거장 확정 라이브러리 <span className="text-cinema-dim">{lib.length}편 — 포스터를 누르면 뼈대가 열립니다</span></h2>
              <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5" style={{ perspective: "1100px" }}>
                {lib.map((m) => (
                  <TiltCard key={m.title} onClick={() => analyze(m.title)}>
                    <PosterCard title={m.title} url={m.posterUrl} />
                    <p className="mt-2 truncate text-[13.5px] font-medium">{m.title}</p>
                    <p className="text-xs text-cinema-dim">{m.year}{m.keyword ? ` · ${m.keyword}` : ""}</p>
                  </TiltCard>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>

      <footer className="mt-10 border-t border-cinema-line pt-4 text-[11px] text-cinema-dim">
        4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120) · This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </main>
  );
}

/* ── 부품 ─────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-cinema-sub">{label}</span>{children}</label>;
}

/* 시스템 단계 스텝퍼 — 지금 어디쯤인지 항상 보이게 */
function Stages({ current }: { current: number }) {
  const st = ["① 쏟아내기", "② 정리", "③ 설계", "④ 블록 다듬기", "⑤ 원고"];
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      {st.map((s, i) => (
        <span key={s} className={`rounded-full px-2.5 py-1 ${i === current ? "bg-cinema-amber font-bold text-[#412402]" : i < current ? "bg-cinema-line/70 text-cinema-text" : "border border-cinema-line text-cinema-dim"}`}>{s}</span>
      ))}
    </div>
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

function PosterCard({ title, url }: { title: string; url?: string | null }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken)
    return <img src={url} alt={title} onError={() => setBroken(true)} className="aspect-[2/3] w-full rounded-lg border border-cinema-line object-cover" loading="lazy" />;
  return (
    <div className="poster-fallback flex aspect-[2/3] w-full items-center justify-center rounded-lg" style={{ background: posterColor(title) }}>
      <span className="text-2xl font-semibold text-white/85">{title.replace(/[<>\s]/g, "").slice(0, 1)}</span>
    </div>
  );
}

function PosterThumb({ title, url, w }: { title: string; url?: string | null; w: number }) {
  const [broken, setBroken] = useState(false);
  const h = Math.round(w * 1.5);
  if (url && !broken)
    return <img src={url} alt="" onError={() => setBroken(true)} width={w} height={h} className="shrink-0 rounded object-cover" style={{ width: w, height: h }} loading="lazy" />;
  return <span className="flex shrink-0 items-center justify-center rounded text-xs font-semibold text-white/85" style={{ width: w, height: h, background: posterColor(title) }}>{title.slice(0, 1)}</span>;
}

function Results({ data, posterUrl, backdropUrl, onStartVariation, onOpenStudio }: { data: ApiResult; posterUrl: string | null; backdropUrl?: string | null; onStartVariation?: () => void; onOpenStudio?: () => void }) {
  const story = data.story!;
  const issues = data.issues || [];
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const isBenchmark = data.mode === "benchmark";
  const engineLabel = data.engine === "library" ? "거장 확정 분석" : data.engine === "anthropic" ? `AI 분석 (${data.model || ""})` : data.engine === "mock" ? "구조 골격 (mock)" : "결과";
  const byAct = [1, 2, 3, 4].map((a) => ({ act: a, blocks: story.blocks.filter((b) => b.act === a) }));

  return (
    <>
      {/* 히어로 (영화 백드롭) */}
      <div className="card relative overflow-hidden p-4">
        {backdropUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(100deg, rgba(19,23,29,0.97) 0%, rgba(19,23,29,0.9) 42%, rgba(19,23,29,0.5) 100%), url(${backdropUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
            }}
          />
        )}
        <div className="relative flex gap-4">
        <div className="w-24 shrink-0"><PosterCard title={story.title || story.logline} url={posterUrl} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-semibold">{story.title || "내 이야기"}</span>
            {story.year && <span className="text-xs text-cinema-dim">{story.year}</span>}
            {story.keyword && <span className="rounded-full bg-cinema-line/60 px-2 py-0.5 text-[10px] text-cinema-sub">키워드: {story.keyword}</span>}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-cinema-sub">{story.fourActLogline || story.logline}</p>
          {/* 4막 미니바 */}
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
            {[1, 2, 3, 4].map((a) => <span key={a} className="flex-1" style={{ background: ACT_BG[a] }} />)}
          </div>
          <p className="mt-1 text-center text-[10px] text-cinema-amber">▲ 전환점 {story.reversalPointIndex} · 즉자→대자 욕망이 뒤집히는 곳</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded-full bg-cinema-line/60 px-2 py-0.5 text-cinema-sub">{engineLabel}</span>
            {data.mode === "pipeline" && <span className="rounded-full bg-[#534AB7]/30 px-2 py-0.5 text-[#AFA9EC]">R1→R2→R3</span>}
            {errors.length === 0
              ? <span className="rounded-full bg-[#4caf7d]/15 px-2 py-0.5 text-[#4caf7d]">구조 검증 통과</span>
              : <span className="rounded-full bg-[#e2604c]/15 px-2 py-0.5 text-[#e2604c]">error {errors.length}</span>}
            {warns.length > 0 && <span className="rounded-full bg-[#e0a63e]/15 px-2 py-0.5 text-[#e0a63e]">warn {warns.length}</span>}
          </div>
          {isBenchmark && onStartVariation && (
            <button onClick={onStartVariation} className="btn-amber mt-3">✍️ 이 뼈대로 내 이야기 만들기 →</button>
          )}
          {onOpenStudio && (
            <button onClick={onOpenStudio} className="btn-amber mt-3">🛠️ 작업실에서 다듬기 →</button>
          )}
        </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold">구조 검증</h3>
          <ul className="space-y-1 text-xs">
            {issues.map((i, k) => <li key={k} className={i.level === "error" ? "text-[#e2604c]" : "text-[#e0a63e]"}>{i.level === "error" ? "● " : "▲ "}{i.message}</li>)}
          </ul>
        </div>
      )}

      {data.trace && data.trace.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-2 text-sm font-semibold">설계 과정</h3>
          <div className="flex flex-wrap gap-2">
            {data.trace.map((t) => (
              <span key={t.stage} className="rounded-lg bg-cinema-surface2 px-3 py-1.5 text-xs text-cinema-sub"><b className="text-[#AFA9EC]">{t.stage}</b> {t.title} — {t.detail}</span>
            ))}
          </div>
        </div>
      )}

      {/* 인물 */}
      <div className="card p-4">
        <h3 className="mb-3 text-sm font-semibold">인물 · 욕망선</h3>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {story.characters.map((c) => <CharacterCard key={c.id} c={c} />)}
        </div>
      </div>

      {/* 24블록 — 막별 그룹 */}
      <div className="space-y-4">
        {byAct.map(({ act, blocks }) => (
          <div key={act} className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: `${ACT_BG[act]}26` }}>
              <span className="h-2 w-2 rounded-full" style={{ background: ACT_BG[act] }} />
              <span className="text-sm font-semibold">{ACT_NAME[act]}</span>
              <span className="text-xs text-cinema-dim">블록 {blocks[0]?.index}–{blocks[blocks.length - 1]?.index}</span>
            </div>
            <div className="divide-y divide-cinema-line/60">
              {blocks.map((b) => <BlockRow key={b.index} b={b} />)}
            </div>
          </div>
        ))}
      </div>

      {story.takeaway && (
        <div className="card border-cinema-amber/30 p-4">
          <h3 className="mb-1 text-sm font-semibold text-cinema-amber">착안점 — 내 이야기에 어떻게 쓸까</h3>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-cinema-sub">{story.takeaway}</p>
        </div>
      )}

      {story.notes.length > 0 && (
        <div className="card bg-cinema-surface2 p-4">
          <ul className="list-disc space-y-1 pl-4 text-[11px] text-cinema-dim">
            {story.notes.map((n, k) => <li key={k}>{n}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function CharacterCard({ c }: { c: Character }) {
  const role: Record<Character["role"], [string, string]> = {
    protagonist: ["주인공", "#4e8cd9"], antagonist: ["적대자", "#e2604c"], ally: ["조력자", "#4caf7d"], supporting: ["조연", "#5e6875"],
  };
  const [label, color] = role[c.role];
  return (
    <div className="rounded-lg border border-cinema-line bg-cinema-surface2 p-3">
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
        {c.name}
        <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: `${color}22`, color }}>{label}</span>
      </p>
      {c.want && c.want !== "-" && <p className="text-[13px] text-cinema-sub">요구 — {c.want}</p>}
      {c.need && c.need !== "-" && <p className="text-[13px] text-cinema-sub">결핍 — {c.need}</p>}
      {c.arc && <p className="mt-1 text-[12.5px] text-cinema-dim">{c.arc}</p>}
    </div>
  );
}

function BlockRow({ b }: { b: Block }) {
  const body = b.summary || b.beat || "";
  return (
    <div className={`flex gap-3 px-4 py-3 ${b.isReversal ? "bg-cinema-amber/10" : ""}`}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: b.isReversal ? "#f5a524" : ACT_BG[b.act] }}>
        {b.index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12.5px] font-medium text-cinema-sub">{b.function}</span>
          {b.isReversal && <Tag bg="#f5a524" fg="#412402">전환점</Tag>}
          {b.antagonistEscalation && <Tag bg="#e2604c33" fg="#e2604c">적대자↑</Tag>}
          {b.bStory && <Tag bg="#4caf7d33" fg="#4caf7d">B스토리</Tag>}
          {b.runtime && <span className="text-[11px] text-cinema-dim">{b.runtime}</span>}
        </div>
        {b.subtitle && <p className="mt-1 text-[15px] font-semibold">{b.subtitle}</p>}
        {body && <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-cinema-sub">{body}</p>}
        {b.blockTakeaway && <p className="mt-1 rounded bg-cinema-amber/10 px-2 py-1 text-[11px] text-cinema-amber">💡 {b.blockTakeaway}</p>}
        {b.desireShift && <p className="mt-0.5 text-[11px] text-cinema-dim">욕망 전환 [{b.desireShift.axis}] {b.desireShift.fromState} → {b.desireShift.toState}</p>}
      </div>
    </div>
  );
}

function Tag({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: bg, color: fg }}>{children}</span>;
}
