"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { Story } from "@/engine/schema";

export interface CompletionStageProps {
  readonly story: Story;
  readonly engine: string;
  readonly onOpenStudio: () => void;
  readonly onExport: () => void;
}

export function CompletionStage({ engine, onExport, onOpenStudio, story }: CompletionStageProps) {
  return (
    <Card tone="elevated" className="grid gap-ds-5 border-success/30 p-ds-6" aria-labelledby="completion-heading">
      <div className="flex flex-wrap items-start justify-between gap-ds-3">
        <div>
          <Chip variant="success">완료</Chip>
          <Chip variant="secondary" className="ml-ds-2">{engine === "mock" ? "구조 골격 mock" : "생성된 이야기 지도"}</Chip>
          <h2 id="completion-heading" className="mt-ds-2 text-ds-h2 font-bold text-text">이야기 지도가 완성됐어요</h2>
          <p className="mt-ds-2 max-w-2xl text-ds-body-sm leading-relaxed text-muted">
            이제 빈 페이지가 아니라, 다시 펼쳐 보고 고칠 수 있는 작품의 첫 지도가 생겼습니다.
          </p>
        </div>
        <div className="grid justify-items-end gap-ds-1 text-ds-label text-muted">
          <span>인물 {story.characters.length}명</span>
          <span>장면 {story.blocks.length}칸</span>
        </div>
      </div>

      <div className="grid gap-ds-3 rounded-ds-lg border border-border bg-surface p-ds-5">
        <div className="flex flex-wrap items-center gap-ds-2">
          <span className="text-ds-label font-semibold text-muted">내 작품</span>
          {story.genre ? <Chip variant="secondary">{story.genre}</Chip> : null}
          {story.tone ? <Chip>{story.tone}</Chip> : null}
        </div>
        <h3 className="text-ds-h3 font-bold text-text">{story.title || "제목 없는 이야기"}</h3>
        <p className="text-ds-body-sm leading-relaxed text-muted">{story.fourActLogline || story.logline}</p>
      </div>

      <div className="flex flex-wrap items-center gap-ds-3">
        <Button type="button" onClick={onOpenStudio}>작업실에서 이어가기</Button>
        <Button type="button" variant="ghost" onClick={onExport}>내보내기</Button>
      </div>
    </Card>
  );
}
