// 모두의 창작 — R1→R2→R3 오케스트레이션 (프롬프트 5)
// .claude/agents 의 r1-chwijae / r2-structure / r3-character 를 순차 호출하고 병합한다.
// 단계 실행기(runStage)를 추상화해 mock(키 없음)과 Anthropic 실호출(키 있음)이 같은 흐름을 공유한다.

import type { Block, Character, Story } from "./schema";
import { mockGenerate, type GenerateInput } from "./mock";

export type StageId = "R1" | "R2" | "R3";

export interface StageTrace {
  stage: StageId;
  agent: string;
  title: string;
  detail: string;
  output: unknown;
}

export interface Orchestrated {
  story: Story;
  trace: StageTrace[];
}

// R1 산출 계약
export interface R1Output {
  assumptions: { claim: string; signalLevel: string; risk: string; fix: string }[];
}
// R2 산출 계약
export interface R2Output {
  blocks: Block[];
  reversalPointIndex: number;
}
// R3 산출 계약
export interface R3Output {
  characters: Character[];
}

// 단계 실행기: 시스템 프롬프트 + 사용자 메시지를 받아 JSON 객체를 반환한다.
export type StageRunner = (args: {
  stage: StageId;
  agent: string;
  system: string;
  user: string;
}) => Promise<unknown>;

export interface OrchestrateFiles {
  skill: string;
  blocks: string;
  ontology: string;
  schema: string;
  genreGuide?: string; // 장르별 블록 지침 (김태원 템플릿 원본)
  masters?: string;    // 세계 거장 프레임워크 교차표 (보조)
  agents: { r1: string; r2: string; r3: string };
}

// 실제 LLM 오케스트레이션. run 으로 단계별 호출을 위임받는다.
export async function orchestrate(
  input: GenerateInput,
  files: OrchestrateFiles,
  run: StageRunner
): Promise<Orchestrated> {
  const trace: StageTrace[] = [];

  // ── R1: 취재/정합성 ───────────────────────────────
  const r1System = [
    files.agents.r1,
    "\n## 방법론 데이터 — 온톨로지(신호 위계)\n",
    files.ontology,
    "\n## 출력: { assumptions:[{claim, signalLevel, risk, fix}] } JSON만.",
  ].join("\n");
  const r1 = (await run({
    stage: "R1",
    agent: "r1-chwijae",
    system: r1System,
    user: JSON.stringify(input),
  })) as R1Output;
  trace.push({
    stage: "R1",
    agent: "r1-chwijae",
    title: "취재 · 소재 정합성",
    detail: `가정 ${r1.assumptions?.length ?? 0}건 점검 (신호 위계 기준)`,
    output: r1,
  });

  // ── R2: 4막·24블록 구조 설계 ──────────────────────
  const r2System = [
    files.agents.r2,
    "\n## 방법론 데이터 — 24블록 (규범)\n",
    files.blocks,
    ...(files.genreGuide
      ? ["\n## 장르별 블록 지침 (입력 장르에 맞춰 적용)\n", files.genreGuide]
      : []),
    ...(files.masters
      ? ["\n## 세계 거장 교차표 (보조 자기검증용 — 충돌 시 규범 우선)\n", files.masters]
      : []),
    "\n## 출력 스키마\n",
    files.schema,
    "\n## 출력: { blocks: Block[24], reversalPointIndex: number } JSON만.",
  ].join("\n");
  const r2 = (await run({
    stage: "R2",
    agent: "r2-structure",
    system: r2System,
    user: JSON.stringify({ input, r1Assumptions: r1.assumptions }),
  })) as R2Output;
  trace.push({
    stage: "R2",
    agent: "r2-structure",
    title: "4막 · 24블록 구조 설계",
    detail: `블록 ${r2.blocks?.length ?? 0}개 · 중심 반전점 ${r2.reversalPointIndex}`,
    output: { reversalPointIndex: r2.reversalPointIndex, blockCount: r2.blocks?.length },
  });

  // ── R3: 인물 · 욕망선 ─────────────────────────────
  const r3System = [
    files.agents.r3,
    "\n## 방법론 데이터 — 온톨로지(욕망 4축)\n",
    files.ontology,
    "\n## 출력 스키마\n",
    files.schema,
    "\n## 출력: { characters: Character[] } JSON만.",
  ].join("\n");
  const r3 = (await run({
    stage: "R3",
    agent: "r3-character",
    system: r3System,
    user: JSON.stringify({ input, blocks: r2.blocks }),
  })) as R3Output;
  trace.push({
    stage: "R3",
    agent: "r3-character",
    title: "인물 · 욕망선 매핑",
    detail: `인물 ${r3.characters?.length ?? 0}명 · 욕망 4축(요구/이야기/욕망/결핍)`,
    output: r3,
  });

  // ── 병합 → Story ──────────────────────────────────
  const story: Story = {
    logline: input.logline?.trim() || "(로그라인 미입력)",
    premise: input.premise?.trim() || input.logline?.trim() || "",
    genre: input.genre?.trim() || "미정",
    target: input.target?.trim() || "일반",
    tone: input.tone?.trim() || "미정",
    hookNote: input.hookNote?.trim() || undefined,
    characters: r3.characters,
    blocks: r2.blocks,
    reversalPointIndex: r2.reversalPointIndex,
    notes: [
      "[오케스트레이션] R1(취재)→R2(구조)→R3(인물) 순차 병합 결과.",
      ...(input.benchmarkName
        ? [`벤치마크 변주: '${input.benchmarkName}'의 4막·24블록 뼈대를 빌려 창조적 변주(뼈대 유지, 결을 바꿈).`]
        : []),
      ...(input.theme ? [`주제·기획의도: ${input.theme.trim().slice(0, 120)}`] : []),
      ...(input.ideaNote
        ? [`아이디어 노트 ${input.ideaNote.trim().length}자 — R1 취재 재료로 투입됨.`]
        : []),
      ...r1.assumptions
        .filter((a) => /survey|설문/i.test(a.signalLevel))
        .map((a) => `⚠️ R1 약한 근거: ${a.claim} → 보강: ${a.fix}`),
    ],
  };

  return { story, trace };
}

// ── mock 단계 실행기 (키 없음) ──────────────────────
// 각 단계가 LLM 없이 그럴듯한 산출을 내도록 mockGenerate 결과를 분해해 사용한다.
export function makeMockRunner(input: GenerateInput): StageRunner {
  const base = mockGenerate(input);
  return async ({ stage }) => {
    if (stage === "R1") {
      const out: R1Output = {
        assumptions: [
          {
            claim: `소재 전제: ${input.premise?.trim() || input.logline}`,
            signalLevel: "survey(설문 수준·약함)",
            risk: "관객 수요가 검증되지 않음",
            fix: "행동/재참여/선결제 신호로 보강 권장",
          },
          {
            claim: `장르=${input.genre || "미정"} 타깃=${input.target || "일반"} 정합성`,
            signalLevel: "behavioral(행동)",
            risk: "타깃-톤 불일치 가능성",
            fix: "유사작 시청 데이터로 교차 확인",
          },
        ],
      };
      return out;
    }
    if (stage === "R2") {
      const out: R2Output = { blocks: base.blocks, reversalPointIndex: base.reversalPointIndex };
      return out;
    }
    const out: R3Output = { characters: base.characters };
    return out;
  };
}
