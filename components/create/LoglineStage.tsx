"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { cx } from "@/components/ui/utils";
import type { LoglineOption } from "@/engine/creation";

export interface LoglineStageProps {
  readonly options: readonly LoglineOption[];
  readonly history: readonly (readonly LoglineOption[])[];
  readonly chosenIndex: number | null;
  readonly loading: boolean;
  readonly posterOf: (title: string) => string | null;
  readonly onSelect: (index: number) => void;
  readonly onContinue: () => void;
  readonly onRegenerate: () => void;
  readonly onRestorePrevious: () => void;
  readonly onBack: () => void;
}

export function LoglineStage({
  chosenIndex,
  history,
  loading,
  onBack,
  onContinue,
  onRegenerate,
  onRestorePrevious,
  onSelect,
  options,
  posterOf,
}: LoglineStageProps) {
  return (
    <Card tone="surface" className="grid gap-ds-5 p-ds-6">
      <div>
        <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">03 · 이야기 고르기</p>
        <h2 className="mt-ds-1 text-ds-h2 font-bold text-text">어떤 이야기가 당신의 것인가요?</h2>
        <p className="mt-ds-2 text-ds-body-sm leading-relaxed text-muted">
          같은 아이디어도 세 방향으로 자랄 수 있어요. 마음에 닿는 것을 고르면 나중에 얼마든지 고칠 수 있습니다.
        </p>
      </div>

      {options.length > 0 ? (
        <div className="grid gap-ds-3">
          {options.map((option, index) => {
            const selected = chosenIndex === index;
            const poster = posterOf(option.benchmarkTitle);
            return (
              <Button
                key={index}
                type="button"
                variant="ghost"
                aria-pressed={selected}
                className={cx(
                  "h-auto w-full items-stretch justify-start gap-ds-4 rounded-ds-lg p-ds-4 text-left",
                  selected ? "border-accent bg-accent/10 shadow-ds-card" : "border-border hover:border-accent/60 hover:bg-elevated",
                )}
                onClick={() => onSelect(index)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-ds-2">
                    <Chip variant={selected ? "accent" : "default"}>{option.direction}</Chip>
                    {selected ? <Chip variant="success">내 선택</Chip> : null}
                  </div>
                  <p className="mt-ds-3 text-ds-body font-semibold leading-relaxed text-text">{option.logline}</p>
                  <p className="mt-ds-2 text-ds-body-sm leading-relaxed text-muted">
                    참고 작품 <strong className="text-text">{option.benchmarkTitle}</strong> · {option.reason}
                  </p>
                </div>
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={poster}
                    alt={option.benchmarkTitle}
                    width={80}
                    height={112}
                    loading="lazy"
                    className="h-28 w-20 shrink-0 rounded-ds-sm border border-border object-cover"
                  />
                ) : null}
              </Button>
            );
          })}
        </div>
      ) : (
        <Card tone="elevated">
          <p className="text-ds-body-sm text-muted">아직 선택지가 없습니다. 이전 단계로 돌아가 재료를 확인해 주세요.</p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-ds-3">
        <Button type="button" onClick={onContinue}>
          이 이야기로 깊게 만들기
        </Button>
        <Button type="button" variant="ghost" loading={loading} onClick={onRegenerate}>
          다른 뼈대 보기
        </Button>
        {history.length > 0 ? (
          <Button type="button" variant="ghost" className="text-xs" onClick={onRestorePrevious}>
            이전 안 보기
          </Button>
        ) : null}
        <Button type="button" variant="quiet" onClick={onBack}>
          답 고치기
        </Button>
      </div>
    </Card>
  );
}
