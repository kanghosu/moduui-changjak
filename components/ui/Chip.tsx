import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export type ChipVariant = "default" | "accent" | "secondary" | "success" | "danger";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: ChipVariant;
  readonly children?: ReactNode;
}

const variantClasses: Record<ChipVariant, string> = {
  default: "border-border bg-surface text-muted",
  accent: "border-accent/30 bg-accent/10 text-accent",
  secondary: "border-secondary/30 bg-secondary/10 text-secondary",
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

export function Chip({ className, variant = "default", children, ...props }: ChipProps) {
  return (
    <span
      {...props}
      className={cx(
        "inline-flex min-h-ds-8 items-center rounded-ds-full border px-ds-2 py-ds-1 text-ds-label font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
