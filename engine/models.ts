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
//
// 기본값은 품질 우선 단계의 선택이다. 언제 저렴한 모델로 내릴 수 있는지의
// 기준은 docs/model-policy.md에 있다 — 기준 충족 전에는 내리지 않는다.

/** 24블록 설계·로그라인 등 본생성용 */
export const MODEL_MAIN = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/** 발화 추출용. 추출 품질이 제품 생명선(PRD v2 §4)이라 품질 우선 단계에서는
 *  본생성과 같은 모델을 쓴다. 다운그레이드 기준 충족 시 env로만 교체한다. */
// 배포 환경에서는 ANTHROPIC_MODEL_LIGHT를 저렴한 모델로 내려 비용을 낮출 수 있다.
// 하향 여부는 docs/model-policy.md의 기준으로 판단한다.
export const MODEL_LIGHT = process.env.ANTHROPIC_MODEL_LIGHT || "claude-opus-5";
