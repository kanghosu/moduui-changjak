"use client";

import { motion, useTransform } from "motion/react";
import { usePinProgress } from "@/components/marketing/PinSection";
import { type Dictionary, t } from "@/lib/i18n";

type ProblemCardProps = {
  readonly dictionary: Dictionary;
};

export function ProblemCard({ dictionary }: ProblemCardProps) {
  const { progress, staticMode } = usePinProgress();
  const shadeOpacity = useTransform(progress, [0, 1], [0.02, 0.18]);

  return (
    <div className="mk-blank-card">
      <motion.span
        className="mk-blank-card-shade"
        aria-hidden="true"
        style={{ opacity: staticMode ? 0.18 : shadeOpacity }}
      />
      <p>{t(dictionary, "problem.blank")}<span className="mk-cursor" /></p>
    </div>
  );
}
