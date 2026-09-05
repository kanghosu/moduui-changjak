"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { WORD_NUMBERS } from "@/components/marketing/constants";
import { usePinProgress } from "@/components/marketing/PinSection";
import { type Dictionary, t } from "@/lib/i18n";

type WordToCardsProps = {
  readonly dictionary: Dictionary;
};

type MovingWordProps = {
  readonly index: number;
  readonly word: string;
  readonly progress: MotionValue<number>;
  readonly staticMode: boolean;
};

type StoryCardProps = {
  readonly dictionary: Dictionary;
  readonly index: number;
  readonly progress: MotionValue<number>;
  readonly staticMode: boolean;
  readonly backgroundColor: MotionValue<string>;
  readonly borderColor: MotionValue<string>;
  readonly textColor: MotionValue<string>;
  readonly title: string;
  readonly typeKey: "character" | "scene" | "emotion";
};

const CARD_TYPES = ["character", "scene", "emotion"] as const;

function MovingWord({ index, word, progress, staticMode }: MovingWordProps) {
  const targetX = 350 + index * 18;
  const targetY = 82 + index * 42;
  const x = useTransform(progress, [0, 1], [0, targetX]);
  const y = useTransform(progress, [0, 1], [index * 64, targetY]);
  const opacity = useTransform(progress, [0, 0.66, 1], [1, 0.86, 0]);
  const rotate = useTransform(progress, [0, 1], [index % 2 === 0 ? -3 : 3, 0]);

  return (
    <motion.span
      className="mk-word-chip"
      data-word-index={index + 1}
      aria-hidden="true"
      style={{
        x: staticMode ? targetX : x,
        y: staticMode ? targetY : y,
        opacity: staticMode ? 0 : opacity,
        rotate: staticMode ? 0 : rotate,
      }}
    >
      {word}
    </motion.span>
  );
}

function StoryCard({
  backgroundColor,
  borderColor,
  dictionary,
  index,
  progress,
  staticMode,
  textColor,
  title,
  typeKey,
}: StoryCardProps) {
  const opacity = useTransform(progress, [0, 1], [0.08, 1]);
  const scale = useTransform(progress, [0, 0.6, 1], [0.92, 0.98, 1]);
  const y = useTransform(progress, [0, 1], [22, index * 38]);

  return (
    <motion.article
      className="mk-story-card"
      data-card-position={staticMode ? "final" : "moving"}
      style={{
        opacity: staticMode ? 1 : opacity,
        scale: staticMode ? 1 : scale,
        y: staticMode ? index * 38 : y,
        backgroundColor,
        borderColor,
        color: textColor,
      }}
    >
      <span>{t(dictionary, `turn.cards.${typeKey}`)}</span>
      <strong>{title}</strong>
    </motion.article>
  );
}

export function WordToCards({ dictionary }: WordToCardsProps) {
  const { progress, staticMode } = usePinProgress();
  const words = WORD_NUMBERS.map((number) => t(dictionary, `turn.words.${number}`));
  const cardTitles = [words[0], words[2], words[3]];
  const cardBackground = useTransform(progress, [0, 0.62, 1], ["rgba(255, 252, 248, 0.1)", "rgba(255, 252, 248, 0.12)", "rgba(255, 252, 248, 0.82)"]);
  const cardBorder = useTransform(progress, [0, 0.62, 1], ["rgba(237, 239, 243, 0.22)", "rgba(237, 239, 243, 0.28)", "#E5DED4"]);
  const cardText = useTransform(progress, [0, 0.62, 1], ["#EDEFF3", "#EDEFF3", "#242321"]);

  return (
    <div className="mk-word-card-stage" data-static={staticMode ? "true" : "false"}>
      <div className="mk-word-layer">
        {words.map((word, index) => (
          <MovingWord key={word} index={index} word={word} progress={progress} staticMode={staticMode} />
        ))}
      </div>
      <div className="mk-story-card-stage" aria-label={t(dictionary, "turn.h")}>
        {CARD_TYPES.map((typeKey, index) => (
          <StoryCard
            key={typeKey}
            dictionary={dictionary}
            index={index}
            progress={progress}
            staticMode={staticMode}
            backgroundColor={cardBackground}
            borderColor={cardBorder}
            textColor={cardText}
            title={cardTitles[index] ?? ""}
            typeKey={typeKey}
          />
        ))}
      </div>
    </div>
  );
}
