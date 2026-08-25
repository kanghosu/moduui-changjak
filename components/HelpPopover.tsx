import { Popover } from "@/components/ui/Popover";
import { cx } from "@/components/ui/utils";

export interface HelpPopoverProps {
  readonly term: string;
  readonly definition: string;
  readonly relatedStep?: string;
  readonly className?: string;
}

export function HelpPopover({ term, definition, relatedStep, className }: HelpPopoverProps) {
  return (
    <Popover
      label={`${term} 정의 보기`}
      className={cx("align-baseline", className)}
      trigger={
        <>
          <span>{term}</span>
          <span aria-hidden="true" className="text-ds-label no-underline">ⓘ</span>
        </>
      }
    >
      <div className="grid gap-ds-2">
        <p className="text-ds-body-sm font-bold text-text">{term}</p>
        <p className="leading-relaxed text-muted">{definition}</p>
        {relatedStep ? <p className="border-t border-border pt-ds-2 text-ds-label text-secondary">관련 단계: {relatedStep}</p> : null}
      </div>
    </Popover>
  );
}
