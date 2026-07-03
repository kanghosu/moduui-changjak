"use client";

import { useState } from "react";
import type { Character, Story, ValidationIssue } from "@/engine/schema";

export interface StageTrace { stage: "R1" | "R2" | "R3"; agent: string; title: string; detail: string }
export interface ApiResult {
  story?: Story; issues?: ValidationIssue[];
  engine: string; model?: string; mode?: string; trace?: StageTrace[];
  error?: string; needsKey?: boolean; message?: string;
}

export const norm = (s: string) => (s || "").toLowerCase().replace(/[\s<>:,·\[\]()「」'".\-]/g, "");

export const ACT_BG: Record<number, string> = { 1: "#4e8cd9", 2: "#8b6fd9", 3: "#d9608c", 4: "#d97a45" };
export const ACT_NAME: Record<number, string> = { 1: "1막 · 설정과 도입", 2: "2막 · 즉자적 욕망", 3: "3막 · 대자적 욕망", 4: "4막 · 결사항전" };
const POSTER_COLORS = ["#185FA5", "#534AB7", "#993556", "#0F6E56", "#993C1D", "#444441", "#72243E", "#0C447C"];

export function posterColor(title: string) {
  let h = 0; for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return POSTER_COLORS[h % POSTER_COLORS.length];
}

export function PosterCard({ title, url }: { title: string; url?: string | null }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken)
    return <img src={url} alt={title} onError={() => setBroken(true)} className="aspect-[2/3] w-full rounded-lg border border-cinema-line object-cover" loading="lazy" />;
  return (
    <div className="poster-fallback flex aspect-[2/3] w-full items-center justify-center rounded-lg" style={{ background: posterColor(title) }}>
      <span className="text-2xl font-semibold text-white/85">{title.replace(/[<>\s]/g, "").slice(0, 1)}</span>
    </div>
  );
}

export function Results({ data, posterUrl, backdropUrl, onStartVariation, onOpenStudio }: { data: ApiResult; posterUrl: string | null; backdropUrl?: string | null; onStartVariation?: () => void; onOpenStudio?: () => void }) {
  const story = data.story!;
  const issues = data.issues || [];
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const isBenchmark = data.mode === "benchmark";
  const engineLabel = data.engine === "library" ? "거장 확정 분석" : data.engine === "ai-library" ? "AI 분석 라이브러리" : data.engine === "anthropic" ? `AI 분석 (${data.model || ""})` : data.engine === "mock" ? "구조 골격 (mock)" : "결과";
  const byAct = [1, 2, 3, 4].map((a) => ({ act: a, blocks: story.blocks.filter((b) => b.act === a) }));

  return (
    <>
      {/* 히어로 (영화 백드롭) — 백드롭이 있으면 텍스트를 밝게 고정 */}
      <div className={`card relative overflow-hidden p-4 ${backdropUrl ? "backdrop-hero" : ""}`}>
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

      {story.directorNote && (
        <div className="card p-4">
          <h3 className="mb-1 text-sm font-semibold">🎥 감독의 기법 — 작가가 훔쳐올 것들</h3>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-cinema-sub">{story.directorNote}</p>
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

function BlockRow({ b }: { b: import("@/engine/schema").Block }) {
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
