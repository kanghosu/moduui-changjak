"use client";

import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePinProgress } from "@/components/marketing/PinSection";
import { WordToCardsMarkup } from "@/components/marketing/WordToCardsMarkup";
import { type Dictionary } from "@/lib/i18n";

type DeferredWordToCardsProps = {
  readonly dictionary: Dictionary;
};

const WordDictionaryContext = createContext<Dictionary | undefined>(undefined);

function WordLoading() {
  const dictionary = useContext(WordDictionaryContext);
  const { staticMode } = usePinProgress();
  return dictionary === undefined ? null : (
    <WordToCardsMarkup dictionary={dictionary} staticMode={staticMode} />
  );
}

const LazyWordToCards = dynamic(
  () => import("@/components/marketing/WordToCards").then((module) => module.WordToCards),
  {
    ssr: false,
    loading: WordLoading,
  },
);

export function DeferredWordToCards({ dictionary }: DeferredWordToCardsProps) {
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
    <WordDictionaryContext.Provider value={dictionary}>
      <LazyWordToCards dictionary={dictionary} />
    </WordDictionaryContext.Provider>
  ) : (
    <WordToCardsMarkup dictionary={dictionary} rootRef={rootRef} staticMode={staticMode} />
  );
}
