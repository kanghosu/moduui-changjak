"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "./utils";

export interface PopoverProps {
  readonly trigger: ReactNode;
  readonly children: ReactNode;
  readonly label?: string;
  readonly align?: "start" | "center" | "end";
  readonly defaultOpen?: boolean;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly className?: string;
}

const alignClasses: Record<NonNullable<PopoverProps["align"]>, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

export function Popover({
  align = "start",
  children,
  className,
  defaultOpen = false,
  label = "도움말",
  onOpenChange,
  open: controlledOpen,
  trigger,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentId = useId();
  const isControlled = controlledOpen !== undefined;
  const isOpen = controlledOpen ?? internalOpen;

  function setOpen(nextOpen: boolean) {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cx("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-controls={contentId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={label}
        onClick={() => setOpen(!isOpen)}
        className="inline-flex items-center gap-ds-1 rounded-ds-sm text-text underline decoration-border underline-offset-4 transition-[color,background-color] duration-micro hover:bg-surface hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        {trigger}
      </button>
      {isOpen ? (
        <div
          id={contentId}
          role="dialog"
          aria-label={label}
          className={cx(
            "absolute top-full z-50 mt-ds-2 w-[min(20rem,calc(100vw-2rem))] origin-top rounded-ds-md border border-border bg-elevated p-ds-4 text-left text-ds-body-sm text-text shadow-ds-popover transition-[opacity,transform] duration-standard",
            alignClasses[align],
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
