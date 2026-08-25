import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";

export type ButtonVariant = "primary" | "ghost" | "quiet";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
  readonly children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-ds-card hover:bg-accent/90 active:translate-y-px",
  ghost:
    "border border-border bg-surface text-text hover:border-accent hover:bg-elevated active:translate-y-px",
  quiet:
    "text-muted hover:bg-surface hover:text-text active:translate-y-px",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, disabled, loading = false, variant = "primary", type, children, ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-ds-10 items-center justify-center gap-ds-2 rounded-ds-md px-ds-4 py-ds-2 text-ds-body-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-micro focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
    >
      {children}
      {loading ? <span className="sr-only">처리 중</span> : null}
    </button>
  );
});

Button.displayName = "Button";
