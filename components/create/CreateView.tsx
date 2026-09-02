"use client";

import Link from "next/link";
import { type ApiResult } from "@/components/BenchmarkResult";
import { DeepenStage } from "@/components/create/DeepenStage";
import { CompletionStage } from "@/components/create/CompletionStage";
import { IdeaStage } from "@/components/create/IdeaStage";
import { LoglineStage } from "@/components/create/LoglineStage";
import { LiveProfileCard } from "@/components/create/LiveProfileCard";
import { QuestionStage } from "@/components/create/QuestionStage";
import { StageTransition } from "@/components/create/StageTransition";
import { StoryTimeline } from "@/components/create/StoryTimeline";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ProgressNavigator, type ProgressStep } from "@/components/ProgressNavigator";
import type { CreationQuestion, CreationSession, ElementKey, LoglineOption } from "@/engine/creation";

const STAGE_NAMES = ["쏟아내기", "뼈대 찾기", "이야기 고르기", "깊게 만들기", "이야기 지도"] as const;
const STAGE_NEXT_ACTIONS = [
  "장면이나 인물 한 줄 더 적기",
  "비어 있는 질문 하나 답하기",
  "로그라인 한 안 선택하기",
  "후크나 심화 메모 남기기",
  "선택한 블록의 상세 확인하기",
] as const;

function progressStatus(stage: number, currentStage: CreationSession["stage"]): ProgressStep["status"] {
  if (stage < currentStage) return "complete";
  if (stage === currentStage) return "current";
  return "upcoming";
}

export interface CreateViewProps {
  readonly session: CreationSession;
  readonly questionIndex: number;
  readonly loading: string | null;
  readonly error: string | null;
  readonly result: ApiResult | null;
  readonly posterOf: (title: string) => string | null;
  readonly onStepChange: (id: string) => void;
  readonly onUtteranceChange: (value: string) => void;
  readonly onVoiceText: (value: string) => void;
  readonly onSubmitIdea: () => void;
  readonly onReset: () => void;
  readonly onElementChange: (key: ElementKey, value: string) => void;
  readonly onAnswerChange: (questionId: string, value: string) => void;
  readonly onPreviousQuestion: () => void;
  readonly onNextQuestion: (value: string) => void;
  readonly onSkipQuestion: () => void;
  readonly onGenerateLoglines: () => void;
  readonly onBackToIdea: () => void;
  readonly onSelectLogline: (index: number) => void;
  readonly onContinueLogline: () => void;
  readonly onRegenerateLoglines: () => void;
  readonly onRestorePreviousLoglines: () => void;
  readonly onBackToQuestions: () => void;
  readonly onDeepenNoteChange: (value: string) => void;
  readonly onHookNoteChange: (value: string) => void;
  readonly onGenerateStory: () => void;
  readonly onBackToLoglines: () => void;
  readonly onOpenStudio: () => void;
  readonly onExport: () => void;
}

export function CreateView({
  error,
  loading,
  onAnswerChange,
  onBackToIdea,
  onBackToLoglines,
  onBackToQuestions,
  onContinueLogline,
  onDeepenNoteChange,
  onElementChange,
  onExport,
  onGenerateLoglines,
  onGenerateStory,
  onHookNoteChange,
  onNextQuestion,
  onOpenStudio,
  onPreviousQuestion,
  onRegenerateLoglines,
  onRestorePreviousLoglines,
  onReset,
  onSelectLogline,
  onSkipQuestion,
  onStepChange,
  onSubmitIdea,
  onUtteranceChange,
  onVoiceText,
  posterOf,
  questionIndex,
  result,
  session,
}: CreateViewProps) {
  const progressSteps: readonly ProgressStep[] = STAGE_NAMES.map((title, index) => {
    const stage = index + 1;
    const output = stage === 1
      ? session.utterance.trim() ? "아이디어 1건 확정 / 추가 가능" : "아직 비어 있음"
      : stage === 2
        ? session.questions.length > 0 ? "작품 재료를 답과 함께 채우는 중" : "작품 재료 확인 완료"
        : stage === 3
          ? session.chosenIndex !== null ? "로그라인 1안 확정 / 다른 2안 보관" : "로그라인 3안 / 1안 선택 필요"
          : stage === 4
            ? session.hookNote.trim() ? "후크 1건 확정 / 심화 가능" : "후크가 아직 비어 있음"
            : result?.story ? "지도 24개 확정 / 블록 검토 가능" : "아직 비어 있음";
    return {
      id: "stage-" + stage,
      title,
      output,
      nextAction: STAGE_NEXT_ACTIONS[index],
      status: progressStatus(stage, session.stage),
    };
  });

  return (
    <main className="min-h-[100dvh] bg-canvas font-sans text-text">
      <div className="mx-auto max-w-6xl px-ds-5 py-ds-6 sm:px-ds-8">
        <header className="mb-ds-8 flex flex-wrap items-center gap-ds-4 border-b border-border pb-ds-5">
          <Link href="/" className="flex items-center gap-ds-2 text-text transition-opacity duration-micro hover:opacity-80" title="처음 화면으로">
            <span className="h-ds-2 w-ds-2 rounded-ds-full bg-accent" aria-hidden="true" />
            <span className="text-ds-body font-semibold">모두의 영화 창작</span>
          </Link>
          <span className="text-ds-body-sm text-muted">떠들면 이야기가 됩니다</span>
          <nav className="ml-auto flex flex-wrap items-center gap-ds-4 text-ds-body-sm" aria-label="주요 메뉴">
            <Link href="/" className="text-muted transition-colors duration-micro hover:text-text">탐색</Link>
            <span className="font-semibold text-accent" aria-current="page">만들기</span>
            <Link href="/write" className="text-muted transition-colors duration-micro hover:text-text">글쓰기</Link>
            <Link href="/studio" className="text-muted transition-colors duration-micro hover:text-text">작업실</Link>
            <Link href="/library" className="text-muted transition-colors duration-micro hover:text-text">내 서재</Link>
          </nav>
        </header>

        <div className="grid grid-cols-1 gap-ds-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid min-w-0 gap-ds-5">
            <StageTransition key={session.stage} stage={session.stage}>
            {session.stage === 1 ? (
              <IdeaStage
                utterance={session.utterance}
                loading={Boolean(loading)}
                onUtteranceChange={onUtteranceChange}
                onVoiceText={onVoiceText}
                onSubmit={onSubmitIdea}
                onReset={onReset}
              />
            ) : null}

            {session.stage === 2 ? (
              <>
                <LiveProfileCard session={session} />
                <QuestionStage
                  elements={session.elements}
                  questions={session.questions}
                  answers={session.answers}
                  questionIndex={questionIndex}
                  loading={Boolean(loading)}
                  onElementChange={onElementChange}
                  onAnswerChange={onAnswerChange}
                  onPreviousQuestion={onPreviousQuestion}
                  onNextQuestion={onNextQuestion}
                  onSkipQuestion={onSkipQuestion}
                  onGenerateLoglines={onGenerateLoglines}
                  onBack={onBackToIdea}
                />
              </>
            ) : null}

            {session.stage === 3 ? (
              <LoglineStage
                options={session.loglineOptions}
                history={session.loglineHistory ?? []}
                answers={session.answers}
                chosenIndex={session.chosenIndex}
                loading={Boolean(loading)}
                posterOf={posterOf}
                onSelect={onSelectLogline}
                onContinue={onContinueLogline}
                onRegenerate={onRegenerateLoglines}
                onRestorePrevious={onRestorePreviousLoglines}
                onBack={onBackToQuestions}
              />
            ) : null}

            {session.stage === 4 ? (
              <DeepenStage
                chosenLogline={session.chosenIndex !== null ? session.loglineOptions[session.chosenIndex]?.logline ?? "" : ""}
                deepenNote={session.deepenNote}
                hookNote={session.hookNote}
                loading={Boolean(loading)}
                onDeepenNoteChange={onDeepenNoteChange}
                onHookNoteChange={onHookNoteChange}
                onGenerate={onGenerateStory}
                onBack={onBackToLoglines}
              />
            ) : null}

            {session.stage === 5 ? (
              result?.story ? (
                <>
                  <CompletionStage story={result.story} engine={result.engine} onOpenStudio={onOpenStudio} onExport={onExport} />
                  <StoryTimeline story={result.story} />

                  {/* 스토리툰 전환 — 회의(2026-08-19) 확정 결제 지점. 지도를 본 직후가 전환이 가장 높다. */}
                  <Card tone="elevated" className="flex flex-wrap items-center justify-between gap-ds-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-ds-2">
                        <h3 className="text-ds-h3 font-bold text-text">이 이야기를 스토리툰으로 만들어 보실래요?</h3>
                        <Chip variant="secondary">준비 중</Chip>
                      </div>
                      <p className="mt-ds-1 text-ds-body-sm text-muted">
                        완성한 이야기 지도를 장면과 컷으로 나눠 웹툰처럼 펼칩니다.
                      </p>
                    </div>
                    <Button type="button" variant="quiet" disabled title="준비 중입니다">
                      곧 열려요
                    </Button>
                  </Card>
                </>
              ) : (
                <Card tone="surface" className="grid gap-ds-3 p-ds-8 text-center">
                  <p className="text-ds-body-sm text-muted">이야기 지도가 아직 없어요.</p>
                  <Button type="button" onClick={onBackToLoglines}>돌아가서 만들기</Button>
                </Card>
              )
            ) : null}
            </StageTransition>

            {loading ? <Card tone="elevated" className="p-ds-5 text-center text-ds-body-sm text-muted" role="status">{loading}</Card> : null}
            {error ? <Card tone="surface" className="p-ds-4 text-ds-body-sm text-danger" role="alert">{error}</Card> : null}
          </div>

          <ProgressNavigator steps={progressSteps} onStepChange={onStepChange} className="h-fit lg:sticky lg:top-ds-6" />
        </div>

        <footer className="mt-ds-10 border-t border-border pt-ds-4 text-ds-label text-muted">
          모두의 창작 · 자유 발화로 시작하는 이야기 작업실
        </footer>
      </div>
    </main>
  );
}
