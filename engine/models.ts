// 모델 ID 단일 관리 — 라우트마다 중복되던 하드코딩을 이곳으로 모은다.
//
// 모델 교체 방법: 환경변수만 바꾸면 된다. 모델별 API 계약 차이(사고 강제,
// 샘플링 파라미터 거부, effort 지원 범위, 출력 상한)는 engine/model-capabilities.ts가
// 흡수하므로 라우트 코드를 고칠 필요가 없다.
//
//   ANTHROPIC_MODEL=claude-fable-5        # 본생성을 Fable 5로
//   ANTHROPIC_MODEL_LIGHT=claude-haiku-4-5
//
// 모르는 새 모델을 넣어도 최신 계약으로 취급되어 동작한다(예외목록 방식).

/** 24블록 설계·로그라인 등 본생성용 */
export const MODEL_MAIN = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

/** 발화 추출·분류 등 가볍고 빈번한 호출용 (비용 통제) */
export const MODEL_LIGHT = process.env.ANTHROPIC_MODEL_LIGHT || "claude-haiku-4-5";
