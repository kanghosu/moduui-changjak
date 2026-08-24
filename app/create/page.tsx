"use client";

// /create — 자유 발화 창작 플로우 (회의 확정: 정리 → 분석 → 확장 → 선택 → 배치)
// 원칙: 질문지를 먼저 주지 않는다. 24블록이라는 용어는 최종 단계 전까지 노출하지 않는다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiResult, Results } from "@/components/BenchmarkResult";
import VoiceInput from "@/components/VoiceInput";
import {
  SESSION_KEY, emptySession, sessionToGenerateInput,
  type CreationSession, type CreationQuestion, type LoglineOption, type ExtractedElements,
} from "@/engine/creation";

const STAGE_NAMES = ["쏟아내기", "뼈대 찾기", "이야기 고르기", "깊게 만들기", "이야기 지도"];

// 쓰기를 고른 사람에게만 보이는 선택적 가이드 (강제 아님)
const GUIDE_CHIPS = [
  "머릿속에 남은 장면 하나",
  "주인공은 어떤 사람",
  "다루고 싶은 사건",
  "원하는 결말의 기분",
  "떠올랐던 영화 (예: 기생충)",
];

const ELEMENT_LABEL: Record<string, string> = {
  scene: "인상적인 장면", heroDesc: "주인공", heroName: "주인공 이름", heroWant: "겉으로 원하는 것",
  heroNeed: "진짜 필요한 것", premise: "사건·소재", theme: "주제", ending: "결말 방향",
  genre: "장르", tone: "톤", era: "시대·배경", benchmark: "떠올린 영화", choice: "갈림길", hook: "나만의 차별점",
};

const DEEPEN_AXES: { key: string; label: string; prompt: string }[] = [
  { key: "character", label: "인물 깊게", prompt: "\n[인물] 주인공이 가장 두려워하는 것, 숨기고 있는 것: " },
  { key: "event", label: "사건 깊게", prompt: "\n[사건] 이 이야기에서 꼭 벌어져야 하는 장면: " },
  { key: "plot", label: "흐름 깊게", prompt: "\n[흐름] 이야기 한가운데에서 뒤집히는 것: " },
  { key: "research", label: "자료·취재", prompt: "\n[취재] 더 알아보고 싶은 것, 실제로 아는 것: " },
];

interface LibItem { title: string; posterUrl?: string | null }
const norm = (s: string) => (s || "").toLowerCase().replace(/[\s<>:,·\[\]()「」'".\-]/g, "");

export default function CreatePage() {
  const router = useRouter();
  const [s, setS] = useState<CreationSession>(emptySession());
  const [loading, setLoading] = useState<string | null>(null); // 진행 문구
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [lib, setLib] = useState<LibItem[]>([]);
  const saveRef = useRef<ReturnType<typeof setTimeout>>();
  const textRef = useRef<HTMLTextAreaElement>(null);

  // 모드·세션 복원 + 포스터 라이브러리
  useEffect(() => {
    try {
      const m = localStorage.getItem("mc_mode");
      if (m === "light" || m === "dark") document.documentElement.setAttribute("data-mode", m);
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setS({ ...emptySession(), ...JSON.parse(raw) });
    } catch { /* 무시 */ }
    fetch("/api/benchmark").then((r) => r.json()).then((d) => setLib(d.list || [])).catch(() => {});
  }, []);

  // 세션 자동 저장
  useEffect(() => {
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* 무시 */ }
    }, 800);
  }, [s]);

  const posterOf = (title: string) => lib.find((m) => norm(m.title) === norm(title))?.posterUrl || null;

  function patch(p: Partial<CreationSession>) { setS((prev) => ({ ...prev, ...p })); }

  function goTo(stage: CreationSession["stage"]) {
    // 완료한 단계로는 자유롭게 되돌아갈 수 있다 (데이터는 보존)
    if (stage <= s.stage) patch({ stage });
  }

  /* ── 단계 전환 액션 ─────────────────────────── */

  async function runExtract() {
    if (!s.utterance.trim()) { setError("한 줄이라도 좋아요 — 그냥 떠들어 주세요."); return; }
    setError(null); setLoading("이야기 속에서 인물과 장면을 찾는 중…");
    try {
      const r = await fetch("/api/extract", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance: s.utterance }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "정리 실패");
      patch({ elements: d.elements, questions: d.questions, stage: 2 });
    } catch (e) { setError(e instanceof Error ? e.message : "오류"); }
    finally { setLoading(null); }
  }

  async function runLoglines() {
    setError(null); setLoading("세 가지 이야기 뼈대를 세우는 중…");
    try {
      // 질문 답변을 합친 요소로 요청
      const merged: ExtractedElements = { ...s.elements };
      for (const q of s.questions) {
        const a = (s.answers[q.id] || "").trim();
        if (a && !/^없(음|어요?)$/.test(a)) merged[q.elementKey] = a;
      }
      const r = await fetch("/api/loglines", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance: s.utterance, elements: merged }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "뼈대 생성 실패");
      patch({ loglineOptions: d.options, stage: 3 });
    } catch (e) { setError(e instanceof Error ? e.message : "오류"); }
    finally { setLoading(null); }
  }

  async function runGenerate() {
    setError(null); setLoading("이야기 지도를 그리는 중… (구조를 잡고, 인물을 세웁니다)");
    setResult(null);
    try {
      const input = sessionToGenerateInput(s);
      if (!input.logline) throw new Error("이야기 뼈대를 먼저 골라주세요.");
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, pipeline: true }),
      });
      const d = (await r.json()) as ApiResult;
      if (!r.ok) throw new Error(d.error || "생성 실패");
      setResult(d);
      if (d.story) {
        try {
          localStorage.setItem("mc_project", JSON.stringify({
            story: d.story, benchmarkName: input.benchmarkName, confirmed: {}, snapshots: [],
          }));
        } catch { /* 무시 */ }
      }
      patch({ stage: 5 });
    } catch (e) { setError(e instanceof Error ? e.message : "오류"); }
    finally { setLoading(null); }
  }

  function resetAll() {
    if (!confirm("처음부터 다시 시작할까요? 지금까지의 내용은 지워집니다.")) return;
    setS(emptySession()); setResult(null); setError(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* 무시 */ }
  }

  const answeredCount = s.questions.filter((q) => (s.answers[q.id] || "").trim()).length;

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      {/* 헤더 */}
      <header className="mb-6 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80" title="처음 화면으로">
          <span className="h-2.5 w-2.5 rounded-full bg-cinema-amber" />
          <h1 className="text-lg font-semibold tracking-tight">모두의 영화 창작</h1>
        </Link>
        <span className="text-xs text-cinema-dim">떠들면 이야기가 됩니다</span>
        <span className="flex-1" />
        <nav className="flex items-center gap-4 text-[15px]">
          <Link href="/" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">탐색</Link>
          <span className="border-b-2 border-cinema-amber pb-0.5 font-semibold text-cinema-amber">만들기</span>
          <Link href="/write" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">글쓰기</Link>
          <Link href="/studio" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">작업실</Link>
          <Link href="/library" className="font-medium text-cinema-dim transition-colors hover:text-cinema-text">내 서재</Link>
        </nav>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_190px]">
        {/* ── 본문 ── */}
        <div className="space-y-5">
          {/* 단계 1 — 쏟아내기 */}
          {s.stage === 1 && (
            <section className="card p-6">
              <h2 className="mb-1 text-xl font-bold">하고 싶은 이야기, 그냥 떠들어 주세요</h2>
              <p className="mb-4 text-sm text-cinema-sub">
                말해도 좋고 써도 좋아요. 순서도 문법도 필요 없습니다. <b className="text-cinema-text">정리는 저희가 합니다.</b>
              </p>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <VoiceInput onFinalText={(t) => {
                  setS((prev) => ({ ...prev, utterance: (prev.utterance ? prev.utterance.trimEnd() + " " : "") + t, source: prev.utterance ? "mixed" : "voice" }));
                }} />
                <span className="text-[11px] text-cinema-dim">{s.utterance.length.toLocaleString()}자 · 자동 저장</span>
              </div>
              <textarea
                ref={textRef}
                className="input min-h-[300px] text-[15px] leading-7"
                value={s.utterance}
                onChange={(e) => patch({ utterance: e.target.value })}
                placeholder={"예)\n꿈에서 본 장면이 하나 있는데, 너무 강렬해서 이걸로 뭔가 만들고 싶어요.\n유쾌하면서도 통쾌한 복수극이면 좋겠고… 주인공은 아직 잘 모르겠어요."}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[11px] text-cinema-dim">막막하면 이런 것부터 —</span>
                {GUIDE_CHIPS.map((c) => (
                  <button key={c} type="button" className="rounded-full border border-cinema-line px-2.5 py-0.5 text-[11px] text-cinema-sub transition-colors hover:border-cinema-amber hover:text-cinema-amber"
                    onClick={() => { patch({ utterance: (s.utterance ? s.utterance.trimEnd() + "\n" : "") + c + ": " }); textRef.current?.focus(); }}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={runExtract} disabled={!!loading} className="btn-amber disabled:opacity-50">
                  {loading ? "듣고 있어요…" : "✨ 이야기 정리 시작"}
                </button>
                {s.utterance && <button onClick={resetAll} className="btn-ghost text-xs">전부 지우기</button>}
              </div>
            </section>
          )}

          {/* 단계 2 — 뼈대 찾기 (추출 확인 + 부족분 질문) */}
          {s.stage === 2 && (
            <section className="card p-6">
              <h2 className="mb-1 text-xl font-bold">들은 것부터 확인할게요</h2>
              <p className="mb-4 text-sm text-cinema-sub">이미 말씀하신 건 다시 묻지 않아요. 아래는 이야기에서 찾아낸 것들입니다 — 틀리면 고쳐주세요.</p>

              {Object.entries(s.elements).filter(([, v]) => v).length > 0 ? (
                <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {Object.entries(s.elements).filter(([, v]) => v).map(([k, v]) => (
                    <label key={k} className="block">
                      <span className="mb-1 block text-xs font-medium text-cinema-amber">{ELEMENT_LABEL[k] || k}</span>
                      <input className="input text-sm" value={v || ""}
                        onChange={(e) => patch({ elements: { ...s.elements, [k]: e.target.value } })} />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mb-5 text-sm text-cinema-dim">아직 잡힌 게 많지 않아요 — 아래 몇 가지만 알려주시면 됩니다.</p>
              )}

              {s.questions.length > 0 && (
                <>
                  <div className="mb-2 flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-cinema-text">비어 있는 것만 여쭤볼게요</h3>
                    <span className="text-[11px] text-cinema-dim">{answeredCount}/{s.questions.length}개 답함 · 전부 건너뛰어도 됩니다 (질문은 최대 10개)</span>
                  </div>
                  <div className="space-y-3">
                    {s.questions.map((q: CreationQuestion) => (
                      <div key={q.id} className="rounded-lg border border-cinema-line p-3">
                        <p className="text-sm font-medium">{q.ask}</p>
                        {q.hint && <p className="mt-0.5 text-[11px] text-cinema-dim">{q.hint}</p>}
                        <div className="mt-2 flex items-center gap-2">
                          <input className="input flex-1 text-sm" value={s.answers[q.id] || ""}
                            onChange={(e) => patch({ answers: { ...s.answers, [q.id]: e.target.value } })}
                            placeholder="편하게 적어주세요" />
                          <button type="button" className="btn-ghost !px-2 !py-1 text-[11px]"
                            onClick={() => patch({ answers: { ...s.answers, [q.id]: "없음" } })}>없음</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button onClick={runLoglines} disabled={!!loading} className="btn-amber disabled:opacity-50">
                  {loading ? "뼈대를 세우는 중…" : "→ 이야기 뼈대 3개 보기"}
                </button>
                <button onClick={() => goTo(1)} className="btn-ghost">← 더 떠들기</button>
              </div>
            </section>
          )}

          {/* 단계 3 — 이야기 고르기 (로그라인 3안) */}
          {s.stage === 3 && (
            <section className="card p-6">
              <h2 className="mb-1 text-xl font-bold">어떤 이야기가 당신의 것인가요?</h2>
              <p className="mb-4 text-sm text-cinema-sub">같은 아이디어도 세 방향으로 자랄 수 있어요. 마음에 닿는 것 하나를 골라주세요 — 나중에 얼마든지 고칠 수 있습니다.</p>
              <div className="space-y-3">
                {s.loglineOptions.map((o: LoglineOption, i: number) => {
                  const poster = posterOf(o.benchmarkTitle);
                  const chosen = s.chosenIndex === i;
                  return (
                    <button key={i} type="button" onClick={() => patch({ chosenIndex: i })}
                      className={`block w-full rounded-xl border p-4 text-left transition-colors ${chosen ? "border-cinema-amber bg-cinema-amber/10" : "border-cinema-line hover:border-cinema-amber/60"}`}>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <span className="mb-1 inline-block rounded-full bg-cinema-surface2 px-2 py-0.5 text-[11px] text-cinema-sub">{o.direction}</span>
                          <p className="text-[15px] font-medium leading-relaxed">{o.logline}</p>
                          <p className="mt-2 text-xs text-cinema-dim">🎬 <b className="text-cinema-sub">{o.benchmarkTitle}</b> 같은 이야기를 만들고 싶으신가요? — {o.reason}</p>
                        </div>
                        {poster && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={poster} alt={o.benchmarkTitle} className="h-28 w-auto shrink-0 rounded-lg object-cover" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={() => { if (s.chosenIndex == null) { setError("하나를 골라주세요 — 나중에 바꿀 수 있어요."); return; } setError(null); patch({ stage: 4 }); }}
                  className="btn-amber">→ 이 이야기로 깊게 만들기</button>
                <button onClick={runLoglines} disabled={!!loading} className="btn-ghost text-xs">{loading ? "다시 세우는 중…" : "🔄 다른 뼈대 보기"}</button>
                <button onClick={() => goTo(2)} className="btn-ghost">← 답 고치기</button>
              </div>
            </section>
          )}

          {/* 단계 4 — 깊게 만들기 (심화 + 후크) */}
          {s.stage === 4 && (
            <section className="card p-6">
              <h2 className="mb-1 text-xl font-bold">조금만 더 깊게 들어가 볼까요?</h2>
              {s.chosenIndex != null && (
                <p className="mb-4 rounded-lg bg-cinema-surface2 p-3 text-sm text-cinema-sub">📌 {s.loglineOptions[s.chosenIndex].logline}</p>
              )}
              <div className="mb-2 flex flex-wrap gap-1.5">
                {DEEPEN_AXES.map((a) => (
                  <button key={a.key} type="button"
                    className="rounded-full border border-cinema-line px-3 py-1 text-xs text-cinema-sub transition-colors hover:border-cinema-amber hover:text-cinema-amber"
                    onClick={() => patch({ deepenNote: s.deepenNote + a.prompt })}>
                    {a.label}
                  </button>
                ))}
              </div>
              <textarea className="input min-h-[160px] text-sm leading-7" value={s.deepenNote}
                onChange={(e) => patch({ deepenNote: e.target.value })}
                placeholder="위 버튼을 눌러 질문 틀을 받아도 되고, 그냥 떠올라오는 대로 적어도 됩니다. 건너뛰어도 돼요." />
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-bold text-cinema-amber">후크 — 나만의 차별점 ★ (AI가 채우지 않는 유일한 칸)</span>
                <textarea className="input min-h-[64px] border-cinema-amber/40 text-sm" value={s.hookNote}
                  onChange={(e) => patch({ hookNote: e.target.value })}
                  placeholder="천 명이 같은 도구로 써도, 이건 나만 쓸 수 있다 — 그 비틀기." />
              </label>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={runGenerate} disabled={!!loading} className="btn-amber disabled:opacity-50">
                  {loading ? "지도를 그리는 중… 🗺️" : "🗺️ 이야기 지도 만들기"}
                </button>
                <button onClick={() => goTo(3)} className="btn-ghost">← 다른 이야기 고르기</button>
              </div>
            </section>
          )}

          {/* 단계 5 — 이야기 지도 (24블록 결과) */}
          {s.stage === 5 && (
            <div className="space-y-5">
              {result?.story ? (
                <>
                  <Results data={result} posterUrl={posterOf(result.story.title || "")} onOpenStudio={() => router.push("/studio")} />
                  <section className="card flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <h3 className="text-base font-bold">이 이야기를 스토리툰으로 만들어 보실래요? 🎨</h3>
                      <p className="text-xs text-cinema-dim">완성된 이야기 지도를 장면과 컷으로 나눠 웹툰형으로 펼칩니다.</p>
                    </div>
                    <button className="btn-ghost cursor-not-allowed opacity-60" title="준비 중입니다">곧 열려요 — 준비 중</button>
                  </section>
                </>
              ) : (
                <section className="card p-8 text-center text-cinema-sub">
                  <p>이야기 지도가 아직 없어요.</p>
                  <button onClick={() => goTo(4)} className="btn-amber mt-3">← 돌아가서 만들기</button>
                </section>
              )}
            </div>
          )}

          {loading && <div className="card p-6 text-center text-sm text-cinema-sub">{loading} ⏳</div>}
          {error && <p className="text-sm text-[#e2604c]">{error}</p>}
        </div>

        {/* ── 우측 내비게이터 (회의 확정: 현재 위치 상시 표시 + 자유 이동) ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-1.5">
            {STAGE_NAMES.map((name, i) => {
              const n = (i + 1) as CreationSession["stage"];
              const done = n < s.stage;
              const cur = n === s.stage;
              return (
                <button key={name} onClick={() => goTo(n)} disabled={n > s.stage}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    cur ? "bg-cinema-amber font-bold text-[#412402]"
                    : done ? "bg-cinema-surface2 text-cinema-text hover:text-cinema-amber"
                    : "text-cinema-dim"
                  }`}>
                  {done ? "✓ " : `${n}. `}{name}
                </button>
              );
            })}
            <button onClick={resetAll} className="mt-3 block w-full rounded-lg px-3 py-2 text-left text-xs text-cinema-dim transition-colors hover:text-[#e2604c]">
              ↺ 처음부터
            </button>
          </div>
        </aside>
      </div>

      <footer className="mt-10 border-t border-cinema-line pt-4 text-[11px] text-cinema-dim">
        4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120) · This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </main>
  );
}
