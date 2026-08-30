import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export const metadata: Metadata = {
  title: "모두의 창작 — 떠들면 이야기가 된다",
  description:
    "4막·24블록 「욕망의 레시피」 방법론으로, 자유롭게 쏟아낸 말이 완성 가능한 이야기 구조가 됩니다. 플롯은 AI, 후크는 당신.",
};

const PROBLEMS = [
  {
    title: "빈 페이지가 무섭다",
    body: "쓰고 싶은 이야기는 머릿속에 가득한데, 어디서부터 어떻게 시작해야 할지 모릅니다. 첫 문장 앞에서 며칠이 지나갑니다.",
  },
  {
    title: "도구가 먼저 질문을 퍼붓는다",
    body: "기존 창작 도구는 장르·주인공·배경·갈등… 빈칸 열한 개부터 내밉니다. 아직 정리되지 않은 사람에게 질문지는 또 하나의 벽입니다.",
  },
  {
    title: "AI가 대신 쓰면 내 글이 아니다",
    body: "AI에게 통째로 맡기면 그럴듯한 글이 나오지만, 소유감이 사라집니다. 내 이야기라고 말할 수 없는 글은 끝까지 쓸 이유도 없습니다.",
  },
];

const PRINCIPLES = [
  {
    label: "질문을 먼저 주지 않는다",
    body: "일단 자유롭게 떠들면(텍스트든 음성이든), 이미 말한 것은 다시 묻지 않는 것을 목표로, 비어 있는 것만 묻습니다. 질문은 열 개를 넘지 않습니다.",
  },
  {
    label: "플롯은 AI, 후크는 당신",
    body: "구조·인과·플롯 설계는 엔진이 맡고, 이야기를 특별하게 만드는 차별화·감정·후크는 반드시 당신의 입력에서 나옵니다.",
  },
  {
    label: "발명이 아니라 기존 방법론",
    body: "작법을 새로 만들지 않았습니다. 김태원 「욕망의 레시피」 4막·24블록(저작권 C-2013-022120)을 엔진으로 옮겼습니다.",
  },
];

const STEPS = [
  {
    name: "쏟아내기",
    body: "질문 없이 시작합니다. 머릿속에 있는 것을 텍스트나 음성으로 자유롭게 쏟아냅니다.",
  },
  {
    name: "뼈대 찾기",
    body: "말한 내용에서 요소를 추출하고, 부족한 것만 한 화면에 한 질문씩 묻습니다. 인상적인 장면은 24블록 후보 자리로 역산합니다.",
  },
  {
    name: "이야기 고르기",
    body: "로그라인 3안(정공법·관계·아이러니)을 벤치마크 영화와 함께 제시합니다. 고르는 것은 당신입니다.",
  },
  {
    name: "깊게 만들기",
    body: "인물·사건·흐름·취재를 심화합니다. 후크 칸은 AI가 채우지 않습니다 — 당신만 채울 수 있습니다.",
  },
  {
    name: "이야기 지도",
    body: "4막·24블록 가로 타임라인 위에 인물선·반전점·적대자 상승·B스토리가 놓인 완성 설계도를 받습니다.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-canvas text-text">
      <div className="mx-auto grid max-w-5xl gap-ds-16 px-ds-5 py-ds-16">
        {/* 히어로 */}
        <section className="grid justify-items-center gap-ds-5 text-center">
          <Chip variant="accent">모두의 창작 소개</Chip>
          <h1 className="max-w-3xl text-balance text-ds-h1 font-bold leading-tight">
            떠들면 이야기가 된다
          </h1>
          <p className="max-w-2xl text-ds-body leading-relaxed text-muted">
            신인 창작자가 &ldquo;내 글&rdquo;이라는 소유감을 잃지 않으면서,
            <span className="text-text"> 4막·24블록 「욕망의 레시피」 방법론</span>으로 완성 가능한
            이야기 구조를 얻는 도구입니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-ds-3">
            <Link
              href="/create"
              className="inline-flex min-h-ds-10 items-center justify-center rounded-ds-md bg-accent px-ds-5 py-ds-2 text-ds-body-sm font-semibold text-accent-foreground shadow-ds-card transition-colors hover:bg-accent/90"
            >
              첫 설계도 만들기
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-ds-10 items-center justify-center rounded-ds-md border border-border bg-surface px-ds-5 py-ds-2 text-ds-body-sm font-semibold text-text transition-colors hover:border-accent hover:bg-elevated"
            >
              영화 라이브러리 둘러보기
            </Link>
          </div>
        </section>

        {/* 문제 */}
        <section className="grid gap-ds-5">
          <div className="grid gap-ds-2">
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">문제</p>
            <h2 className="text-ds-h2 font-bold">이야기를 시작하지 못하게 만드는 세 가지 벽</h2>
          </div>
          <div className="grid gap-ds-4 md:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <Card key={problem.title} tone="surface" className="grid content-start gap-ds-2 p-ds-5">
                <h3 className="text-ds-h3 font-bold">{problem.title}</h3>
                <p className="text-ds-body-sm leading-relaxed text-muted">{problem.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 해결 */}
        <section className="grid gap-ds-5">
          <div className="grid gap-ds-2">
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">해결</p>
            <h2 className="text-ds-h2 font-bold">양보하지 않는 세 가지 원칙</h2>
          </div>
          <div className="grid gap-ds-4">
            {PRINCIPLES.map((principle, index) => (
              <Card key={principle.label} tone="elevated" className="flex items-start gap-ds-4 p-ds-5">
                <span
                  aria-hidden
                  className="flex h-ds-8 w-ds-8 shrink-0 items-center justify-center rounded-ds-full bg-accent/10 text-ds-body-sm font-bold text-accent"
                >
                  {index + 1}
                </span>
                <div className="grid gap-ds-1">
                  <h3 className="text-ds-h3 font-bold">{principle.label}</h3>
                  <p className="text-ds-body-sm leading-relaxed text-muted">{principle.body}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 데모 — 5단계 */}
        <section className="grid gap-ds-5">
          <div className="grid gap-ds-2">
            <p className="text-ds-label font-semibold uppercase tracking-ds-label text-accent">이렇게 작동합니다</p>
            <h2 className="text-ds-h2 font-bold">쏟아내기에서 이야기 지도까지, 다섯 단계</h2>
            <p className="text-ds-body-sm leading-relaxed text-muted">
              전문 용어는 마지막 단계 전까지 나오지 않습니다. 어느 단계로든 되돌아갈 수 있고, 만든 것은 지워지지 않습니다.
            </p>
          </div>
          <ol className="grid gap-ds-3">
            {STEPS.map((step, index) => (
              <li key={step.name}>
                <Card tone="surface" className="flex items-start gap-ds-4 p-ds-5">
                  <span
                    aria-hidden
                    className="flex h-ds-8 w-ds-8 shrink-0 items-center justify-center rounded-ds-full border border-border bg-canvas text-ds-body-sm font-bold text-muted"
                  >
                    {index + 1}
                  </span>
                  <div className="grid gap-ds-1">
                    <h3 className="text-ds-h3 font-bold">{step.name}</h3>
                    <p className="text-ds-body-sm leading-relaxed text-muted">{step.body}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* 데이터 근거 */}
        <section>
          <Card tone="surface" className="grid gap-ds-3 p-ds-5">
            <h2 className="text-ds-h3 font-bold">무엇을 근거로 삼나</h2>
            <p className="text-ds-body-sm leading-relaxed text-muted">
              거장이 직접 검수한 <span className="font-semibold text-text">기준 작품 24편</span>과, 같은 24블록 틀로
              분석한 <span className="font-semibold text-text">AI 분석 초안 76편</span>을 구분해 사용합니다.
              생성 결과의 근거가 AI 분석 초안이면 화면에 그렇게 표기합니다 — 검수 완료로 부풀리지 않습니다.
            </p>
            <div className="flex flex-wrap gap-ds-2">
              <Chip variant="accent">거장 확정 24편</Chip>
              <Chip variant="secondary">AI 분석 초안 76편</Chip>
            </div>
          </Card>
        </section>

        {/* 마지막 CTA */}
        <section className="grid justify-items-center gap-ds-4 rounded-ds-lg border border-border bg-surface px-ds-5 py-ds-12 text-center">
          <h2 className="max-w-2xl text-balance text-ds-h2 font-bold">
            오늘 밤, 당신의 이야기가 개봉합니다
          </h2>
          <p className="max-w-xl text-ds-body-sm leading-relaxed text-muted">
            준비물은 없습니다. 머릿속에 있는 것을 그대로 쏟아내는 것으로 충분합니다.
          </p>
          <Link
            href="/create"
            className="inline-flex min-h-ds-10 items-center justify-center rounded-ds-md bg-accent px-ds-5 py-ds-2 text-ds-body-sm font-semibold text-accent-foreground shadow-ds-card transition-colors hover:bg-accent/90"
          >
            지금 시작하기
          </Link>
        </section>

        <footer className="border-t border-border pt-ds-4 text-ds-label text-muted">
          4막·24블록 「욕망의 레시피」 © 김태원 (C-2013-022120)
        </footer>
      </div>
    </main>
  );
}
