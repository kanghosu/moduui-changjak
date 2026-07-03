// 모두의 창작 — mock 엔진
// ANTHROPIC_API_KEY가 없을 때 사용. knowledge/method/24block.md의 원본 구조를 그대로 반영한
// 유효한 24블록 Story를 생성한다(전환점 13, 막 경계 1-6/7-12/13-18/19-24).
// mock은 "구조 골격"이며, 작품별 실제 사건(beat)·차별화(후크)는 실엔진/창작자의 몫이다.

import type { Act, Block, Character, Story } from "./schema";

export interface GenerateInput {
  logline: string;
  premise?: string;
  genre?: string;
  target?: string;
  tone?: string;
  hookNote?: string;
  benchmarkName?: string; // 변주의 출발이 된 벤치마크 작품(있으면 표기)
  // ── 작가의 지분 (스토리 프로필) ──
  ideaNote?: string;  // 두서없이 쏟아낸 아이디어 노트 → R1 취재 재료
  theme?: string;     // 주제·기획의도 (무엇을 말하고 싶은가)
  heroName?: string;  // 주인공 이름
  heroWant?: string;  // 겉욕망 (즉자적)
  heroNeed?: string;  // 속결핍 (대자적)
}

// 구조 앵커 (knowledge/method/24block.md 기준)
const ANTAGONIST_ESCALATION = [9, 14, 18]; // 악마: 발톱·본색·절정
const B_STORY = [8, 15, 22]; // 조력자 동맹선
const REVERSAL_INDEX = 13; // 전환점(중심 반전): 즉자→대자 180도

function actOf(index: number): Act {
  if (index <= 6) return 1;
  if (index <= 12) return 2;
  if (index <= 18) return 3;
  return 4;
}

const ACT_FUNCTION: Record<Act, string> = {
  1: "설정과 도입 — 결핍으로 가득하나 평온한 일상",
  2: "즉자적 욕망의 추구 — 진실에 다가가는 시간",
  3: "대자적 욕망의 추구 — 악마가 준동하는 시간",
  4: "결사항전 — 진실(선)의 힘은 악보다 강하다",
};

// 24블록 기능 (knowledge/method/24block.md 표와 1:1)
const BLOCK_FUNCTION: string[] = [
  "오프닝 이벤트 [프롤로그/주인공의 일상]", // 1
  "주인공 소개(1) — 평온한 일상 속의 '결핍' 제시", // 2
  "주인공 소개(2) — '결핍'을 해소하려는 일상적 노력", // 3
  "도입 이벤트 — 2번 블록의 '결핍'과 맞닥뜨리다", // 4
  "도입 이벤트의 후유증(혼란/딜레마)", // 5
  "후유증의 일시적·즉흥적 해소 → 시작점의 구성", // 6
  "시작점 — 핵심행동의 시작(결정)=즉자적 욕망의 점화", // 7
  "B-Story 인물 등장 + 주인공다움 입증(사상·능력)", // 8
  "악마의 '발톱' — 적대자의 첫 징후(빙산의 일각)", // 9
  "즉자적 욕망의 본격 추구 — 진실에 다가가는 전개", // 10
  "하이라이트 — 즉자적 욕망을 성취한(할) 듯한 기대 정점", // 11
  "좌절 — 기대의 붕괴, 근본문제(대자적 결핍) 자각", // 12
  "전환점(중심 반전) — 진실 자각, 즉자→대자 180도 전환·주제 부상", // 13
  "악마의 본색 — 적대자 본격 등장(상승)", // 14
  "대자적 욕망 전개 + 동맹선(B스토리) 심화", // 15
  "악마의 준동 심화 — 대자적 욕망 추구의 시련", // 16
  "위기의 고조 — 상실 직전의 압박", // 17
  "피크점 — 악마 절정, 가장 소중한 것의 상실", // 18
  "분노의 도약 — 상실의 분노로 일어서며 4막을 연다", // 19
  "결사적·조직적 반격의 준비", // 20
  "최후의 결전(클라이맥스) 돌입", // 21
  "보상과 축복 — 진실(선)의 승리, 동맹선의 결실", // 22
  "진실(선/정의)의 정착 — 선은 악보다 강하다", // 23
  "종결 — 새로운 일상 / 새로운 길로의 출발", // 24
];

export function mockGenerate(input: GenerateInput): Story {
  const logline = input.logline?.trim() || "(로그라인 미입력)";
  const genre = input.genre?.trim() || "미정";
  const tone = input.tone?.trim() || "미정";
  const target = input.target?.trim() || "일반";
  const premise = input.premise?.trim() || logline;
  const hook = input.hookNote?.trim();

  const characters: Character[] = [
    {
      id: "protagonist",
      name: input.heroName?.trim() || "주인공",
      role: "protagonist",
      want: input.heroWant?.trim() || "즉자적 욕망(요구): 인식 가능한 표면 목표",
      need: input.heroNeed?.trim() || "대자적 욕망(결핍): 미처 인식 못한 근본 욕망",
      arc: `${input.heroWant?.trim() || "즉자적 욕망"} → (전환점 13) → ${input.heroNeed?.trim() || "대자적 욕망"}으로 도약`,
    },
    {
      id: "antagonist",
      name: "악마(적대자)",
      role: "antagonist",
      want: "주인공의 진실 추구를 가로막는 대립 가치",
      need: "주인공의 거울상이 되는 결핍",
      arc: "발톱(9) → 본색(14) → 절정·상실(18)로 상승",
    },
    {
      id: "ally",
      name: "조력자(B스토리)",
      role: "ally",
      want: "주인공을 돕는 동맹선",
      need: "관계를 통해 주제를 강화",
      arc: "등장(8) → 심화(15) → 보상(22)",
    },
  ];

  const blocks: Block[] = Array.from({ length: 24 }, (_, i) => {
    const index = i + 1;
    const act = actOf(index);
    const isReversal = index === REVERSAL_INDEX;
    const antagonistEscalation = ANTAGONIST_ESCALATION.includes(index);
    const bStory = B_STORY.includes(index);

    let beat = `${BLOCK_FUNCTION[i]} — 이 작품의 사건 (입력: ${logline})`;
    if (hook && (isReversal || index === 1 || index === 7))
      beat += ` · [후크] ${hook}`;

    const chars = ["protagonist"];
    if (antagonistEscalation) chars.push("antagonist");
    if (bStory) chars.push("ally");

    return {
      index,
      act,
      function: BLOCK_FUNCTION[i],
      beat,
      characters: chars,
      ...(isReversal
        ? {
            isReversal: true,
            desireShift: {
              axis: "욕망" as const,
              fromState: "즉자적 욕망",
              toState: "대자적 욕망",
            },
          }
        : {}),
      ...(antagonistEscalation ? { antagonistEscalation: true } : {}),
      ...(bStory ? { bStory: true } : {}),
    };
  });

  const notes: string[] = [
    "[MOCK] ANTHROPIC_API_KEY 미설정 — mock 엔진으로 생성된 구조 골격입니다.",
    "구조 출처: knowledge/method/24block.md (욕망의 레시피, C-2013-022120). 전환점=블록 13.",
    `장르=${genre} / 톤=${tone} / 타깃=${target}`,
  ];
  if (input.benchmarkName)
    notes.push(`벤치마크 변주: '${input.benchmarkName}'의 4막·24블록 뼈대를 빌려 창조적 변주(뼈대는 유지, 결을 바꿈).`);
  if (input.theme) notes.push(`주제·기획의도: ${input.theme.trim().slice(0, 120)}`);
  if (input.ideaNote)
    notes.push(`아이디어 노트 ${input.ideaNote.trim().length}자 접수 — R1 취재 재료로 전달됨 (키 연결 시 사건 배치에 직접 반영).`);
  if (hook) notes.push(`후크 반영 지점: 블록 1(도입)·7(시작점)·13(전환점). 내용="${hook}"`);
  else notes.push("후크 미입력 — 차별화(후크)는 창작자의 몫으로 남겨둠.");

  return {
    logline,
    premise,
    genre,
    target,
    tone,
    hookNote: hook,
    characters,
    blocks,
    reversalPointIndex: REVERSAL_INDEX,
    notes,
  };
}
