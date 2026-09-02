// 모델 계약(contract) 어댑터 — 모델마다 다른 API 제약을 한 곳에서 흡수한다.
//
// 왜 필요한가: 우리 엔진은 Sonnet 기준으로 짜여 있어서 모델을 바꾸면 400이 난다.
// 예를 들어 claude-fable-5는 thinking을 끌 수 없고(disabled → 400),
// temperature/top_p/top_k를 아예 받지 않는다. 모델 ID만 바꿔 끼우면 깨진다.
//
// 설계 출처: Nous Research의 Hermes Agent(MIT) `agent/anthropic_adapter.py`의
// 접근을 참고했다. 코드를 복사한 것이 아니라 아래 판단 방식을 가져왔다.
//   "새 모델을 허용목록에 추가하지 말고, 옛 모델을 예외목록에 둔다."
// 허용목록 방식은 신모델이 나올 때마다 조용히 낡은 경로로 떨어진다.
// 예외목록 방식은 모르는 모델을 최신 계약으로 취급하므로 코드 수정 없이 동작한다.
// https://github.com/NousResearch/hermes-agent (MIT License, Copyright (c) 2025 Nous Research)

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface ModelCapabilities {
  readonly isClaude: boolean;
  /** 적응형 사고(thinking: adaptive). false면 옛 budget_tokens 방식 */
  readonly adaptiveThinking: boolean;
  /** thinking을 끌 수 있는가. false면 disabled 전달 시 400 (예: fable) */
  readonly canDisableThinking: boolean;
  /** xhigh 강도를 받는가 (4.6 계열은 못 받음) */
  readonly xhighEffort: boolean;
  /** temperature/top_p/top_k를 거부하는가 (4.7+ 최신 계약) */
  readonly forbidsSampling: boolean;
  /** 출력 토큰 상한 */
  readonly maxOutputTokens: number;
  /** 이 값을 넘는 max_tokens는 스트리밍이 필요하다 */
  readonly streamingAdvisedAbove: number;
}

/* ── 예외목록: 옛 계약을 쓰는 모델들 ─────────────────
   여기 없는 Claude 모델은 전부 "최신 계약"으로 취급한다. */

/** 적응형 사고를 지원하지 않는 옛 계열 (budget_tokens 수동 지정) */
const LEGACY_MANUAL_THINKING = [
  "claude-3",
  "claude-opus-4-0", "claude-opus-4-1", "claude-opus-4-2025",
  "claude-sonnet-4-0", "claude-sonnet-4-2025",
  "claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5",
];

/** xhigh를 받지 못하는 계열 (xhigh는 4.7부터) */
const NO_XHIGH = ["claude-opus-4-6", "claude-sonnet-4-6"];

/** thinking을 끌 수 없는 계열 — disabled 전달 시 400.
 *  누락되면 턴이 죽고, 잘못 넣으면 사고가 켜진 채로 돌 뿐이다. 애매하면 넣는다. */
const MANDATORY_THINKING = ["claude-fable", "claude-mythos"];

/** 출력 상한. 접두사 매치, 긴 것부터 확인한다. */
const OUTPUT_LIMITS: ReadonlyArray<readonly [string, number]> = [
  ["claude-fable", 128_000],
  ["claude-mythos", 128_000],
  ["claude-opus-5", 128_000],
  ["claude-sonnet-5", 128_000],
  ["claude-opus-4-8", 128_000],
  ["claude-opus-4-7", 128_000],
  ["claude-opus-4-6", 128_000],
  ["claude-sonnet-4-6", 64_000],
  ["claude-opus-4-5", 64_000],
  ["claude-sonnet-4-5", 64_000],
  ["claude-haiku-4-5", 64_000],
  ["claude-opus-4", 32_000],
  ["claude-sonnet-4", 64_000],
  ["claude-3", 8_192],
];

/** 모르는 모델의 기본값 — 최신 계약을 가정한다 */
const DEFAULT_MAX_OUTPUT = 64_000;

const hit = (model: string, list: readonly string[]) =>
  list.some((s) => model.includes(s));

export function capabilitiesOf(modelId: string): ModelCapabilities {
  const model = (modelId || "").toLowerCase();
  const isClaude = model.includes("claude");

  if (!isClaude) {
    // Claude가 아니면 제약을 가정하지 않는다 (옛 계약으로 흘려보낸다)
    return {
      isClaude: false, adaptiveThinking: false, canDisableThinking: true,
      xhighEffort: false, forbidsSampling: false,
      maxOutputTokens: DEFAULT_MAX_OUTPUT, streamingAdvisedAbove: 16_000,
    };
  }

  const legacy = hit(model, LEGACY_MANUAL_THINKING);
  const limit = OUTPUT_LIMITS
    .filter(([prefix]) => model.includes(prefix))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? DEFAULT_MAX_OUTPUT;

  return {
    isClaude: true,
    adaptiveThinking: !legacy,
    canDisableThinking: !hit(model, MANDATORY_THINKING),
    xhighEffort: !legacy && !hit(model, NO_XHIGH),
    forbidsSampling: !legacy && !hit(model, NO_XHIGH),
    maxOutputTokens: limit,
    streamingAdvisedAbove: 16_000,
  };
}

export interface RequestOptions {
  readonly maxTokens?: number;
  readonly effort?: Effort;
  /** 사고를 끄고 싶다 — 모델이 허용할 때만 반영된다 */
  readonly disableThinking?: boolean;
  /** 사고 요약을 받고 싶다 */
  readonly showThinking?: boolean;
  readonly temperature?: number;
}

/** Anthropic messages.create에 그대로 펼쳐 넣을 수 있는 형태.
 *  max_tokens는 SDK가 필수로 요구하므로 반드시 포함한다. */
export interface SafeRequestParams {
  max_tokens: number;
  thinking?: { type: "adaptive" | "disabled"; display?: "summarized" | "omitted" };
  output_config?: { effort: Effort };
  temperature?: number;
}

/** 모델이 실제로 받아들이는 형태로 요청 파라미터를 만든다. */
export function buildRequestParams(
  modelId: string,
  opts: RequestOptions = {}
): SafeRequestParams {
  const caps = capabilitiesOf(modelId);
  const params: SafeRequestParams = { max_tokens: 0 };

  // 출력 상한을 넘겨 400을 맞지 않게 자른다
  const wanted = opts.maxTokens ?? 8_000;
  params.max_tokens = Math.min(wanted, caps.maxOutputTokens);

  if (caps.adaptiveThinking) {
    if (opts.disableThinking && caps.canDisableThinking) {
      params.thinking = { type: "disabled" };
    } else if (opts.showThinking) {
      params.thinking = { type: "adaptive", display: "summarized" };
    }
    // 그 외에는 thinking을 아예 보내지 않는다.
    // fable은 사고가 항상 켜져 있고, 다른 최신 모델도 기본값이 안전하다.

    if (opts.effort) {
      const effort: Effort =
        opts.effort === "xhigh" && !caps.xhighEffort ? "high" : opts.effort;
      params.output_config = { effort };
    }
  }

  // 최신 계약은 샘플링 파라미터를 거부한다 — 호출부가 넣었어도 여기서 떨군다
  if (opts.temperature !== undefined && !caps.forbidsSampling) {
    params.temperature = opts.temperature;
  }

  return params;
}

/** max_tokens가 커서 비스트리밍이면 타임아웃 위험이 있는가 */
export function shouldStream(modelId: string, maxTokens: number): boolean {
  return maxTokens > capabilitiesOf(modelId).streamingAdvisedAbove;
}

/**
 * 응답이 거부(refusal)인지 확인한다.
 * Fable 5·Opus 5는 안전 분류기가 거부하면 HTTP 200에 stop_reason="refusal"을 준다.
 * 확인하지 않으면 빈 content를 정상 응답으로 착각해 파싱 오류가 난다.
 */
export function refusalOf(
  response: { stop_reason?: string | null; stop_details?: { category?: string | null } | null }
): { refused: boolean; category?: string } {
  if (response?.stop_reason !== "refusal") return { refused: false };
  return { refused: true, category: response.stop_details?.category ?? undefined };
}

/* ── 거부 폴백 ──────────────────────────────────
   Fable 5·Opus 5는 안전 분류기가 거부하면 턴이 그대로 죽는다.
   실제로 겪은 사례: 사고(thinking) 블록을 다루는 코드를 작업하던 중
   category="reasoning_extraction"으로 거부됐다. 정상적인 엔지니어링 작업인데도
   분류기가 오탐한 것이다. 공식 문서도 "safe, normal conversations에서도
   가끔 발생한다"고 안내한다.

   서버측 `fallbacks` 파라미터는 최신 SDK와 베타 헤더가 필요하고 Claude API
   전용이다. 우리는 SDK 버전·프로바이더와 무관하게 동작하도록 클라이언트측에서
   다른 모델로 한 번 더 시도한다. */

/** 거부됐을 때 대신 시도할 모델. 없으면 폴백하지 않는다. */
export function fallbackModelFor(modelId: string): string | null {
  const m = (modelId || "").toLowerCase();
  const configured = process.env.ANTHROPIC_MODEL_FALLBACK;
  if (configured && configured !== modelId) return configured;

  // 거부가 잦은 최신 계열 → 상대적으로 보수적인 모델로 내린다
  if (m.includes("claude-fable") || m.includes("claude-mythos")) return "claude-opus-5";
  if (m.includes("claude-opus-5")) return "claude-sonnet-4-6";
  return null; // Sonnet·Haiku 계열은 폴백 대상 없음
}
