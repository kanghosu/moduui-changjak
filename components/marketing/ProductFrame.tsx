"use client";

import Image from "next/image";
import { motion, useTransform } from "motion/react";
import { usePinProgress } from "@/components/marketing/PinSection";

export type MarketingProductAsset = "shot-create" | "shot-explore" | "shot-library";

type ProductFrameProps = {
  readonly asset: MarketingProductAsset;
  readonly alt: string;
  readonly className?: string;
  readonly heroMotion?: boolean;
  readonly pan?: boolean;
  readonly priority?: boolean;
  readonly sizes?: string;
};

const ASSETS = {
  "shot-create": "/marketing/shot-create.webp",
  "shot-explore": "/marketing/shot-explore.webp",
  "shot-library": "/marketing/shot-library.webp",
} as const satisfies Record<MarketingProductAsset, string>;

export function ProductFrame({
  asset,
  alt,
  className,
  heroMotion = false,
  pan = false,
  priority = false,
  sizes = "(max-width: 640px) 90vw, 52vw",
}: ProductFrameProps) {
  const { progress, staticMode } = usePinProgress();
  const heroRotate = useTransform(progress, [0, 1], [12, 0]);
  const heroScale = useTransform(progress, [0, 1], [0.9, 1]);
  const panX = useTransform(progress, [0, 1], ["0%", "-12%"]);
  const frame = (
    <div className={`mk-product-frame${className ? ` ${className}` : ""}`} data-marketing-frame={asset}>
      <Image
        src={ASSETS[asset]}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        data-marketing-img={asset}
      />
    </div>
  );

  if (heroMotion) {
    return (
      <motion.div
        className="mk-hero-product"
        data-static={staticMode ? "true" : "false"}
        style={{
          rotate: staticMode ? 0 : heroRotate,
          scale: staticMode ? 1 : heroScale,
        }}
      >
        {frame}
      </motion.div>
    );
  }

  if (!pan) return frame;

  return (
    <motion.div
      className="mk-library-pan"
      data-static={staticMode ? "true" : "false"}
      style={{ x: staticMode ? "-12%" : panX }}
    >
      {frame}
    </motion.div>
  );
}
