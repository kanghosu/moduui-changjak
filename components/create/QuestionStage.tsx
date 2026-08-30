"use client";

import { ScenePlacement } from "@/components/ScenePlacement";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import type { CreationQuestion, ElementKey, ExtractedElements } from "@/engine/creation";

const ELEMENT_LABEL: Record<ElementKey, string> = {
  scene: "인상적인 장면",
  heroDesc: "주인공",
  heroName: "주인공 이름",
  heroWant: "겉으로 원하는 것",
  heroNeed: "진짜 필요한 것",
  premise: "사건·소재",
  theme: "주제",
  ending: "결말 방향",
  genre: "장르",
  tone: "톤",
  era: "시대·배경",
  benchmark: "떠올린 영화",
  choice: "갈림길",
  hook: "나만의 차별점",
};

function isElementKey(value: string): value is ElementKey {
  return value in ELEMENT_LABEL;
}

export interface QuestionStageProps {
  readonly elements: ExtractedElements;
  readonly questions: readonly CreationQuestion[];
  readonly answers: Readonly<Record<string, string>>;
  readonly questionIndex: number;
  readonly loading: boolean;
  readonly onElementChange: (key: ElementKey, value: string) => void;
  readonly onAnswerChange: (questionId: string, value: string) => void;
  readonly onPreviousQuestion: () => void;
  readonly onNextQuestion: (value: string) => void;
  readonly onSkipQuestion: () => void;
  readonly onGenerateLoglines: () => void;
  readonly onBack: () => void;
}

export function QuestionStage({
  answers,
  elements,
  loading,
  onAnswerChange,
  onBack,
  onElementChange,
  onGenerateLoglines,
  onNextQuestion,
  onPreviousQuestion,
  onSkipQuestion,
  questionIndex,
  questions,
}: QuestionStageProps) {
  const visibleElements = Object.entries(elements).flatMap(([key, element]) => {
    if (!isElementKey(key) || !element || !element.value.trim()) return [];
    return [{ key, element }];
  });
  const question = questions[questionIndex];
  const answer = question ? answers[question.id] ?? "" : "";
  const remaining = Math.max(questions.length - questionIndex - 1, 0);

  return (
    <Card tone="surface" className="grid gap-ds-5 p-ds-6">
      <div>
        <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">02 · 뼈대 찾기</p>
        <h2 className="mt-ds-1 text-ds-h2 font-bold text-text">들은 것부터 확인할게요</h2>
        <p className="mt-ds-2 text-ds-body-sm leading-relaxed text-muted">
          이미 말씀하신 건 다시 묻지 않아요. 찾아낸 내용은 틀리면 바로 고쳐주세요.
        </p>
      </div>

      {visibleElements.length > 0 ? (
        <Card tone="elevated" className="grid gap-ds-3">
          <div>
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">먼저 잡힌 재료</p>
            <p className="mt-ds-1 text-ds-label text-muted">당신의 문장을 덮지 않고, 편집 가능한 메모로 남겨두었어요.</p>
          </div>
          <div className="grid gap-ds-3 sm:grid-cols-2">
            {visibleElements.map(({ key, element }) => (
              <Input
                key={key}
                label={ELEMENT_LABEL[key] ?? key}
                value={element.value}
                onChange={(event) => onElementChange(key, event.currentTarget.value)}
              />
            ))}
          </div>
        </Card>
      ) : (
        <p className="text-ds-body-sm text-muted">아직 잡힌 게 많지 않아요. 아래 한 가지씩 답하면 됩니다.</p>
      )}

      {elements.scene?.value.trim() ? <ScenePlacement sceneText={elements.scene.value} /> : null}

      {question ? (
        <Card tone="elevated" className="grid gap-ds-5 p-ds-6">
          <div className="flex flex-wrap items-center justify-between gap-ds-2">
            <div className="flex items-center gap-ds-2">
              <Chip variant="secondary">질문 {questionIndex + 1}/{questions.length}</Chip>
              <span className="text-ds-label text-muted">약 {remaining}개 남음</span>
            </div>
            <span className="text-ds-label text-muted">Enter로 다음</span>
          </div>

          <div>
            <h3 className="text-ds-h3 font-bold leading-relaxed text-text">{question.ask}</h3>
            {question.hint ? <p className="mt-ds-2 text-ds-body-sm leading-relaxed text-muted">{question.hint}</p> : null}
          </div>

          <Input
            label="당신의 답"
            hint="한 문장 또는 단어 하나면 충분해요."
            value={answer}
            autoFocus
            onChange={(event) => onAnswerChange(question.id, event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onNextQuestion(event.currentTarget.value);
              }
            }}
            placeholder="편하게 적어주세요"
          />

          <div className="flex flex-wrap items-center justify-between gap-ds-3">
            <Button type="button" variant="quiet" onClick={onSkipQuestion}>
              없음 · 건너뛰기
            </Button>
            <div className="flex items-center gap-ds-2">
              <Button type="button" variant="ghost" onClick={onPreviousQuestion} disabled={questionIndex === 0}>
                이전
              </Button>
              <Button type="button" loading={loading} onClick={() => onNextQuestion(answer)}>
                {questionIndex === questions.length - 1 ? "이야기 뼈대 3안 보기" : "다음"}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card tone="elevated" className="grid gap-ds-3">
          <p className="text-ds-body-sm text-text">비어 있는 질문이 없습니다. 지금 재료로 세 가지 방향을 만들어볼게요.</p>
          <Button type="button" loading={loading} onClick={onGenerateLoglines}>
            이야기 뼈대 3안 보기
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-ds-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          더 떠들기
        </Button>
        {questions.length > 0 ? <span className="text-ds-label text-muted">답변은 자동으로 저장됩니다.</span> : null}
      </div>
    </Card>
  );
}
