// 모델 ID 단일 관리 — 라우트마다 중복되던 하드코딩을 이곳으로 모은다.
// 환경변수로 오버라이드 가능. (ANTHROPIC_MODEL은 기존 배포와의 호환 유지)

// 24블록 설계·로그라인 등 본생성용
export const MODEL_MAIN = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// 발화 추출·분류 등 가볍고 빈번한 호출용 (비용 통제)
export const MODEL_LIGHT = process.env.ANTHROPIC_MODEL_LIGHT || "claude-haiku-4-5";
