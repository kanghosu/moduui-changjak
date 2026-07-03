// 모두의 창작 — 내부 벤치마크 예시
// "벤치마크 창작": 좋아하는 영화의 '뼈대'(4막·24블록)를 분석해(기계적 대입의 재료),
// 창작자가 자기 이야기로 변주(창조적 변주)하도록 돕는다. knowledge/method/24block.md 구조에 맞춰 매핑.
//
// ⚠️ 아래는 기존 영화의 플롯을 작법 구조로 '해석'한 학습용 분석이다(저작물 인용 아님, 구조 매핑).

import type { Story } from "./schema";

// 불한당: 나쁜 놈들의 세상 (The Merciless, 2017, 변성현 감독)
// 누아르/배신극 — 4막의 '보상·축복'이 '비극적 역설'로 변주되는 좋은 벤치마크 사례.
const 불한당: Story = {
  logline:
    "인정받지 못한 잠입 경찰이 조직의 2인자와 의형제가 되지만, 양쪽 모두에게 배신당하며 '믿음'의 의미를 깨닫는 누아르.",
  premise:
    "교도소에서 시작된 한재호와 조현수의 형제애. 조현수는 조직을 무너뜨릴 언더커버지만, 경찰(천인숙)에게도 소모품일 뿐이다. 아무도 믿을 수 없는 '불한당의 세상'에서 진짜 관계란 무엇인가.",
  genre: "범죄 누아르 / 배신극",
  target: "20-40대 장르영화 팬",
  tone: "차갑고 스타일리시, 비장미(노怒>애哀)",
  hookNote:
    "적대자(한재호)가 곧 가장 소중한 동맹(형)이고, 아군(경찰)이 진짜 악마다 — 선악·적아의 경계를 무너뜨린다.",
  characters: [
    {
      id: "johyunsu",
      name: "조현수",
      role: "protagonist",
      want: "임무를 완수해 경찰로 인정받는 것(즉자적 욕망)",
      need: "배신뿐인 세상에서 믿을 수 있는 진짜 관계(대자적 욕망)",
      arc: "인정받으려는 도구 → (전환점) 누구도 믿을 수 없음을 자각 → 분노의 응징과 자멸",
    },
    {
      id: "cheoninsuk",
      name: "천인숙",
      role: "antagonist",
      want: "성과를 위해 조현수를 소모품으로 쓰는 비정한 시스템",
      need: "통제와 출세 — 인간을 수단으로 보는 결핍",
      arc: "냉정한 압박(발톱) → 배신 본격화(본색) → 모든 것을 앗아감(절정)",
    },
    {
      id: "hanjaeho",
      name: "한재호",
      role: "ally",
      want: "조직의 정점에 오르려는 야망",
      need: "단 한 명이라도 진짜 형제 — 비극적 동맹선(B스토리)",
      arc: "의형제 결연 → 신뢰의 정점 → 비극적 상실(피크점)",
    },
    {
      id: "gobyeongcheol",
      name: "고병철",
      role: "supporting",
      want: "조직의 지배권 유지",
      need: "—",
      arc: "한재호가 넘어야 할 윗선(즉자적 욕망의 표적)",
    },
  ],
  reversalPointIndex: 13,
  blocks: [
    { index: 1, act: 1, function: "오프닝 이벤트 [프롤로그/주인공의 일상]", beat: "피로 얼룩진 현재 — 강렬한 프롤로그로 조현수를 각인시킨다(비선형 도입).", characters: ["johyunsu"] },
    { index: 2, act: 1, function: "주인공 소개(1) — 평온한 일상 속의 '결핍'", beat: "조현수: 인정받지 못한 신참 경찰, 소속도 믿을 곳도 없는 결핍.", characters: ["johyunsu"] },
    { index: 3, act: 1, function: "주인공 소개(2) — '결핍'을 해소하려는 일상적 노력", beat: "위험한 언더커버 임무에 자원 — 인정받기 위해 교도소 잠입을 택한다.", characters: ["johyunsu", "cheoninsuk"] },
    { index: 4, act: 1, function: "도입 이벤트 — 2번 블록의 '결핍'과 맞닥뜨리다", beat: "교도소에서 한재호에게 의도적으로 시비를 걸어 눈에 든다 — 운명의 도입.", characters: ["johyunsu", "hanjaeho"] },
    { index: 5, act: 1, function: "도입 이벤트의 후유증(혼란/딜레마)", beat: "위험한 줄타기. 한재호 측근들의 의심과 시험이 이어진다.", characters: ["johyunsu", "hanjaeho"] },
    { index: 6, act: 1, function: "후유증의 일시적·즉흥적 해소 → 시작점의 구성", beat: "위기를 함께 넘기며 한재호의 신뢰를 얻기 시작 — 형동생의 씨앗.", characters: ["johyunsu", "hanjaeho"] },
    { index: 7, act: 2, function: "시작점 — 핵심행동의 시작(결정)=즉자적 욕망의 점화", beat: "출소 후 한재호 조직에 합류. 조직 와해라는 즉자적 임무가 본격 점화된다.", characters: ["johyunsu", "hanjaeho"] },
    { index: 8, act: 2, function: "B-Story 인물 등장 + 주인공다움 입증(사상·능력)", beat: "한재호와 의형제로 결연 — '형'. 조현수는 배짱과 능력으로 주인공다움을 입증한다.", characters: ["johyunsu", "hanjaeho"], bStory: true },
    { index: 9, act: 2, function: "악마의 '발톱' — 적대자의 첫 징후(빙산의 일각)", beat: "천인숙의 냉정한 압박과 조직 내 암투의 첫 징후 — 악마의 발톱이 스친다.", characters: ["johyunsu", "cheoninsuk"], antagonistEscalation: true },
    { index: 10, act: 2, function: "즉자적 욕망의 본격 추구 — 진실에 다가가는 전개", beat: "조직 깊숙이 침투하며 한재호의 야망(정점 탈취)을 목격한다.", characters: ["johyunsu", "hanjaeho", "gobyeongcheol"] },
    { index: 11, act: 2, function: "하이라이트 — 즉자적 욕망을 성취한(할) 듯한 기대 정점", beat: "한재호와 손잡고 고병철 제거에 성공한 듯 — 두 사람의 신뢰가 정점에 이른다.", characters: ["johyunsu", "hanjaeho", "gobyeongcheol"] },
    { index: 12, act: 2, function: "좌절 — 기대의 붕괴, 근본문제(대자적 결핍) 자각", beat: "천인숙이 조현수를 버릴 카드로 취급. 어디에도 속하지 못함을 자각하며 흔들린다.", characters: ["johyunsu", "cheoninsuk"] },
    { index: 13, act: 3, function: "전환점(중심 반전) — 진실 자각, 즉자→대자 180도 전환·주제 부상", beat: "\"경찰도 나를 버렸다.\" 임무(즉자)에서 '누구를 믿을 것인가'(대자)로 180도 전환 — 주제가 부상한다.", characters: ["johyunsu", "hanjaeho", "cheoninsuk"], isReversal: true, desireShift: { axis: "욕망", fromState: "임무 완수·인정(즉자적 욕망)", toState: "진짜 믿음·관계(대자적 욕망)" } },
    { index: 14, act: 3, function: "악마의 본색 — 적대자 본격 등장(상승)", beat: "천인숙의 배신이 본격화 — 조현수를 언제든 제거 가능한 말로 다룬다.", characters: ["johyunsu", "cheoninsuk"], antagonistEscalation: true },
    { index: 15, act: 3, function: "대자적 욕망 전개 + 동맹선(B스토리) 심화", beat: "한재호와의 유대가 비극적으로 깊어진다 — 그러나 진실(정체)의 그림자가 짙어진다.", characters: ["johyunsu", "hanjaeho"], bStory: true },
    { index: 16, act: 3, function: "악마의 준동 심화 — 대자적 욕망 추구의 시련", beat: "한재호가 조현수의 정체를 의심·감지하기 시작한다.", characters: ["johyunsu", "hanjaeho"] },
    { index: 17, act: 3, function: "위기의 고조 — 상실 직전의 압박", beat: "경찰과 조직 양쪽에서 동시에 조여온다 — 정체 탄로 직전.", characters: ["johyunsu", "hanjaeho", "cheoninsuk"] },
    { index: 18, act: 3, function: "피크점 — 악마 절정, 가장 소중한 것의 상실", beat: "작전과 배신이 맞물려 한재호가 죽는다 — 가장 소중한 관계의 상실.", characters: ["johyunsu", "hanjaeho", "cheoninsuk"], antagonistEscalation: true },
    { index: 19, act: 4, function: "분노의 도약 — 상실의 분노로 일어서며 4막을 연다", beat: "모든 걸 잃은 조현수가 분노의 힘으로 일어선다.", characters: ["johyunsu"] },
    { index: 20, act: 4, function: "결사적·조직적 반격의 준비", beat: "천인숙과 배신자들의 실체를 확인하고 응징을 준비한다.", characters: ["johyunsu", "cheoninsuk"] },
    { index: 21, act: 4, function: "최후의 결전(클라이맥스) 돌입", beat: "조현수가 비정한 시스템을 향해 최후의 응징을 감행한다.", characters: ["johyunsu", "cheoninsuk"] },
    { index: 22, act: 4, function: "보상과 축복 — (누아르 변주) 비극적 역설", beat: "진실은 드러나지만 보상은 파멸 — '축복' 대신 공허가 남는다(4막의 비극적 변주).", characters: ["johyunsu"], bStory: true },
    { index: 23, act: 4, function: "진실의 정착 — (변주) '불한당의 세상' 확정", beat: "선악·적아의 경계가 무너진 현실이 그대로 굳는다 — 정의의 승리가 아닌 냉혹한 진실.", characters: ["johyunsu"] },
    { index: 24, act: 4, function: "종결 — 새로운 길(변주: 비극적 엔딩)", beat: "조현수는 모든 것을 잃고 공허만 남는다 — 출구 없는 누아르의 종결.", characters: ["johyunsu"] },
  ],
  notes: [
    "[벤치마크] 영화 '불한당: 나쁜 놈들의 세상'(2017)을 4막·24블록으로 매핑한 학습용 구조 분석.",
    "비선형 영화지만 '욕망의 레시피'는 사건의 시간순(정서곡선)으로 정렬한다.",
    "역할 변주 포인트: 구조적 표적(한재호)이 감정적 동맹(형)이고, 아군(천인숙/경찰)이 진짜 악마다.",
    "장르 변주 포인트: 누아르라 4막의 '보상·축복'(22)이 '비극적 역설'로 뒤집힌다 — 뼈대는 지키되 결을 바꾼 좋은 예.",
  ],
};

export const BENCHMARKS: Record<string, Story> = { 불한당 };

export const BENCHMARK_LIST = [
  { key: "불한당", title: "불한당: 나쁜 놈들의 세상", year: 2017, genre: "범죄 누아르", emoji: "🔪", tagline: "적이 형이고, 아군이 악마다." },
];
