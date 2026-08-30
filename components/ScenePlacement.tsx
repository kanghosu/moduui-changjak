"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipVariant } from "@/components/ui/Chip";

const SceneCandidateSchema = z.object({
  index: z.number().int().min(1).max(24),
  act: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  function: z.string().min(1),
  reason: z.string().min(1),
});

const BenchmarkSchema = z.object({
  title: z.string(),
  year: z.string(),
  genre: z.string(),
  reason: z.string(),
  matchedBlocks: z.array(z.number().int()),
});

const SceneResponseSchema = z.object({
  candidates: z.array(SceneCandidateSchema).min(3).max(4),
  benchmarks: z.array(BenchmarkSchema),
  engine: z.union([z.literal("anthropic"), z.literal("heuristic")]),
});

type SceneResponse = z.infer<typeof SceneResponseSchema>;
type SceneState =
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly data: SceneResponse }
  | { readonly kind: "error"; readonly message: string };

const ENGINE_LABELS = {
  anthropic: "AI 분석 기준",
  heuristic: "규칙 기반 추천",
} as const satisfies Record<SceneResponse["engine"], string>;

const ACT_LABELS: Record<SceneResponse["candidates"][number]["act"], string> = {
  1: "이야기 초반",
  2: "갈등이 자라는 구간",
  3: "전환 뒤의 압박",
  4: "마무리로 향하는 구간",
};

const CANDIDATE_VARIANTS: readonly ChipVariant[] = ["secondary", "accent", "success", "default"];

function softenSceneCopy(value: string) {
  return value
    .replaceAll("24블록", "이야기 흐름")
    .replaceAll("블록", "자리")
    .replaceAll("B-Story", "동맹선")
    .replaceAll("B스토리", "동맹선");
}

function apiError(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return "장면의 자리를 찾지 못했습니다.";
}

export function ScenePlacement({ sceneText }: { readonly sceneText: string }) {
  const [state, setState] = useState<SceneState>({ kind: "loading" });

  useEffect(() => {
    const trimmedScene = sceneText.trim();
    if (!trimmedScene) return undefined;

    const controller = new AbortController();
    setState({ kind: "loading" });

    fetch("/api/scene-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneText: trimmedScene }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(payload));
        const parsed = SceneResponseSchema.safeParse(payload);
        if (!parsed.success) throw new Error("장면 배치 응답 형식이 올바르지 않습니다.");
        setState({ kind: "loaded", data: parsed.data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : "알 수 없는 오류",
        });
      });

    return () => controller.abort();
  }, [sceneText]);

  return (
    <Card tone="elevated" className="grid gap-ds-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-ds-3">
        <div>
          <p className="text-ds-label font-semibold uppercase tracking-ds-label text-secondary">장면 배치 힌트</p>
          <h3 className="mt-ds-1 text-ds-h3 font-bold text-text">이 장면은 이런 자리에 들어갈 수 있어요</h3>
          <p className="mt-ds-1 text-ds-body-sm text-muted">원문은 그대로 두고, 어울리는 자리만 먼저 살펴봅니다.</p>
        </div>
        {state.kind === "loaded" ? <Chip variant="secondary">{ENGINE_LABELS[state.data.engine]}</Chip> : null}
      </div>

      {state.kind === "loading" ? (
        <p className="text-ds-body-sm text-muted">장면의 결을 살펴보는 중이에요…</p>
      ) : state.kind === "error" ? (
        <p className="text-ds-body-sm text-danger" role="alert">
          {state.message}
        </p>
      ) : (
        <>
          <div className="grid gap-ds-2 sm:grid-cols-2">
            {state.data.candidates.map((candidate, index) => (
              <article key={candidate.index} className="grid gap-ds-2 rounded-ds-md border border-border bg-surface p-ds-3">
                <div className="flex items-center justify-between gap-ds-2">
                  <Chip variant={CANDIDATE_VARIANTS[index] ?? "default"}>후보 자리 {index + 1}</Chip>
                  <span className="text-ds-label text-muted">{ACT_LABELS[candidate.act]}</span>
                </div>
                <p className="text-ds-body-sm font-semibold text-text">{softenSceneCopy(candidate.function)}</p>
                <p className="text-ds-label leading-relaxed text-muted">{softenSceneCopy(candidate.reason)}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-ds-2 border-t border-border pt-ds-4">
            <div>
              <p className="text-ds-body-sm font-semibold text-text">비슷한 결을 가진 참고 작품</p>
              <p className="mt-ds-1 text-ds-label text-muted">AI 분석 초안 라이브러리에서 장면의 흐름을 비교한 결과입니다. 블록 번호는 AI 라이브러리 기준이라 정본과 다를 수 있어요.</p>
            </div>
            {state.data.benchmarks.length > 0 ? (
              <div className="grid gap-ds-2 sm:grid-cols-2">
                {state.data.benchmarks.map((benchmark) => (
                  <article key={benchmark.title} className="rounded-ds-md border border-border bg-canvas p-ds-3">
                    <div className="flex flex-wrap items-center gap-ds-2">
                      <p className="text-ds-body-sm font-semibold text-text">{benchmark.title}</p>
                      {benchmark.year ? <Chip>{benchmark.year}</Chip> : null}
                      {benchmark.genre ? <Chip variant="secondary">{benchmark.genre}</Chip> : null}
                    </div>
                    <p className="mt-ds-2 text-ds-label leading-relaxed text-muted">{softenSceneCopy(benchmark.reason)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-ds-label text-muted">아직 비교할 수 있는 참고 작품이 없습니다.</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
