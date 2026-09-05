"use client";

import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Timeline24Markup } from "@/components/marketing/Timeline24Markup";
import { usePinProgress } from "@/components/marketing/PinSection";
import { type Dictionary } from "@/lib/i18n";

type DeferredTimeline24Props = {
  readonly dictionary: Dictionary;
};

const TimelineDictionaryContext = createContext<Dictionary | undefined>(undefined);

function TimelineLoading() {
  const dictionary = useContext(TimelineDictionaryContext);
  const { staticMode } = usePinProgress();
  return dictionary === undefined ? null : (
    <Timeline24Markup dictionary={dictionary} filledCount={0} staticMode={staticMode} />
  );
}

const LazyTimeline24 = dynamic(
  () => import("@/components/marketing/Timeline24").then((module) => module.Timeline24),
  {
    ssr: false,
    loading: TimelineLoading,
  },
);

export function DeferredTimeline24({ dictionary }: DeferredTimeline24Props) {
  const { staticMode } = usePinProgress();
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = rootRef.current;
    if (target === null) return;
    if (!("IntersectionObserver" in window)) {
      setActive(true);
      return;
    }

    let observer: IntersectionObserver | undefined;
    const checkScrollPosition = (): void => {
      if (target.getBoundingClientRect().top <= window.innerHeight * 1.5) {
        setActive(true);
        observer?.disconnect();
        window.removeEventListener("scroll", checkScrollPosition);
      }
    };
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActive(true);
          observer?.disconnect();
          window.removeEventListener("scroll", checkScrollPosition);
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(target);
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    checkScrollPosition();

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", checkScrollPosition);
    };
  }, []);

  return active ? (
    <TimelineDictionaryContext.Provider value={dictionary}>
      <LazyTimeline24 dictionary={dictionary} />
    </TimelineDictionaryContext.Provider>
  ) : (
    <Timeline24Markup
      dictionary={dictionary}
      filledCount={0}
      rootRef={rootRef}
      staticMode={staticMode}
    />
  );
}
