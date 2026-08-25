"use client";

import { cx } from "@/components/ui/utils";

export type ProgressStepStatus = "complete" | "current" | "upcoming";

export interface ProgressStep {
  readonly id: string;
  readonly title: string;
  readonly output: string;
  readonly nextAction: string;
  readonly status: ProgressStepStatus;
}

export interface ProgressNavigatorProps {
  readonly steps: readonly ProgressStep[];
  readonly onStepChange?: (stepId: string) => void;
  readonly className?: string;
}

const markerClasses: Record<ProgressStepStatus, string> = {
  complete: "border-success bg-success text-elevated",
  current: "border-accent bg-accent text-accent-foreground",
  upcoming: "border-border bg-surface text-muted",
};

export function ProgressNavigator({ steps, onStepChange, className }: ProgressNavigatorProps) {
  return (
    <nav aria-label="창작 진행 단계" className={cx("rounded-ds-lg border border-border bg-surface p-ds-4", className)}>
      <div className="mb-ds-4 flex items-center justify-between gap-ds-3">
        <div>
          <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">내 작업 흐름</p>
          <h2 className="mt-ds-1 text-ds-h3 font-bold text-text">만든 것을 보며 이어쓰기</h2>
        </div>
        <span className="text-ds-label text-muted">{steps.length}단계</span>
      </div>
      <ol className="grid gap-ds-2">
        {steps.map((step, index) => {
          const interactive = step.status !== "upcoming";
          const output = step.status === "upcoming" ? "아직 비어 있음" : step.output;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!interactive}
                aria-current={step.status === "current" ? "step" : undefined}
                onClick={() => {
                  if (interactive) onStepChange?.(step.id);
                }}
                className={cx(
                  "grid w-full grid-cols-[2rem_1fr] gap-ds-3 rounded-ds-md p-ds-2 text-left transition-[background-color,transform] duration-micro focus-visible:ring-2 focus-visible:ring-accent/30",
                  interactive ? "hover:bg-elevated active:translate-y-px" : "cursor-not-allowed opacity-75",
                )}
              >
                <span className={cx("flex h-ds-8 w-ds-8 items-center justify-center rounded-ds-full border text-ds-label font-bold", markerClasses[step.status])} aria-hidden="true">
                  {step.status === "complete" ? "✓" : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-ds-2">
                    <span className={cx("text-ds-body-sm font-semibold", step.status === "current" ? "text-accent" : "text-text")}>
                      {step.title}
                    </span>
                    {step.status === "current" ? <span className="text-ds-label text-accent">지금 여기</span> : null}
                  </span>
                  <span className="mt-ds-1 block text-ds-label text-muted">{output}</span>
                  <span className="mt-ds-1 block text-ds-label text-text">다음: {step.nextAction}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
