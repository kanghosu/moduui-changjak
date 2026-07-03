// 모두의 창작 — 작법 엔진 스키마 (Phase 1)
// 출력 계약 + 구조 무결성 검증. skills/jakbeop-engine/SKILL.md와 한 쌍.

export type Act = 1 | 2 | 3 | 4;

export interface DesireArc {
  axis: "요구" | "이야기" | "욕망" | "결핍";
  fromState: string;
  toState: string;
}

export interface Character {
  id: string;
  name: string;
  role: "protagonist" | "antagonist" | "ally" | "supporting";
  want: string; // 표면적 요구
  need: string; // 결핍 / 진짜 욕망
  arc: string;  // 감정 곡선 요약
}

export interface Block {
  index: number;        // 1..24
  act: Act;
  function: string;     // 작법상 기능 (knowledge/method/24block.md 기준)
  beat?: string;        // 이 작품에서의 실제 사건 (생성 결과)
  characters?: string[]; // Character.id[]
  desireShift?: DesireArc;
  isReversal?: boolean;          // 중심 반전점
  antagonistEscalation?: boolean; // 블록 9·14·18
  bStory?: boolean;               // 블록 8·15·22
  // ── 거장 벤치마크 템플릿 필드 (02_영화 자료 엑셀과 1:1) ──
  subtitle?: string;        // 블록 줄거리 소제목
  summary?: string;         // 줄거리 요약
  externalEvent?: string;   // 스토리 (외적) 사건
  internalEmotion?: string; // 주인공 (내적) 정서
  bStoryText?: string;      // B-STORY(로맨스/조력)
  cStoryText?: string;      // C-STORY(관계)
  runtime?: string;         // 런닝타임 %
  blockTakeaway?: string;   // 블록별 착안점 (구형 벤치마크 템플릿)
}

export interface Story {
  logline: string;
  premise: string;
  genre: string;
  target: string;
  tone: string;
  hookNote?: string;
  characters: Character[];
  blocks: Block[];          // length === 24
  reversalPointIndex: number;
  notes: string[];
  // ── 벤치마크/메타 (선택) ──
  title?: string;
  year?: string;
  keyword?: string;         // 핵심 키워드(Key Word)
  analyst?: string;         // 분석정리자
  fourActLogline?: string;  // 4막구조 로그라인 스토리
  takeaway?: string;        // 착안점 (장르 특징·교훈·MyStory 적용)
}

export interface ValidationIssue {
  level: "error" | "warn";
  message: string;
}

// 구조 무결성 검증 (R5). 거장 방법론의 핵심 앵커를 강제한다.
export function validateStructure(s: Story): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (s.blocks.length !== 24)
    issues.push({ level: "error", message: `블록 수 ${s.blocks.length}개 (24개 필요)` });

  const byIndex = new Map(s.blocks.map((b) => [b.index, b]));

  const reversal = s.blocks.find((b) => b.isReversal);
  if (!reversal)
    issues.push({ level: "error", message: "전환점(중심 반전: 즉자적→대자적 욕망)이 없습니다." });
  else if (reversal.index !== 13)
    issues.push({
      level: "warn",
      message: `전환점이 블록 ${reversal.index}에 있습니다 (욕망의 레시피 기준 정중앙 13블록 권장).`,
    });

  for (const i of [9, 14, 18])
    if (!byIndex.get(i)?.antagonistEscalation)
      issues.push({ level: "warn", message: `블록 ${i}: 적대자(악마) 상승이 표기되지 않았습니다.` });

  for (const i of [8, 15, 22])
    if (!byIndex.get(i)?.bStory)
      issues.push({ level: "warn", message: `블록 ${i}: B스토리(동맹선)가 표기되지 않았습니다.` });

  if (!s.characters.some((c) => c.role === "protagonist"))
    issues.push({ level: "error", message: "주인공이 없습니다." });
  if (!s.characters.some((c) => c.role === "antagonist"))
    issues.push({ level: "warn", message: "적대자가 없습니다." });

  return issues;
}
