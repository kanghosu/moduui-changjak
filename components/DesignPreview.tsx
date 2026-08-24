"use client";

import { useEffect, useMemo, useState } from "react";
import { ChoiceCard, type ChoiceOption } from "@/components/ChoiceCard";
import { DraftBlock } from "@/components/DraftBlock";
import { HelpPopover } from "@/components/HelpPopover";
import { ModePicker, type CreationMode } from "@/components/ModePicker";
import { ProgressNavigator, type ProgressStep } from "@/components/ProgressNavigator";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type PreviewTheme = "light" | "dark";

const SWATCHES = [
  { token: "canvas", label: "Canvas" },
  { token: "surface", label: "Surface" },
  { token: "elevated", label: "Elevated" },
  { token: "text", label: "Text" },
  { token: "muted", label: "Muted" },
  { token: "accent", label: "Accent" },
  { token: "secondary", label: "Secondary" },
  { token: "success", label: "Success" },
  { token: "danger", label: "Danger" },
  { token: "border", label: "Border" },
] as const;

const TYPE_SCALE = [
  { token: "ds-h1", label: "H1 · 28px" },
  { token: "ds-h2", label: "H2 · 22px" },
  { token: "ds-h3", label: "H3 · 18px" },
  { token: "ds-body", label: "Body · 15px" },
  { token: "ds-body-sm", label: "Body small · 13.5px" },
  { token: "ds-label", label: "Label · 12px" },
] as const;

const INITIAL_STEPS: readonly Omit<ProgressStep, "status">[] = [
  { id: "materials", title: "재료 모으기", output: "장면 3개 저장됨", nextAction: "떠오른 장면 한 줄 더 적기" },
  { id: "questions", title: "부족한 것 묻기", output: "약 3개 남음", nextAction: "주인공이 잃을 것을 고르기" },
  { id: "direction", title: "방향 선택", output: "로그라인 3안 중 1안 선택", nextAction: "내 선택 반영하기" },
  { id: "characters", title: "인물과 장르 심화", output: "아직 비어 있음", nextAction: "인물의 속결핍 적기" },
  { id: "scenes", title: "장면 배치", output: "아직 비어 있음", nextAction: "앞 장면과 뒤 장면 연결하기" },
  { id: "timeline", title: "24블록 검토", output: "아직 비어 있음", nextAction: "이 버전으로 이어쓰기" },
];

const CHOICES: readonly ChoiceOption[] = [
  {
    id: "choice-a",
    title: "A · 시간을 거는 판",
    logline: "빚에 쫓긴 청년이 수명을 판돈으로 거는 도박장에 들어가 잃어버린 형을 찾는다.",
  },
  {
    id: "choice-b",
    title: "B · 마지막 대기표",
    logline: "새벽 인력시장의 번호표를 훔친 아들이 아버지의 마지막 약속을 되찾으려 한다.",
  },
  {
    id: "choice-c",
    title: "C · 다른 방향으로 보관",
    logline: "모두가 떠난 극장에서 홀로 남은 안내원이 관객의 비밀을 상영한다.",
    discarded: true,
  },
];

const MICROCOPY = [
  "내 장면 저장",
  "내 선택 반영",
  "이 버전으로 이어쓰기",
  "아직 선택하지 않음",
  "앞 장면이 필요함",
  "약 3개 남음",
] as const;

function statusFor(index: number, currentIndex: number): ProgressStep["status"] {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function DesignPreview() {
  const [theme, setTheme] = useState<PreviewTheme>("light");
  const [creationMode, setCreationMode] = useState<CreationMode>("scene-first");
  const [currentStepId, setCurrentStepId] = useState("direction");
  const [selectedChoice, setSelectedChoice] = useState("choice-a");
  const [importedPart, setImportedPart] = useState(false);
  const currentStepIndex = INITIAL_STEPS.findIndex((step) => step.id === currentStepId);
  const steps = useMemo(
    () => INITIAL_STEPS.map((step, index) => ({ ...step, status: statusFor(index, currentStepIndex) })),
    [currentStepIndex],
  );

  useEffect(() => {
    const previousMode = document.documentElement.dataset.mode;
    document.documentElement.dataset.mode = theme;
    return () => {
      if (previousMode) document.documentElement.dataset.mode = previousMode;
      else delete document.documentElement.dataset.mode;
    };
  }, [theme]);

  return (
    <main className="min-h-[100dvh] bg-canvas font-sans text-text">
      <div className="mx-auto grid max-w-6xl gap-ds-12 px-ds-5 py-ds-8 sm:px-ds-8">
        <header className="flex flex-wrap items-end justify-between gap-ds-5 border-b border-border pb-ds-6">
          <div>
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">모두의 창작 · 디자인 시스템</p>
            <h1 className="mt-ds-2 text-ds-h1 font-bold tracking-tight">따뜻한 작업실 프리뷰</h1>
            <p className="mt-ds-2 max-w-2xl text-ds-body-sm leading-relaxed text-muted">라이트를 기본으로 오래 쓰는 편집면을 만들고, 타임라인과 프리뷰에는 편집실의 밤을 보조 테마로 사용합니다.</p>
          </div>
          <div className="flex items-center gap-ds-2 rounded-ds-full border border-border bg-surface p-ds-1" aria-label="테마 선택">
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                onClick={() => setTheme(option)}
                className={`rounded-ds-full px-ds-3 py-ds-2 text-ds-label font-semibold transition-[background-color,color] duration-micro focus-visible:ring-2 focus-visible:ring-accent/30 ${theme === option ? "bg-accent text-accent-foreground" : "text-muted hover:text-text"}`}
              >
                {option === "light" ? "라이트 기본" : "다크 보조"}
              </button>
            ))}
          </div>
        </header>

        <section className="grid gap-ds-4" aria-labelledby="tokens-heading">
          <div>
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">01 · Tokens</p>
            <h2 id="tokens-heading" className="mt-ds-1 text-ds-h2 font-bold">색상 스와치</h2>
          </div>
          <div className="grid grid-cols-2 gap-ds-2 sm:grid-cols-5">
            {SWATCHES.map((swatch) => (
              <div key={swatch.token} className="overflow-hidden rounded-ds-md border border-border bg-surface">
                <div className="h-12 border-b border-border" style={{ backgroundColor: `var(--${swatch.token})` }} />
                <div className="grid gap-ds-1 p-ds-2">
                  <span className="text-ds-label font-semibold text-text">{swatch.label}</span>
                  <code className="text-ds-label text-muted">--{swatch.token}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-ds-4" aria-labelledby="type-heading">
          <div>
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">02 · Typography</p>
            <h2 id="type-heading" className="mt-ds-1 text-ds-h2 font-bold">Pretendard 타입 스케일</h2>
          </div>
          <Card className="grid gap-ds-4">
            {TYPE_SCALE.map((type) => (
              <div key={type.token} className="grid gap-ds-1 border-b border-border pb-ds-3 last:border-b-0 last:pb-0">
                <span className="text-ds-label text-muted">{type.label}</span>
                <p className={`${type.token} font-semibold text-text`}>내가 고른 장면은 다음 장면의 재료가 됩니다.</p>
              </div>
            ))}
          </Card>
        </section>

        <section className="grid gap-ds-4" aria-labelledby="primitive-heading">
          <div>
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">03 · Primitives</p>
            <h2 id="primitive-heading" className="mt-ds-1 text-ds-h2 font-bold">기초 컴포넌트 상태</h2>
          </div>
          <div className="grid gap-ds-4 lg:grid-cols-2">
            <Card className="grid gap-ds-4">
              <div>
                <h3 className="text-ds-h3 font-bold">Button</h3>
                <p className="mt-ds-1 text-ds-body-sm text-muted">강조색은 현재 행동 한 곳에만 둡니다.</p>
              </div>
              <div className="flex flex-wrap items-center gap-ds-2">
                <Button>내 장면 저장</Button>
                <Button variant="ghost">일부 가져오기</Button>
                <Button variant="quiet">나중에 보기</Button>
                <Button disabled>비활성</Button>
                <Button loading>저장 중</Button>
              </div>
              <div className="flex flex-wrap gap-ds-2">
                <Chip>기본</Chip>
                <Chip variant="accent">현재 단계</Chip>
                <Chip variant="secondary">장면</Chip>
                <Chip variant="success">확정</Chip>
                <Chip variant="danger">오류</Chip>
              </div>
            </Card>
            <Card className="grid gap-ds-4">
              <div>
                <h3 className="text-ds-h3 font-bold">Input · Textarea</h3>
                <p className="mt-ds-1 text-ds-body-sm text-muted">오류는 빈칸을 실패색으로 칠하지 않고 다음 행동을 말합니다.</p>
              </div>
              <Input id="preview-title" label="작품 제목" defaultValue="새벽의 대기표" hint="내 작업을 알아볼 짧은 이름" />
              <Input id="preview-error" label="현재 비어 있는 칸" error="앞 장면이 필요함" placeholder="장면을 한 줄 적어주세요" />
              <Input id="preview-disabled" label="자동으로 채워질 칸" disabled placeholder="아직 선택하지 않음" />
              <Textarea id="preview-textarea" label="장면 메모" defaultValue="번호표를 쥔 손이 이상하게 따뜻했다." rows={3} />
            </Card>
          </div>
          <Card className="flex flex-wrap items-center justify-between gap-ds-4">
            <p className="text-ds-body-sm text-muted">용어가 낯설다면 <HelpPopover term="로그라인" definition="주인공, 욕망, 행동과 갈등을 한 문장으로 묶은 이야기의 방향표입니다." relatedStep="방향 선택" />에서 뜻을 확인하세요.</p>
            <span className="text-ds-label text-muted">Popover · Escape / 바깥 클릭으로 닫기</span>
          </Card>
        </section>

        <section className="grid gap-ds-4" aria-labelledby="product-heading">
          <div>
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">04 · P1 Core</p>
            <h2 id="product-heading" className="mt-ds-1 text-ds-h2 font-bold">고유 컴포넌트</h2>
          </div>
          <div className="grid gap-ds-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div className="grid gap-ds-4">
              <ModePicker value={creationMode} onChange={setCreationMode} />
              <ChoiceCard options={CHOICES} selectedId={selectedChoice} onSelect={setSelectedChoice} />
              <DraftBlock
                userText="아버지는 번호표를 기다리는 동안 한 번도 앉지 않았다."
                suggestionText="그는 기다림이 끝나면 자신이 사라질까 봐, 서 있는 쪽을 택했다."
                onPartialImport={() => setImportedPart(true)}
              />
              {importedPart ? <p className="text-ds-label text-success" role="status">제안의 일부를 내 초안에 가져올 준비가 되었어요.</p> : null}
            </div>
            <ProgressNavigator steps={steps} onStepChange={setCurrentStepId} />
          </div>
        </section>

        <section className="grid gap-ds-4" aria-labelledby="copy-heading">
          <div>
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-muted">05 · Microcopy</p>
            <h2 id="copy-heading" className="mt-ds-1 text-ds-h2 font-bold">소유감을 남기는 말</h2>
          </div>
          <Card className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
            {MICROCOPY.map((copy) => (
              <div key={copy} className="rounded-ds-sm border border-border bg-canvas p-ds-3 text-ds-body-sm text-text">{copy}</div>
            ))}
          </Card>
          <p className="text-ds-body-sm text-muted">피할 말: “생성 완료”. 사용자의 선택·수정·저장을 주어로 쓰고, 빈칸은 “아직 비어 있음”처럼 다음 행동과 함께 보여줍니다.</p>
        </section>
      </div>
    </main>
  );
}
