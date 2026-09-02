import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export type CardTone = "surface" | "elevated" | "interactive";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: CardTone;
  readonly children?: ReactNode;
}

const toneClasses: Record<CardTone, string> = {
  surface: "bg-surface",
  elevated: "bg-elevated shadow-ds-card",
  interactive: "bg-surface transition-[background-color,border-color,transform] duration-micro hover:-translate-y-px hover:border-accent",
};

export function Card({ className, tone = "surface", children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cx("rounded-ds-md border border-border p-ds-4", toneClasses[tone], className)}
    >
      {children}
    </div>
  );
}
