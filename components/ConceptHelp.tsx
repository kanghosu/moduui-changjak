"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { z } from "zod";

const ConceptSchema = z.object({
  slug: z.string(),
  definition: z.string(),
  aliases: z.array(z.string()),
  related: z.array(z.string()),
});

const ConceptResponseSchema = z.object({
  query: z.string(),
  concept: ConceptSchema.nullable(),
});

type Concept = z.infer<typeof ConceptSchema>;
type HelpState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly concept: Concept }
  | { readonly kind: "not-found" }
  | { readonly kind: "error"; readonly message: string };

class ConceptHelpError extends Error {
  readonly name = "ConceptHelpError";
}

function assertNever(value: never): never {
  throw new ConceptHelpError(`알 수 없는 도움말 상태: ${JSON.stringify(value)}`);
}

function Content({ state, term }: { readonly state: HelpState; readonly term: string }) {
  switch (state.kind) {
    case "idle":
      return <p className="text-xs text-cinema-dim">ⓘ를 누르면 ‘{term}’의 방법론 정의를 불러옵니다.</p>;
    case "loading":
      return <p className="text-xs text-cinema-dim">개념을 불러오는 중…</p>;
    case "loaded":
      return (
        <>
          <p className="text-xs leading-relaxed text-cinema-text">{state.concept.definition}</p>
          {state.concept.related.length > 0 && (
            <p className="mt-2 text-[11px] leading-relaxed text-cinema-dim">
              관련 개념: {state.concept.related.join(" · ")}
            </p>
          )}
        </>
      );
    case "not-found":
      return <p className="text-xs leading-relaxed text-cinema-dim">‘{term}’에 해당하는 개념을 찾지 못했습니다.</p>;
    case "error":
      return <p className="text-xs leading-relaxed" style={{ color: "var(--c-danger)" }}>도움말을 불러오지 못했습니다. {state.message}</p>;
    default:
      return assertNever(state);
  }
}

export function ConceptHelp({ term, children }: { readonly term: string; readonly children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<HelpState>({ kind: "idle" });
  const [requestKey, setRequestKey] = useState(0);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open || state.kind !== "idle") return;
    const controller = new AbortController();
    setState({ kind: "loading" });

    fetch("/api/concept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: term }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        const parsed = ConceptResponseSchema.safeParse(payload);
        if (!parsed.success) throw new ConceptHelpError("응답 형식이 올바르지 않습니다.");
        if (!response.ok || parsed.data.concept === null) {
          setState({ kind: "not-found" });
          return;
        }
        setState({ kind: "loaded", concept: parsed.data.concept });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        setState({ kind: "error", message });
      });

    return () => controller.abort();
  }, [open, requestKey, term]);

  useEffect(() => {
    if (!open) {
      setPopoverStyle(undefined);
      return;
    }

    const updatePopoverPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const popoverWidth = Math.min(22 * 16, Math.max(0, window.innerWidth - 40));
      const maxLeft = Math.max(16, window.innerWidth - popoverWidth - 16);
      const left = Math.min(Math.max(16, triggerRect.left), maxLeft);

      setPopoverStyle({ left, top: triggerRect.bottom + 8 });
    };

    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (state.kind === "loading") setState({ kind: "idle" });
        setOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, state.kind]);

  function toggle() {
    if (open && state.kind === "loading") setState({ kind: "idle" });
    setOpen(!open);
  }

  function retry() {
    setState({ kind: "idle" });
    setRequestKey((value) => value + 1);
    setOpen(true);
  }

  return (
    <span className="relative inline-flex align-baseline">
      <button
        type="button"
        ref={triggerRef}
        className="inline-flex items-center gap-1 rounded-sm border-b border-dotted border-cinema-amber/70 text-inherit outline-none transition-colors hover:text-cinema-amber focus-visible:ring-2 focus-visible:ring-cinema-amber/60"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`${term} 도움말 열기`}
        onClick={toggle}
      >
        {children ?? term}
        <span aria-hidden="true" className="text-[11px] text-cinema-amber">ⓘ</span>
      </button>
      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`${term} 도움말`}
          aria-live="polite"
          className="fixed z-30 w-[min(22rem,calc(100vw-2.5rem))] rounded-lg border border-cinema-line bg-cinema-surface p-3 text-left"
          style={popoverStyle}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-xs font-bold text-cinema-amber">{term}</p>
            <button type="button" onClick={toggle} className="rounded px-1 text-xs text-cinema-dim hover:text-cinema-text focus-visible:ring-2 focus-visible:ring-cinema-amber/60" aria-label="도움말 닫기">×</button>
          </div>
          <Content state={state} term={term} />
          {state.kind === "error" && <button type="button" onClick={retry} className="mt-2 text-[11px] font-semibold text-cinema-amber underline">다시 시도</button>}
        </div>
      )}
    </span>
  );
}
