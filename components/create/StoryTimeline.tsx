"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, type ChipVariant } from "@/components/ui/Chip";
import { cx } from "@/components/ui/utils";
import type { Act, Block, Character, Story } from "@/engine/schema";

const ACT_LABELS: Record<Act, string> = {
  1: "1막 · 설정과 도입",
  2: "2막 · 즉자적 욕망",
  3: "3막 · 대자적 욕망",
  4: "4막 · 결사항전",
};

const ACT_GRID_START: Record<Act, number> = {
  1: 1,
  2: 7,
  3: 13,
  4: 19,
};

const ROLE_LABELS: Record<Character["role"], string> = {
  protagonist: "주인공",
  antagonist: "적대자",
  ally: "조력자",
  supporting: "조연",
};

const ROLE_DOT_CLASSES: Record<Character["role"], string> = {
  protagonist: "bg-accent",
  antagonist: "bg-danger",
  ally: "bg-secondary",
  supporting: "bg-muted",
};

type BlockAnchor = {
  readonly label: string;
  readonly variant: ChipVariant;
};

function anchorFor(block: Block): BlockAnchor | null {
  if (block.index === 13 || block.isReversal) return { label: "반전점", variant: "accent" };
  if ([9, 14, 18].includes(block.index) || block.antagonistEscalation) {
    return { label: "적대자 상승", variant: "danger" };
  }
  if ([8, 15, 22].includes(block.index) || block.bStory) return { label: "B스토리", variant: "success" };
  return null;
}

function blockContent(block: Block): string {
  return block.summary || block.beat || "아직 사건이 비어 있습니다.";
}

function timelineBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export interface StoryTimelineProps {
  readonly story: Story;
}

export function StoryTimeline({ story }: StoryTimelineProps) {
  const initialIndex = story.reversalPointIndex > 0 ? story.reversalPointIndex : 13;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const selectedBlock = story.blocks.find((block) => block.index === selectedIndex);
  const timelineColumns = [
    "minmax(6.5rem, 7rem)",
    ...story.blocks.map((block) => (block.index === selectedIndex ? "minmax(13rem, 2.4fr)" : "minmax(5.5rem, 1fr)")),
  ].join(" ");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const timeline = timelineRef.current;
      const target = blockRefs.current[selectedIndex];
      if (!timeline || !target) return;

      const timelineRect = timeline.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextScrollLeft = timeline.scrollLeft
        + targetRect.left
        - timelineRect.left
        - (timeline.clientWidth - targetRect.width) / 2;

      timeline.scrollTo({
        left: Math.max(0, nextScrollLeft),
        behavior: timelineBehavior(),
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedIndex]);

  function selectBlock(index: number) {
    setSelectedIndex(index);
    window.requestAnimationFrame(() => {
      blockRefs.current[index]?.scrollIntoView({ behavior: timelineBehavior(), block: "nearest", inline: "center" });
    });
  }

  return (
    <Card tone="elevated" className="grid gap-ds-5 p-ds-5">
      <div className="flex flex-wrap items-start justify-between gap-ds-4">
        <div>
          <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">05 · 이야기 지도</p>
          <h2 className="mt-ds-1 text-ds-h2 font-bold text-text">{story.title || "내 이야기의 지도"}</h2>
          <p className="mt-ds-2 max-w-3xl text-ds-body-sm leading-relaxed text-muted">{story.fourActLogline || story.logline}</p>
        </div>
        <Chip variant="accent">현재 {selectedIndex}번을 보고 있어요</Chip>
      </div>

      <div className="flex flex-wrap items-center gap-ds-2">
        <Chip variant="accent">반전점 · 13</Chip>
        <Chip variant="danger">적대자 상승 · 9 · 14 · 18</Chip>
        <Chip variant="success">B스토리 · 8 · 15 · 22</Chip>
        <span className="text-ds-label text-muted">가로는 진행, 세로는 인물선입니다. 옆으로 밀어 전체 지도를 살펴보세요.</span>
      </div>

      <div ref={timelineRef} className="overflow-x-auto rounded-ds-md border border-border" aria-label="24블록 이야기 타임라인">
        <div className="min-w-max bg-border">
          <div className="grid gap-px" style={{ gridTemplateColumns: timelineColumns }}>
            <div className="bg-surface p-ds-3 text-ds-label font-semibold text-muted">막</div>
            {([1, 2, 3, 4] as const).map((act) => (
              <div
                key={act}
                className="bg-canvas px-ds-3 py-ds-2 text-ds-label font-semibold text-text"
                style={{ gridColumn: ACT_GRID_START[act] + 1 + " / span 6" }}
              >
                {ACT_LABELS[act]}
              </div>
            ))}
          </div>

          <div className="grid gap-px" style={{ gridTemplateColumns: timelineColumns }}>
            <div className="sticky left-0 z-10 bg-surface p-ds-3 text-ds-label font-semibold text-muted">진행</div>
            {story.blocks.map((block) => {
              const anchor = anchorFor(block);
              return (
                <div key={block.index} className="flex min-h-ds-12 flex-col items-center justify-center gap-ds-1 bg-surface px-ds-1 py-ds-2">
                  <span className="text-ds-label font-semibold text-text">{block.index}</span>
                  {anchor ? <Chip variant={anchor.variant} className="max-w-full truncate">{anchor.label}</Chip> : null}
                </div>
              );
            })}
          </div>

          {story.characters.map((character) => (
            <div key={character.id} className="grid gap-px" style={{ gridTemplateColumns: timelineColumns }}>
              <div className="sticky left-0 z-10 grid gap-ds-1 bg-surface p-ds-3">
                <span className="truncate text-ds-label font-semibold text-text">{character.name}</span>
                <span className="text-ds-label text-muted">{ROLE_LABELS[character.role]}</span>
              </div>
              {story.blocks.map((block) => {
                const appears = block.characters?.includes(character.id) ?? false;
                return (
                  <div key={block.index} className="flex min-h-ds-12 items-center justify-center bg-surface">
                    <span
                      aria-label={appears ? character.name + " 등장" : character.name + " 미등장"}
                      className={cx("h-ds-3 w-ds-3 rounded-ds-full", appears ? ROLE_DOT_CLASSES[character.role] : "bg-border")}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          <div className="grid gap-px" style={{ gridTemplateColumns: timelineColumns }}>
            <div className="sticky left-0 z-10 bg-surface p-ds-3 text-ds-label font-semibold text-muted">장면</div>
            {story.blocks.map((block) => {
              const anchor = anchorFor(block);
              const expanded = Math.abs(block.index - selectedIndex) <= 2;
              return (
                <div key={block.index} className="min-h-ds-16 bg-surface p-ds-1">
                  <Button
                    ref={(node) => {
                      blockRefs.current[block.index] = node;
                    }}
                    type="button"
                    variant="ghost"
                    aria-pressed={block.index === selectedIndex}
                    aria-expanded={expanded}
                    aria-label={"블록 " + block.index + " 상세 보기"}
                    className={cx(
                      "h-full w-full min-w-0 items-start justify-start gap-ds-2 overflow-hidden rounded-ds-sm p-ds-2 text-left",
                      block.index === selectedIndex ? "border-accent bg-accent/10" : "border-border hover:border-accent/60 hover:bg-elevated",
                    )}
                    onClick={() => selectBlock(block.index)}
                  >
                    <span className="flex w-full min-w-0 flex-col gap-ds-2">
                      <span className="flex min-w-0 flex-wrap items-center gap-ds-1">
                        <span className="text-ds-label font-bold text-text">{block.index}</span>
                        {anchor ? <Chip variant={anchor.variant} className="max-w-full truncate">{anchor.label}</Chip> : null}
                      </span>
                      <span className={cx("text-ds-label font-semibold leading-relaxed text-text", expanded ? null : "line-clamp-2")}>
                        {block.subtitle || block.function}
                      </span>
                      {expanded ? <span className="text-ds-label leading-relaxed text-muted">{blockContent(block)}</span> : null}
                    </span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedBlock ? (
        <Card tone="surface" className="grid gap-ds-3">
          <div className="flex flex-wrap items-center gap-ds-2">
            <Chip variant="accent">지금 보고 있는 자리</Chip>
            <span className="text-ds-label text-muted">{selectedBlock.index}번 · {ACT_LABELS[selectedBlock.act]}</span>
            {anchorFor(selectedBlock) ? <Chip variant={anchorFor(selectedBlock)?.variant}>{anchorFor(selectedBlock)?.label}</Chip> : null}
          </div>
          <h3 className="text-ds-h3 font-bold text-text">{selectedBlock.subtitle || selectedBlock.function}</h3>
          <p className="whitespace-pre-wrap text-ds-body-sm leading-relaxed text-muted">{blockContent(selectedBlock)}</p>
          {selectedBlock.desireShift ? (
            <p className="border-t border-border pt-ds-3 text-ds-label text-secondary">
              욕망선: {selectedBlock.desireShift.fromState} → {selectedBlock.desireShift.toState}
            </p>
          ) : null}
          {selectedBlock.blockTakeaway ? (
            <p className="rounded-ds-sm bg-accent/10 p-ds-3 text-ds-label leading-relaxed text-accent">{selectedBlock.blockTakeaway}</p>
          ) : null}
        </Card>
      ) : null}

      <p className="text-ds-label text-muted">블록을 누르면 상세가 열리고, 선택한 자리 주변만 카드 안에서 먼저 펼쳐집니다.</p>
    </Card>
  );
}
