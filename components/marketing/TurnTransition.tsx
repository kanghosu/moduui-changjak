"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { usePinProgress } from "@/components/marketing/PinSection";

type TurnTransitionProps = {
  readonly children: ReactNode;
};

type TurnCopyStyle = CSSProperties & {
  readonly color: MotionValue<string>;
};

export function TurnBackdrop() {
  const { progress } = usePinProgress();
  const paperOpacity = useTransform(progress, [0, 0.55, 1], [0, 0.42, 1]);
  const imageOpacity = useTransform(progress, [0, 0.55, 1], [0.68, 0.42, 0.12]);

  return (
    <div className="mk-turn-backdrop" aria-hidden="true">
      <motion.div className="mk-turn-paper-wash" style={{ opacity: paperOpacity }} />
      <motion.div className="mk-turn-image" style={{ opacity: imageOpacity }}>
        <Image src="/marketing/turn-cards.webp" alt="" fill sizes="100vw" data-marketing-img="turn-cards" />
      </motion.div>
    </div>
  );
}

export function TurnCopy({ children }: TurnTransitionProps) {
  const { progress } = usePinProgress();
  const color = useTransform(progress, [0, 0.62, 1], ["#EDEFF3", "#EDEFF3", "#242321"]);

  return (
    <motion.div className="mk-turn-copy" style={{ color } as TurnCopyStyle}>
      {children}
    </motion.div>
  );
}
