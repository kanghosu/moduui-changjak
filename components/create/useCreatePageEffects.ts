import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  LibraryResponseSchema,
  type LibraryItem,
} from "@/components/create/createSchemas";
import { ensureMigrated } from "@/engine/library";
import {
  SESSION_KEY,
  emptySession,
  normalizeElements,
  type CreationSession,
} from "@/engine/creation";

interface CreatePageEffectsOptions {
  readonly session: CreationSession;
  readonly setSession: Dispatch<SetStateAction<CreationSession>>;
  readonly setQuestionIndex: Dispatch<SetStateAction<number>>;
  readonly setError: Dispatch<SetStateAction<string | null>>;
  readonly setLibrary: Dispatch<SetStateAction<readonly LibraryItem[]>>;
}

export function useCreatePageEffects({
  session,
  setError,
  setLibrary,
  setQuestionIndex,
  setSession,
}: CreatePageEffectsOptions): void {
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("mc_mode");
    document.documentElement.setAttribute("data-mode", savedMode === "light" ? "light" : "dark");

    ensureMigrated();

    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      try {
        const parsed: unknown = JSON.parse(rawSession);
        if (typeof parsed === "object" && parsed !== null) {
          const restored = { ...emptySession(), ...parsed };
          setSession({ ...restored, elements: normalizeElements(restored.elements) });
        }
      } catch (cause: unknown) {
        setError(cause instanceof Error ? "저장된 작업을 읽지 못했습니다." : "저장된 작업을 읽지 못했습니다.");
      }
    }

    async function loadLibrary(): Promise<void> {
      try {
        const response = await fetch("/api/benchmark");
        const payload: unknown = await response.json();
        const parsed = LibraryResponseSchema.safeParse(payload);
        if (parsed.success) setLibrary(parsed.data.list);
      } catch (cause: unknown) {
        if (cause instanceof Error) return;
        throw cause;
      }
    }

    void loadLibrary();
  }, []);

  useEffect(() => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (cause: unknown) {
        if (cause instanceof Error) setError("자동 저장을 사용할 수 없습니다.");
      }
    }, 800);

    return () => {
      if (saveRef.current) clearTimeout(saveRef.current);
    };
  }, [session]);

  useEffect(() => {
    setQuestionIndex((current) => Math.min(current, Math.max(session.questions.length - 1, 0)));
  }, [session.questions.length]);
}
