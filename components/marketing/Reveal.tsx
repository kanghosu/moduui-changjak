"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

type RevealProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly delay?: number;
};

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.12, once: true });
  const reducedMotion = useReducedMotion() === true;
  const visible = reducedMotion || inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      data-reveal="true"
      initial={{ opacity: 0.88, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0.88, y: 24 }}
      transition={{
        duration: 0.48,
        delay: delay * 0.12,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
