"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { cx } from "@/components/ui/utils";

export interface ChoiceOption {
  readonly id: string;
  readonly title: string;
  readonly logline: string;
  readonly discarded?: boolean;
}

export interface ChoiceCardProps {
  readonly options: readonly ChoiceOption[];
  readonly selectedId?: string;
  readonly onSelect: (id: string) => void;
  readonly className?: string;
}

export function ChoiceCard({ options, selectedId, onSelect, className }: ChoiceCardProps) {
  const [showDiscarded, setShowDiscarded] = useState(false);
  const activeOptions = options.filter((option) => !option.discarded);
  const discardedOptions = options.filter((option) => option.discarded);

  return (
    <section className={cx("grid gap-ds-3", className)} aria-label="로그라인 선택지">
      <div>
        <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">내 방향 고르기</p>
        <h2 className="mt-ds-1 text-ds-h3 font-bold text-text">로그라인 3안</h2>
      </div>
      <div className="grid gap-ds-2">
        {activeOptions.map((option) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(option.id)}
              className={cx(
                "grid gap-ds-2 rounded-ds-md border p-ds-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-micro focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-px",
                selected ? "border-accent bg-accent/10 shadow-ds-card" : "border-border bg-surface hover:border-accent/60 hover:bg-elevated",
              )}
            >
              <span className="flex items-center justify-between gap-ds-2">
                <span className="text-ds-body-sm font-bold text-text">{option.title}</span>
                {selected ? <Chip variant="accent">내 선택</Chip> : <span className="text-ds-label text-muted">선택하기</span>}
              </span>
              <span className="text-ds-body-sm leading-relaxed text-muted">{option.logline}</span>
            </button>
          );
        })}
      </div>
      {discardedOptions.length > 0 ? (
        <div className="rounded-ds-md border border-border bg-surface">
          <button
            type="button"
            aria-expanded={showDiscarded}
            onClick={() => setShowDiscarded((open) => !open)}
            className="flex w-full items-center justify-between gap-ds-3 px-ds-4 py-ds-3 text-left text-ds-body-sm font-semibold text-muted hover:text-text"
          >
            <span>보관한 다른 안 {discardedOptions.length}개</span>
            <span aria-hidden="true">{showDiscarded ? "−" : "+"}</span>
          </button>
          {showDiscarded ? (
            <div className="grid gap-ds-2 border-t border-border p-ds-3">
              {discardedOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={option.id === selectedId}
                  onClick={() => onSelect(option.id)}
                  className="grid gap-ds-1 rounded-ds-sm border border-border bg-canvas p-ds-3 text-left transition-[background-color,border-color] duration-micro hover:border-accent hover:bg-elevated focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  <span className="text-ds-label font-semibold text-text">{option.title}</span>
                  <span className="text-ds-label leading-relaxed text-muted">{option.logline}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
