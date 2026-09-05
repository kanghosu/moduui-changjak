"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useScroll, type MotionValue } from "motion/react";

export type MarketingSectionId =
  | "hero"
  | "problem"
  | "turn"
  | "structure"
  | "library"
  | "done"
  | "try";
export type PinVh = 100 | 150 | 200 | 250;
type MarketingTone = "stage" | "paper";

type PinProgress = {
  readonly progress: MotionValue<number>;
  readonly staticMode: boolean;
};

type PinSectionProps = {
  readonly id: MarketingSectionId;
  readonly pinVh: PinVh;
  readonly tone: MarketingTone;
  readonly children: ReactNode;
};

const PinProgressContext = createContext<PinProgress | null>(null);

export function usePinProgress(): PinProgress {
  const value = useContext(PinProgressContext);
  if (value === null) throw new Error("usePinProgress must be used inside PinSection");
  return value;
}

export function PinSection({ id, pinVh, tone, children }: PinSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const [pinEnabled, setPinEnabled] = useState(true);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePinState = (): void => {
      setPinEnabled(window.innerWidth > 640 && !reducedMotionQuery.matches);
    };

    updatePinState();
    window.addEventListener("resize", updatePinState);
    reducedMotionQuery.addEventListener("change", updatePinState);

    return () => {
      window.removeEventListener("resize", updatePinState);
      reducedMotionQuery.removeEventListener("change", updatePinState);
    };
  }, []);

  useEffect(() => {
    if (!pinEnabled) scrollYProgress.set(1);
  }, [pinEnabled, scrollYProgress]);

  const progressState = useMemo(
    () => ({ progress: scrollYProgress, staticMode: !pinEnabled }),
    [pinEnabled, scrollYProgress],
  );

  return (
    <section
      ref={sectionRef}
      id={id}
      data-section={id}
      data-pin-vh={pinEnabled ? String(pinVh) : "false"}
      data-reduced-motion={!pinEnabled ? "true" : "false"}
      className={`mk-pin-section mk-section-${tone}`}
    >
      <div className="mk-pin" data-pin={pinEnabled ? "true" : "false"}>
        <PinProgressContext.Provider value={progressState}>
          {children}
        </PinProgressContext.Provider>
      </div>
    </section>
  );
}
