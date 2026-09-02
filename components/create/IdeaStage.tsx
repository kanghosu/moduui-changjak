"use client";

import VoiceInput from "@/components/VoiceInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Textarea } from "@/components/ui/Textarea";

const GUIDE_CHIPS = [
  "머릿속에 남은 장면 하나",
  "주인공은 어떤 사람",
  "다루고 싶은 사건",
  "원하는 결말의 기분",
  "떠올랐던 영화",
] as const;

export interface IdeaStageProps {
  readonly utterance: string;
  readonly loading: boolean;
  readonly onUtteranceChange: (value: string) => void;
  readonly onVoiceText: (text: string) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

export function IdeaStage({
  loading,
  onReset,
  onSubmit,
  onUtteranceChange,
  onVoiceText,
  utterance,
}: IdeaStageProps) {
  function addGuideChip(chip: string) {
    const nextValue = (utterance ? utterance.trimEnd() + "\n" : "") + chip + ": ";
    onUtteranceChange(nextValue);
  }

  return (
    <Card tone="surface" className="grid gap-ds-5 p-ds-6">
      <div>
        <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">01 · 쏟아내기</p>
        <h2 className="mt-ds-1 text-ds-h2 font-bold text-text">하고 싶은 이야기, 그냥 떠들어 주세요</h2>
        <p className="mt-ds-2 max-w-2xl text-ds-body-sm leading-relaxed text-muted">
          말해도 좋고 써도 좋아요. 순서도 문법도 필요 없습니다. <strong className="text-text">정리는 저희가 합니다.</strong>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-ds-2">
        <VoiceInput onFinalText={onVoiceText} />
        <Chip>{utterance.length.toLocaleString()}자 · 자동 저장</Chip>
      </div>

      <Textarea
        label="아이디어 노트"
        hint="한 장면, 인물, 감정, 떠오른 영화 중 하나만 적어도 충분해요."
        rows={12}
        value={utterance}
        onChange={(event) => onUtteranceChange(event.currentTarget.value)}
        placeholder={"예)\n꿈에서 본 장면이 하나 있는데, 너무 강렬해서 이걸로 뭔가 만들고 싶어요.\n유쾌하면서도 통쾌한 복수극이면 좋겠고… 주인공은 아직 잘 모르겠어요."}
      />

      <div className="flex flex-wrap items-center gap-ds-2">
        <span className="text-ds-label text-muted">막막하면 이런 것부터</span>
        {GUIDE_CHIPS.map((chip) => (
          <Button
            key={chip}
            type="button"
            variant="quiet"
            className="min-h-0 rounded-ds-full border border-border bg-surface px-ds-3 py-ds-1 text-ds-label"
            onClick={() => addGuideChip(chip)}
          >
            {chip}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-ds-3">
        <Button type="button" loading={loading} onClick={onSubmit}>
          {loading ? "이야기를 듣는 중…" : "이야기 정리 시작"}
        </Button>
        {utterance ? (
          <Button type="button" variant="ghost" onClick={onReset}>
            전부 지우기
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
