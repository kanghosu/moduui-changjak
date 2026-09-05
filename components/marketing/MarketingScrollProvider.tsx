"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

const LazyLenisRuntime = dynamic(
  () => import("./LenisRuntime").then((module) => module.LenisRuntime),
  { ssr: false },
);

type MarketingScrollProviderProps = {
  readonly children: ReactNode;
};

export function MarketingScrollProvider({ children }: MarketingScrollProviderProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const target = document.getElementById("problem");
    if (target === null) {
      setEnabled(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setEnabled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {enabled ? <LazyLenisRuntime /> : null}
      {children}
    </>
  );
}
