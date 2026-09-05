"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiResult, Results } from "@/components/BenchmarkResult";
import { ConceptHelp } from "@/components/ConceptHelp";
import { CURRENT_KEY, localWorkStore, projectForRegeneration, saveWork, syncWorkFromProject } from "@/engine/library";

/* ── 타입 ─────────────────────────────────────── */
interface FormState {
  logline: string; premise: string; genre: string; target: string; tone: string; hookNote: string;
  ideaNote: string; theme: string; heroName: string; heroWant: string; heroNeed: string;
}
interface LibItem { title: string; posterUrl?: string | null; backdropUrl?: string | null }

const EMPTY: FormState = { logline: "", premise: "", genre: "", target: "", tone: "", hookNote: "", ideaNote: "", theme: "", heroName: "", heroWant: "", heroNeed: "" };
const DRAFT_KEY = "mc_draft";
const norm = (s: string) => (s || "").toLowerCase().replace(/[\s<>:,·\[\]()「」'".\-]/g, "");

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

export default function WritePage() {
  return (
    <Suspense fallback={null}>
      <WriteInner />
    </Suspense>
  );
}

function WriteInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [benchmark, setBenchmark] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState(true);
  const [pipelineInfo, setPipelineInfo] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [lib, setLib] = useState<LibItem[]>([]);
  const [savedWorkId, setSavedWorkId] = useState<string | null>(null);
  const draftRef = useRef<ReturnType<typeof setTimeout>>();
  const resultRef = useRef<HTMLDivElement>(null);

  // ☀️/🌙 저장된 모드 적용 (홈과 공유)
  useEffect(() => {
    try { const m = localStorage.getItem("mc_mode"); if (m === "light" || m === "dark") document.documentElement.setAttribute("data-mode", m); } catch { /* 무시 */ }
  }, []);

  // 초안 복원 + 포스터 라이브러리
  useEffect(() => {
    fetch("/api/benchmark").then((r) => r.json()).then((d) => setLib(d.list || [])).catch(() => {});
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.form) { setForm({ ...EMPTY, ...d.form }); if (d.benchmark) setBenchmark(d.benchmark); }
      }
    } catch { /* 무시 */ }
  }, []);

  // 영화 페이지에서 "이 뼈대로" 하고 들어온 경우 — 새 뼈대가 초안 복원값을 이긴다
  useEffect(() => {
    const bm = searchParams.get("benchmark");
    if (bm) {
      setBenchmark(bm);
      router.replace("/write");
    }
  }, [searchParams, router]);

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

  function update<K extends keyof FormState>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function fillExample() {
    setForm(EXAMPLE);
    setBenchmark((b) => b ?? "기생충");
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.logline.trim()) { setError("한 줄이라도 좋아요 — 로그라인을 적어주세요."); return; }
    setError(null); setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, pipeline, benchmarkName: benchmark ?? undefined }) });
      const d = (await r.json()) as ApiResult;
      if (!r.ok) throw new Error(d.error || "생성 실패");
      setResult(d);
      if (d.story) {
        try {
          if (savedWorkId) {
            const current = projectForRegeneration(d.story, savedWorkId, benchmark ?? undefined, localWorkStore.get(savedWorkId));
            localStorage.setItem(CURRENT_KEY, JSON.stringify(current));
            syncWorkFromProject(current);
          } else {
            const work = saveWork(d.story, { benchmarkName: benchmark ?? undefined, origin: "write" });
            setSavedWorkId(work.id);
          }
        } catch (cause: unknown) {
          setError(cause instanceof Error ? cause.message : "작품은 만들었지만 저장은 확인이 필요합니다.");
        }
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e2) { setError(e2 instanceof Error ? e2.message : "오류"); }
    finally { setLoading(false); }
  }

  const posterOf = (title: string) => lib.find((m) => norm(m.title) === norm(title))?.posterUrl || null;
  const stage = result?.story ? 2 : form.logline || form.heroName ? 1 : 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      {/* 헤더 */}
      <header className="mb-6 flex items-center gap-4">
        <Link href="/explore" className="flex items-center gap-2.5 transition-opacity hover:opacity-80" title="처음 화면으로">
          <span className="h-2.5 w-2.5 rounded-full bg-cinema-amber" />
          <h1 className="text-lg font-semibold tracking-tight">모두의 영화 창작</h1>
        </Link>
        <span className="text-xs text-cinema-dim">시네마 스튜디오</span>
        <span className="flex-1" />
        <nav className="flex items-center gap-4 text-[15px]">
          <Link href="/explore" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">탐색</Link>
          <span className="border-b-2 border-cinema-amber pb-0.5 font-semibold text-cinema-amber">글쓰기</span>
          <Link href="/studio" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">작업실</Link>
          <Link href="/library" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">내 서재</Link>
        </nav>
      </header>

      {/* ✍️ 스토리 프로필 — 작가의 책상 (전용 페이지) */}
      <section className="card mb-6 p-6">
        <form onSubmit={onGenerate}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold">✍️ 스토리 프로필 — 여기가 당신의 책상</h2>
            {benchmark && <span className="rounded-full bg-cinema-amber/15 px-2.5 py-1 text-[11px] text-cinema-amber">🔗 뼈대: {benchmark}</span>}
            <span className="flex-1" />
            <Stages current={stage} />
            <button type="button" onClick={fillExample} className="btn-ghost !px-2.5 !py-1 text-xs" title="예시 데이터로 전부 채워서 바로 체험">🎲 예시로 채우기</button>
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
                className="input min-h-[380px] text-[15px] leading-7"
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
                <Field label={<><ConceptHelp term="결핍">속결핍</ConceptHelp> — 진짜 필요한 것</>}><input className="input" value={form.heroNeed} onChange={(e) => update("heroNeed", e.target.value)} placeholder="믿음, 가족, 자존…" /></Field>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <Field label="장르"><input className="input" value={form.genre} onChange={(e) => update("genre", e.target.value)} /></Field>
                <Field label="타깃"><input className="input" value={form.target} onChange={(e) => update("target", e.target.value)} /></Field>
                <Field label="톤"><input className="input" value={form.tone} onChange={(e) => update("tone", e.target.value)} /></Field>
              </div>
              <Field label="후크 — 나만의 차별점 ★ (AI가 채우지 않는 유일한 칸)">
                <textarea className="input min-h-[64px] border-cinema-amber/40 text-[15px]" value={form.hookNote} onChange={(e) => update("hookNote", e.target.value)} placeholder="천 명이 같은 도구로 써도, 이건 나만 쓸 수 있다 — 그 비틀기." />
              </Field>

              {/* R1→R2→R3 토글 + 초보자용 설명 */}
              <div className="rounded-lg bg-cinema-surface2 px-3 py-2 text-xs text-cinema-sub">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={pipeline} onChange={(e) => setPipeline(e.target.checked)} />
                  R1 취재 → R2 구조 → R3 인물 순차 설계
                  <button type="button" onClick={() => setPipelineInfo((v) => !v)}
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-cinema-line text-[11px] font-bold text-cinema-dim transition-colors hover:border-cinema-amber hover:text-cinema-amber"
                    title="이게 뭐예요?">?</button>
                </label>
                {pipelineInfo && (
                  <div className="mt-2 space-y-1.5 rounded-lg border border-cinema-line bg-cinema-surface p-3 leading-relaxed">
                    <p className="font-bold text-cinema-text">📋 드라마 작가님들의 실제 작업 순서를 그대로 본뜬 기능이에요</p>
                    <p><b className="text-cinema-amber">R1 취재</b> — 보조작가가 소재를 조사하듯, 아이디어 노트에 쏟아낸 재료를 모아 정리합니다.</p>
                    <p><b className="text-cinema-amber">R2 구조</b> — 메인작가가 뼈대를 짜듯, 4막·24블록에 사건을 배치합니다. 전환점(13)이 여기서 잡혀요.</p>
                    <p><b className="text-cinema-amber">R3 인물</b> — 인물 담당이 캐릭터를 다듬듯, 주인공의 겉욕망·속결핍과 조연들의 욕망선을 세웁니다.</p>
                    <p className="text-cinema-dim">끄면 한 번에 설계합니다 (빠르지만 덜 촘촘해요). 처음이라면 켜두세요!</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button type="submit" disabled={loading} className="btn-amber disabled:opacity-50">{loading ? "설계 중… 🛠️" : "✨ 24블록 설계도 만들기"}</button>
                {benchmark && <button type="button" onClick={() => setBenchmark(null)} className="btn-ghost">뼈대 해제</button>}
              </div>
              {benchmark && <p className="text-xs text-cinema-amber">🔗 구조는 유지하고 결만 바꿉니다 (창조적 변주)</p>}
              {error && <p className="text-sm text-[#e2604c]">{error}</p>}
            </div>
          </div>
        </form>
      </section>

      {/* 결과 */}
      <div ref={resultRef} className="space-y-5">
        {loading && (
          <div className="card p-10 text-center text-cinema-sub">엔진이 당신의 24블록을 설계하는 중… ⏳</div>
        )}
        {!loading && result?.story && (
          <Results
            data={result}
            posterUrl={posterOf(result.story.title || "")}
            onOpenStudio={() => router.push("/studio")}
          />
        )}
      </div>

      <footer className="mt-10 border-t border-cinema-line pt-4 text-[11px] text-cinema-dim">
        4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120) · This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </main>
  );
}

/* ── 부품 ─────────────────────────────────────── */
function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-cinema-sub">{label}</span>{children}</label>;
}

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
