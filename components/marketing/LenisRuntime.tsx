"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function LenisRuntime() {
  useEffect(() => {
    const lenis = new Lenis({
      anchors: true,
      autoRaf: false,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
    });
    let frameId = window.requestAnimationFrame(tick);

    function tick(time: number): void {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return null;
}
