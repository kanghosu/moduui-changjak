"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type ApiResult } from "@/components/BenchmarkResult";
import { CreateView } from "@/components/create/CreateView";
import {
  ExtractResponseSchema,
  LibraryResponseSchema,
  LoglineResponseSchema,
  apiMessage,
  isApiResult,
  toExtractedElements,
  type LibraryItem,
} from "@/components/create/createSchemas";
import {
  SESSION_KEY,
  emptySession,
  mergedElements,
  sessionToGenerateInput,
  type CreationSession,
} from "@/engine/creation";

function normalise(value: string): string {
  return value.toLowerCase().replace(/[\s<>:,·\[\]()「」'".-]/g, "");
}

export default function CreatePage() {
  const router = useRouter();
  const [session, setSession] = useState<CreationSession>(emptySession());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [library, setLibrary] = useState<readonly LibraryItem[]>([]);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("mc_mode");
    document.documentElement.setAttribute("data-mode", savedMode === "light" ? "light" : "dark");

    const rawSession = localStorage.getItem(SESSION_KEY);
    if (rawSession) {
      try {
        const parsed: unknown = JSON.parse(rawSession);
        if (typeof parsed === "object" && parsed !== null) setSession({ ...emptySession(), ...parsed });
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

  const posterOf = (title: string): string | null => {
    const item = library.find((candidate) => normalise(candidate.title) === normalise(title));
    return item?.posterUrl || null;
  };

  function patch(partial: Partial<CreationSession>) {
    setSession((current) => ({ ...current, ...partial }));
  }

  function goTo(stage: CreationSession["stage"]) {
    if (stage <= session.stage) patch({ stage });
  }

  function goToStep(id: string) {
    switch (id) {
      case "stage-1":
        goTo(1);
        return;
      case "stage-2":
        goTo(2);
        return;
      case "stage-3":
        goTo(3);
        return;
      case "stage-4":
        goTo(4);
        return;
      case "stage-5":
        goTo(5);
        return;
      default:
        return;
    }
  }

  async function runExtract(): Promise<void> {
    if (!session.utterance.trim()) {
      setError("한 줄이라도 좋아요 — 그냥 떠들어 주세요.");
      return;
    }

    setError(null);
    setLoading("이야기 속에서 인물과 장면을 찾는 중…");
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance: session.utterance }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload, "정리 실패"));
      const parsed = ExtractResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("추출 응답 형식이 올바르지 않습니다.");
      patch({
        elements: toExtractedElements(parsed.data.elements),
        questions: parsed.data.questions,
        answers: {},
        stage: 2,
      });
      setQuestionIndex(0);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "정리 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  async function runLoglines(answersOverride?: Record<string, string>): Promise<void> {
    setError(null);
    setLoading("세 가지 이야기 뼈대를 세우는 중…");
    try {
      const merged = mergedElements({ ...session, answers: answersOverride ?? session.answers });
      const response = await fetch("/api/loglines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance: session.utterance, elements: merged }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload, "뼈대 생성 실패"));
      const parsed = LoglineResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("로그라인 응답 형식이 올바르지 않습니다.");
      patch({ loglineOptions: parsed.data.options, chosenIndex: null, stage: 3 });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "뼈대 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  async function runGenerate(): Promise<void> {
    setError(null);
    setLoading("이야기 지도를 그리는 중… 구조를 잡고 인물을 세웁니다.");
    setResult(null);
    try {
      const input = sessionToGenerateInput(session);
      if (!input.logline) throw new Error("이야기 뼈대를 먼저 골라주세요.");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, pipeline: true }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiMessage(payload, "생성 실패"));
      if (!isApiResult(payload)) throw new Error("이야기 지도 응답 형식이 올바르지 않습니다.");

      setResult(payload);
      if (payload.story) {
        try {
          localStorage.setItem("mc_project", JSON.stringify({
            story: payload.story,
            benchmarkName: input.benchmarkName,
            confirmed: {},
            snapshots: [],
          }));
        } catch (cause: unknown) {
          if (cause instanceof Error) setError("지도는 만들었지만 작업실 저장은 확인이 필요합니다.");
        }
      }
      patch({ stage: 5 });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "이야기 지도 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(null);
    }
  }

  function nextQuestion(value: string) {
    const question = session.questions[questionIndex];
    if (!question) {
      void runLoglines();
      return;
    }

    const nextAnswers = { ...session.answers, [question.id]: value };
    patch({ answers: nextAnswers });
    if (questionIndex < session.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }
    void runLoglines(nextAnswers);
  }

  function resetAll() {
    if (!confirm("처음부터 다시 시작할까요? 지금까지의 내용은 지워집니다.")) return;
    setSession(emptySession());
    setQuestionIndex(0);
    setResult(null);
    setError(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? "작업을 지우지 못했습니다." : "작업을 지우지 못했습니다.");
    }
  }

  return (
    <CreateView
      session={session}
      questionIndex={questionIndex}
      loading={loading}
      error={error}
      result={result}
      posterOf={posterOf}
      onStepChange={goToStep}
      onUtteranceChange={(utterance) => patch({ utterance })}
      onVoiceText={(text) => patch({
        utterance: (session.utterance ? session.utterance.trimEnd() + " " : "") + text,
        source: session.utterance ? "mixed" : "voice",
      })}
      onSubmitIdea={() => void runExtract()}
      onReset={resetAll}
      onElementChange={(key, value) => patch({ elements: { ...session.elements, [key]: value } })}
      onAnswerChange={(questionId, value) => patch({ answers: { ...session.answers, [questionId]: value } })}
      onPreviousQuestion={() => setQuestionIndex((current) => Math.max(current - 1, 0))}
      onNextQuestion={nextQuestion}
      onSkipQuestion={() => nextQuestion("없음")}
      onGenerateLoglines={() => void runLoglines()}
      onBackToIdea={() => goTo(1)}
      onSelectLogline={(chosenIndex) => patch({ chosenIndex })}
      onContinueLogline={() => {
        if (session.chosenIndex === null) {
          setError("하나를 골라주세요 — 나중에 바꿀 수 있어요.");
          return;
        }
        setError(null);
        patch({ stage: 4 });
      }}
      onRegenerateLoglines={() => void runLoglines()}
      onBackToQuestions={() => goTo(2)}
      onDeepenNoteChange={(deepenNote) => patch({ deepenNote })}
      onHookNoteChange={(hookNote) => patch({ hookNote })}
      onGenerateStory={() => void runGenerate()}
      onBackToLoglines={() => goTo(3)}
      onOpenStudio={() => router.push("/studio")}
    />
  );
}
