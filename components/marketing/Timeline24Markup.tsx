import {
  ANCHOR_CELLS,
  ANTAGONIST_CELLS,
  BSTORY_CELLS,
  CELL_NUMBERS,
} from "@/components/marketing/constants";
import { type Dictionary, t } from "@/lib/i18n";
import type { CSSProperties, RefObject } from "react";

type Timeline24MarkupProps = {
  readonly dictionary: Dictionary;
  readonly filledCount: number;
  readonly staticMode: boolean;
  readonly rootRef?: RefObject<HTMLDivElement>;
};

const ACT_NUMBERS = [1, 2, 3, 4] as const;

function hasCell(cells: readonly number[], cell: number): boolean {
  return cells.includes(cell);
}

function markerFor(cell: number): "antagonist" | "bstory" | undefined {
  if (hasCell(ANTAGONIST_CELLS, cell)) return "antagonist";
  if (hasCell(BSTORY_CELLS, cell)) return "bstory";
  return undefined;
}

export function Timeline24Markup({
  dictionary,
  filledCount,
  rootRef,
  staticMode,
}: Timeline24MarkupProps) {
  const progressStyle: CSSProperties = {
    transform: `scaleX(${staticMode ? 1 : filledCount / CELL_NUMBERS.length})`,
  };

  return (
    <div className="mk-timeline-wrap" ref={rootRef}>
      <div className="mk-film-scroll" data-timeline="24">
        <div className="mk-film-strip">
          <div className="mk-sprocket-row" aria-hidden="true">
            {CELL_NUMBERS.map((cell) => <span key={cell} className="mk-sprocket-hole" />)}
          </div>
          <div className="mk-timeline-progress-track" aria-hidden="true">
            <span className="mk-timeline-progress" style={progressStyle} />
          </div>
          <ol className="mk-timeline-grid" aria-label={t(dictionary, "structure.h")}>
            {CELL_NUMBERS.map((cell) => {
              const anchor = hasCell(ANCHOR_CELLS, cell);
              const bStory = hasCell(BSTORY_CELLS, cell);
              const filled = staticMode || cell <= filledCount;

              return (
                <li
                  key={cell}
                  data-timeline-cell={cell}
                  data-filled={filled ? "true" : "false"}
                  data-anchor={anchor ? "true" : "false"}
                  data-marker={markerFor(cell)}
                  className="mk-timeline-cell"
                >
                  <span className="mk-timeline-fill" aria-hidden="true" />
                  <span className="mk-timeline-number">{String(cell).padStart(2, "0")}</span>
                  {bStory ? <span className="mk-bstory-chip" aria-label="B-story">B</span> : null}
                </li>
              );
            })}
          </ol>
          <div className="mk-timeline-callouts" aria-label={t(dictionary, "structure.h")}>
            {ANCHOR_CELLS.map((cell) => (
              <p key={cell} data-callout={cell} className={`mk-timeline-callout mk-timeline-callout--${cell}`}>
                {t(dictionary, `structure.callouts.${cell}`)}
              </p>
            ))}
          </div>
          <div className="mk-act-brackets" aria-hidden="true">
            {ACT_NUMBERS.map((act) => (
              <span key={act} className={`mk-act-bracket mk-act-bracket--${act}`}>
                {t(dictionary, `structure.acts.${act}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
