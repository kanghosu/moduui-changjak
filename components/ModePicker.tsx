"use client";

import { cx } from "@/components/ui/utils";

export type CreationMode = "scene-first" | "question-first";

export interface ModePickerProps {
  readonly value: CreationMode;
  readonly onChange: (mode: CreationMode) => void;
  readonly className?: string;
}

const MODES: readonly {
  readonly id: CreationMode;
  readonly title: string;
  readonly description: string;
  readonly prompt: string;
}[] = [
  {
    id: "scene-first",
    title: "장면 우선",
    description: "떠오른 장면과 대사부터 모아 이야기의 결을 찾습니다.",
    prompt: "장면 하나를 자유롭게 적어보세요",
  },
  {
    id: "question-first",
    title: "문답 우선",
    description: "짧은 질문에 답하며 주인공과 갈등을 차근차근 세웁니다.",
    prompt: "질문 하나씩 답해보세요",
  },
];

export function ModePicker({ value, onChange, className }: ModePickerProps) {
  return (
    <fieldset className={cx("grid gap-ds-3", className)}>
      <legend className="text-ds-body font-semibold text-text">어디서 시작할까요?</legend>
      <div className="grid gap-ds-3 sm:grid-cols-2">
        {MODES.map((mode) => {
          const selected = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(mode.id)}
              className={cx(
                "grid gap-ds-3 rounded-ds-md border p-ds-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-micro focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-px",
                selected ? "border-accent bg-accent/10 shadow-ds-card" : "border-border bg-surface hover:border-accent/60 hover:bg-elevated",
              )}
            >
              <span className="flex items-center justify-between gap-ds-2">
                <span className={cx("text-ds-h3 font-bold", selected ? "text-accent" : "text-text")}>{mode.title}</span>
                <span className={cx("rounded-ds-full px-ds-2 py-ds-1 text-ds-label font-semibold", selected ? "bg-accent text-accent-foreground" : "bg-surface text-muted")}>
                  {selected ? "선택됨" : "선택"}
                </span>
              </span>
              <span className="text-ds-body-sm leading-relaxed text-muted">{mode.description}</span>
              <span className="border-t border-border pt-ds-3 text-ds-label text-text">첫 행동: {mode.prompt}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
