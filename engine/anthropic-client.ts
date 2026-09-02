// Anthropic 클라이언트 생성 한 곳 — 7개 라우트에 흩어져 있던 `new Anthropic({ apiKey })`를 모았다.
//
// 왜 있나: identity-linked API key(사용자 계정에 연결된 키)는 요청마다
// `anthropic-workspace-id` 헤더를 요구한다. 이 헤더가 없으면 모든 호출이
// 400 "anthropic-workspace-id is required..."로 실패한다 (2026-09-01 실측).
// 워크스페이스 ID는 Anthropic Console → Settings → Workspaces에서 확인한다.
import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic 호출 실패가 "폴백해도 되는 실패"인지 판정한다.
 * 인증·설정·크레딧·서버 오류(400/401/403/429/5xx)는 폴백하고,
 * SDK 오류로 판별할 수 없는 예외도 안전한 쪽으로 폴백한다.
 * 우리 GUARD가 낸 400/429는 이 함수에 도달하기 전에 라우트가 반환한다.
 */
export function isFallbackWorthy(error: unknown): boolean {
  if (!(error instanceof Anthropic.APIError)) return true;

  const { status } = error;
  return status === undefined
    || status === 400
    || status === 401
    || status === 403
    || status === 429
    || status >= 500;
}

export function makeAnthropicClient(apiKey: string): Anthropic {
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  return new Anthropic({
    apiKey,
    ...(workspaceId
      ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } }
      : {}),
  });
}
