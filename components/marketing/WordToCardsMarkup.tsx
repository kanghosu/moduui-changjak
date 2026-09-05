import { WORD_NUMBERS } from "@/components/marketing/constants";
import { type Dictionary, t } from "@/lib/i18n";
import type { CSSProperties, RefObject } from "react";

type WordToCardsMarkupProps = {
  readonly dictionary: Dictionary;
  readonly rootRef?: RefObject<HTMLDivElement>;
  readonly staticMode: boolean;
};

const CARD_TYPES = ["character", "scene", "emotion"] as const;

export function WordToCardsMarkup({ dictionary, rootRef, staticMode }: WordToCardsMarkupProps) {
  const words = WORD_NUMBERS.map((number) => t(dictionary, `turn.words.${number}`));
  const cardTitles = [words[0], words[2], words[3]];

  return (
    <div className="mk-word-card-stage" data-static={staticMode ? "true" : "false"} ref={rootRef}>
      <div className="mk-word-layer">
        {words.map((word, index) => {
          const targetX = 350 + index * 18;
          const targetY = 82 + index * 42;
          const wordStyle: CSSProperties = {
            opacity: staticMode ? 0 : 1,
            transform: staticMode
              ? `translate(${targetX}px, ${targetY}px)`
              : `translate(0px, ${index * 64}px) rotate(${index % 2 === 0 ? -3 : 3}deg)`,
          };

          return (
            <span
              key={word}
              className="mk-word-chip"
              data-word-index={index + 1}
              aria-hidden="true"
              style={wordStyle}
            >
              {word}
            </span>
          );
        })}
      </div>
      <div className="mk-story-card-stage" aria-label={t(dictionary, "turn.h")}>
        {CARD_TYPES.map((typeKey, index) => {
          const cardStyle: CSSProperties = staticMode
            ? {
                opacity: 1,
                transform: `translateY(${index * 38}px)`,
                backgroundColor: "var(--mk-paper-card)",
                borderColor: "var(--mk-paper-line)",
                color: "var(--mk-paper-text)",
              }
            : {
                opacity: 0.08,
                transform: "translateY(22px) scale(0.92)",
              };

          return (
            <article
              key={typeKey}
              className="mk-story-card"
              data-card-position={staticMode ? "final" : "moving"}
              style={cardStyle}
            >
              <span>{t(dictionary, `turn.cards.${typeKey}`)}</span>
              <strong>{cardTitles[index] ?? ""}</strong>
            </article>
          );
        })}
      </div>
    </div>
  );
}
