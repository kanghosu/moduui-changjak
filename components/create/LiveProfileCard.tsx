"use client";

import { Card } from "@/components/ui/Card";
import { Chip, type ChipVariant } from "@/components/ui/Chip";
import type { CreationSession, ElementKey } from "@/engine/creation";
import {
  deriveWorkProgress,
  profileElementState,
  profileElementsFromSession,
  type ElementStatus,
  type ProfileElementState,
  type WorkProgressDefinition,
} from "./funFlow";

const ELEMENT_LABELS = {
  scene: "핵심 장면",
  heroDesc: "주인공",
  heroName: "주인공 이름",
  heroWant: "겉으로 원하는 것",
  heroNeed: "진짜 필요한 것",
  premise: "핵심 갈등",
  theme: "주제",
  ending: "결말",
  genre: "장르",
  tone: "톤",
  era: "시대·배경",
  benchmark: "참고 영화",
  choice: "갈림길",
  hook: "나만의 후크",
} as const satisfies Readonly<Record<ElementKey, string>>;

const PROFILE_ELEMENT_KEYS = [
  "scene", "heroDesc", "heroName", "heroWant", "heroNeed", "premise", "theme",
  "ending", "genre", "tone", "era", "benchmark", "choice", "hook",
] as const satisfies readonly ElementKey[];

const WORK_PROGRESS = [
  { key: "premise", label: "핵심 갈등" },
  { key: "heroDesc", label: "주인공" },
  { key: "ending", label: "결말" },
  { key: "scene", label: "핵심 장면" },
  { key: "hook", label: "나만의 후크" },
] as const satisfies readonly WorkProgressDefinition[];

const STATUS_LABELS = {
  confirmed: "확정",
  unknown: "묻지 않기로 함",
  empty: "아직 비어 있음",
} as const satisfies Record<ElementStatus, string>;

const STATUS_VARIANTS = {
  confirmed: "success",
  unknown: "default",
  empty: "default",
} as const satisfies Record<ElementStatus, ChipVariant>;

function statusValue(state: ProfileElementState): string {
  return state.status === "confirmed" ? state.value : STATUS_LABELS[state.status];
}

function ProfileValue({ state }: { readonly state: ProfileElementState }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-ds-2">
      <span className="min-w-0 truncate text-ds-body-sm font-semibold text-text">{statusValue(state)}</span>
      {state.isAiGuess ? <Chip variant="secondary">AI가 추측</Chip> : null}
    </div>
  );
}

export interface LiveProfileCardProps {
  readonly session: CreationSession;
}

export function LiveProfileCard({ session }: LiveProfileCardProps) {
  const elements = profileElementsFromSession(session);
  const states = PROFILE_ELEMENT_KEYS.map((key) => profileElementState({
    key,
    label: ELEMENT_LABELS[key],
    element: elements[key],
  }));
  const progress = deriveWorkProgress(elements, WORK_PROGRESS);
  const confirmed = states.filter((state) => state.status === "confirmed");
  const unknown = states.filter((state) => state.status === "unknown");
  const empty = states.filter((state) => state.status === "empty");
  const genre = profileElementState({ key: "genre", label: ELEMENT_LABELS.genre, element: elements.genre });
  const tone = profileElementState({ key: "tone", label: ELEMENT_LABELS.tone, element: elements.tone });
  const hero = profileElementState({ key: "heroDesc", label: "인물 성향", element: elements.heroDesc });

  return (
    <Card tone="elevated" className="grid gap-ds-5" aria-label="실시간 창작 프로필">
      <div className="flex flex-wrap items-start justify-between gap-ds-3">
        <div>
          <p className="text-ds-label font-semibold uppercase tracking-ds-label text-secondary">답하면서 자라는 작품</p>
          <h2 className="mt-ds-1 text-ds-h3 font-bold text-text">내 이야기 프로필</h2>
          <p className="mt-ds-1 text-ds-body-sm text-muted">답한 내용은 바로 반영하고, 모르는 것은 빈칸과 다르게 남겨둘게요.</p>
        </div>
        <Chip variant="accent">확정 {confirmed.length}개</Chip>
      </div>

      <div className="grid gap-ds-3 sm:grid-cols-3" aria-label="장르 톤 인물 성향">
        {[genre, tone, hero].map((state) => (
          <div key={state.key} className="grid gap-ds-1 rounded-ds-md border border-border bg-surface p-ds-3">
            <span className="text-ds-label font-semibold text-muted">{state.label}</span>
            <ProfileValue state={state} />
          </div>
        ))}
      </div>

      <section className="grid gap-ds-2" aria-labelledby="profile-confirmed-heading">
        <div className="flex items-center justify-between gap-ds-3">
          <h3 id="profile-confirmed-heading" className="text-ds-body-sm font-bold text-text">반영된 것</h3>
          <span className="text-ds-label text-muted">작품 재료</span>
        </div>
        {confirmed.length > 0 ? (
          <ul className="grid gap-ds-2 sm:grid-cols-2">
            {confirmed.map((state) => (
              <li key={state.key} className="grid min-w-0 gap-ds-1 rounded-ds-md border border-success/30 bg-success/5 p-ds-3">
                <div className="flex flex-wrap items-center justify-between gap-ds-2">
                  <span className="text-ds-label font-semibold text-success">{state.label}</span>
                  {state.isAiGuess ? <Chip variant="secondary">AI가 추측</Chip> : <Chip variant="success">확정</Chip>}
                </div>
                <span className="break-words text-ds-body-sm font-semibold text-text">{state.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-ds-md border border-border bg-surface p-ds-3 text-ds-body-sm text-muted">아직 반영된 재료가 없어요. 아래 질문에 한 가지부터 답해 보세요.</p>
        )}
      </section>

      <section className="grid gap-ds-2 border-t border-border pt-ds-4" aria-labelledby="profile-empty-heading">
        <h3 id="profile-empty-heading" className="text-ds-body-sm font-bold text-text">아직 빈 것</h3>
        {empty.length > 0 ? (
          <div className="flex flex-wrap gap-ds-2">
            {empty.map((state) => <Chip key={state.key}>{state.label} · 아직 비어 있음</Chip>)}
          </div>
        ) : (
          <p className="text-ds-body-sm text-muted">지금 보이는 핵심 재료는 모두 상태가 있어요.</p>
        )}
      </section>

      {unknown.length > 0 ? (
        <section className="grid gap-ds-2 border-t border-border pt-ds-4" aria-labelledby="profile-unknown-heading">
          <h3 id="profile-unknown-heading" className="text-ds-body-sm font-bold text-text">묻지 않기로 한 것</h3>
          <div className="flex flex-wrap gap-ds-2">
            {unknown.map((state) => <Chip key={state.key}>{state.label} · 묻지 않기로 함</Chip>)}
          </div>
        </section>
      ) : null}

      <section className="grid gap-ds-2 border-t border-border pt-ds-4" aria-labelledby="profile-progress-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-ds-2">
          <h3 id="profile-progress-heading" className="text-ds-body-sm font-bold text-text">작품 단위 진행</h3>
          <span className="text-ds-label text-muted">질문 수가 아니라 이야기의 자리로 보여드려요.</span>
        </div>
        <div className="grid gap-ds-2 sm:grid-cols-2 lg:grid-cols-5">
          {progress.map((item) => (
            <div key={item.key} className="grid gap-ds-2 rounded-ds-md border border-border bg-surface p-ds-3">
              <span className="text-ds-label font-semibold text-text">{item.label}</span>
              <Chip variant={STATUS_VARIANTS[item.status]}>{STATUS_LABELS[item.status]}</Chip>
              {item.isAiGuess ? <span className="text-ds-label text-secondary">AI가 추측한 값</span> : null}
            </div>
          ))}
        </div>
      </section>
    </Card>
  );
}
