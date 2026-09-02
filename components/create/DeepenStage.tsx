"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Textarea } from "@/components/ui/Textarea";

const DEEPEN_AXES = [
  { key: "character", label: "인물 깊게", prompt: "\n[인물] 주인공이 가장 두려워하는 것, 숨기고 있는 것: " },
  { key: "event", label: "사건 깊게", prompt: "\n[사건] 이 이야기에서 꼭 벌어져야 하는 장면: " },
  { key: "plot", label: "흐름 깊게", prompt: "\n[흐름] 이야기 한가운데에서 뒤집히는 것: " },
  { key: "research", label: "자료·취재", prompt: "\n[취재] 더 알아보고 싶은 것, 실제로 아는 것: " },
] as const;

export interface DeepenStageProps {
  readonly chosenLogline: string;
  readonly deepenNote: string;
  readonly hookNote: string;
  readonly loading: boolean;
  readonly onDeepenNoteChange: (value: string) => void;
  readonly onHookNoteChange: (value: string) => void;
  readonly onGenerate: () => void;
  readonly onBack: () => void;
}

export function DeepenStage({
  chosenLogline,
  deepenNote,
  hookNote,
  loading,
  onBack,
  onDeepenNoteChange,
  onGenerate,
  onHookNoteChange,
}: DeepenStageProps) {
  return (
    <Card tone="surface" className="grid gap-ds-5 p-ds-6">
      <div>
        <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">04 · 깊게 만들기</p>
        <h2 className="mt-ds-1 text-ds-h2 font-bold text-text">조금만 더 깊게 들어가 볼까요?</h2>
        <p className="mt-ds-2 text-ds-body-sm leading-relaxed text-muted">비어 있는 곳을 채우거나, 이미 떠오른 문장을 더 믿어도 좋아요.</p>
      </div>

      {chosenLogline ? (
        <Card tone="elevated" className="grid gap-ds-2">
          <Chip variant="accent">내가 고른 방향</Chip>
          <p className="text-ds-body-sm font-semibold leading-relaxed text-text">{chosenLogline}</p>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-ds-2">
        {DEEPEN_AXES.map((axis) => (
          <Button
            key={axis.key}
            type="button"
            variant="ghost"
            className="min-h-0 rounded-ds-full px-ds-3 py-ds-2 text-ds-label"
            onClick={() => onDeepenNoteChange(deepenNote + axis.prompt)}
          >
            {axis.label}
          </Button>
        ))}
      </div>

      <Textarea
        label="심화 메모"
        hint="위 버튼으로 질문 틀을 받아도 되고, 그냥 떠오르는 대로 적어도 됩니다."
        rows={7}
        value={deepenNote}
        onChange={(event) => onDeepenNoteChange(event.currentTarget.value)}
        placeholder="건너뛰어도 괜찮아요. 지금 떠오르는 한 문장만 남겨도 됩니다."
      />

      <Textarea
        label="후크 · 나만의 차별점"
        hint="AI가 대신 채우지 않는, 창작자만의 한 칸입니다."
        rows={3}
        value={hookNote}
        onChange={(event) => onHookNoteChange(event.currentTarget.value)}
        placeholder="천 명이 같은 도구로 써도, 이건 나만 쓸 수 있다 — 그 비틀기."
      />

      <div className="flex flex-wrap items-center gap-ds-3">
        <Button type="button" loading={loading} onClick={onGenerate}>
          이야기 지도 만들기
        </Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          다른 이야기 고르기
        </Button>
      </div>
    </Card>
  );
}
