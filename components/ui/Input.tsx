import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
}

export function Input({
  className,
  error,
  hint,
  id,
  label,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [ariaDescribedBy, hint ? hintId : null, error ? errorId : null]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return (
    <label className="grid gap-ds-1 text-ds-body-sm text-text" htmlFor={inputId}>
      {label ? <span className="font-semibold">{label}</span> : null}
      <input
        {...props}
        id={inputId}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={cx(
          "min-h-ds-10 w-full rounded-ds-sm border border-border bg-surface px-ds-3 py-ds-2 text-ds-body text-text outline-none transition-[background-color,border-color,box-shadow] duration-micro placeholder:text-muted/80 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger focus:border-danger focus:ring-danger/20" : null,
          className,
        )}
      />
      {hint ? (
        <span id={hintId} className="text-ds-label text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-ds-label text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
