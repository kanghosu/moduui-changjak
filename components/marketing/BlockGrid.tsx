"use client";

import { CELL_NUMBERS } from "@/components/marketing/constants";
import { usePinProgress } from "@/components/marketing/PinSection";
import { type Dictionary, t } from "@/lib/i18n";

type BlockGridProps = {
  readonly dictionary: Dictionary;
};

export function BlockGrid({ dictionary }: BlockGridProps) {
  const { staticMode } = usePinProgress();

  return (
    <div className="mk-block-sheet" data-block-grid-static={staticMode ? "true" : "false"}>
      <ul className="mk-block-grid" aria-label={t(dictionary, "done.h")}>
        {CELL_NUMBERS.map((cell) => {
          const label = t(dictionary, `blocks.${cell}`);
          return (
            <li key={cell} data-block-cell={cell} className="mk-block-cell">
              <span className="mk-block-number">{String(cell).padStart(2, "0")}</span>
              <span className="mk-block-label">{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
