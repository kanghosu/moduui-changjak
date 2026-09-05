"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useTransform } from "motion/react";
import { ANCHOR_CELLS, ANTAGONIST_CELLS, BSTORY_CELLS, CELL_NUMBERS } from "@/components/marketing/constants";
import { usePinProgress } from "@/components/marketing/PinSection";
import { type Dictionary, t } from "@/lib/i18n";

type Timeline24Props = {
  readonly dictionary: Dictionary;
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

export function Timeline24({ dictionary }: Timeline24Props) {
  const { progress, staticMode } = usePinProgress();
  const [filledCount, setFilledCount] = useState(staticMode ? 24 : 0);
  const progressScale = useTransform(progress, [0, 1], [0, 1]);

  useMotionValueEvent(progress, "change", (value) => {
    const nextCount = Math.min(24, Math.max(0, Math.ceil(value * 24)));
    setFilledCount((current) => (current === nextCount ? current : nextCount));
  });

  useEffect(() => {
    setFilledCount(staticMode ? 24 : Math.ceil(progress.get() * 24));
  }, [progress, staticMode]);

  return (
    <div className="mk-timeline-wrap">
      <div className="mk-film-scroll" data-timeline="24">
        <div className="mk-film-strip">
          <div className="mk-sprocket-row" aria-hidden="true">
            {CELL_NUMBERS.map((cell) => <span key={cell} className="mk-sprocket-hole" />)}
          </div>
          <div className="mk-timeline-progress-track" aria-hidden="true">
            <motion.span className="mk-timeline-progress" style={{ scaleX: staticMode ? 1 : progressScale }} />
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
                  <motion.span
                    className="mk-timeline-fill"
                    aria-hidden="true"
                    initial={false}
                    animate={{ scaleY: filled ? 1 : 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  />
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
