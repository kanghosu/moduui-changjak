import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/utils";

export interface DraftBlockProps {
  readonly userText: string;
  readonly suggestionText: string;
  readonly onPartialImport?: () => void;
  readonly className?: string;
}

export function DraftBlock({ userText, suggestionText, onPartialImport, className }: DraftBlockProps) {
  return (
    <article className={cx("grid gap-ds-3 rounded-ds-lg border border-border bg-surface p-ds-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-ds-2">
        <div>
          <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">문장 작업대</p>
          <h2 className="mt-ds-1 text-ds-h3 font-bold text-text">내 문장과 제안을 나란히 보기</h2>
        </div>
        <span className="text-ds-label text-muted">원문은 그대로 남아요</span>
      </div>
      <div className="grid gap-ds-3 lg:grid-cols-2">
        <section className="grid content-start gap-ds-2 rounded-ds-md border border-border bg-canvas p-ds-3" aria-labelledby="draft-user-label">
          <p id="draft-user-label" className="text-ds-label font-semibold text-text">내가 쓴 문장</p>
          <p className="text-ds-body-sm leading-relaxed text-text">{userText}</p>
        </section>
        <section className="grid content-start gap-ds-2 rounded-ds-md border border-secondary/30 bg-secondary/10 p-ds-3" aria-labelledby="draft-ai-label">
          <p id="draft-ai-label" className="text-ds-label font-semibold text-secondary">AI 제안</p>
          <p className="text-ds-body-sm leading-relaxed text-text">{suggestionText}</p>
          <Button variant="ghost" className="justify-self-start" onClick={onPartialImport} disabled={!onPartialImport}>
            일부 가져오기
          </Button>
        </section>
      </div>
    </article>
  );
}
