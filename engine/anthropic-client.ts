// Anthropic 클라이언트 생성 한 곳 — 7개 라우트에 흩어져 있던 `new Anthropic({ apiKey })`를 모았다.
//
// 왜 있나: identity-linked API key(사용자 계정에 연결된 키)는 요청마다
// `anthropic-workspace-id` 헤더를 요구한다. 이 헤더가 없으면 모든 호출이
// 400 "anthropic-workspace-id is required..."로 실패한다 (2026-09-01 실측).
// 워크스페이스 ID는 Anthropic Console → Settings → Workspaces에서 확인한다.
import Anthropic from "@anthropic-ai/sdk";

export function makeAnthropicClient(apiKey: string): Anthropic {
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  return new Anthropic({
    apiKey,
    ...(workspaceId
      ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } }
      : {}),
  });
}
