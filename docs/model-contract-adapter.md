# 모델 계약 어댑터 — 이식 가이드

> 다른 프로젝트·터미널·서버에 그대로 옮겨 쓰기 위한 자립형 문서.
> 이 파일 하나만 있으면 재현할 수 있다. 외부 파일을 참조하지 않는다.
>
> 최초 작성 2026-08-25 · 「모두의 창작」에서 실제로 겪은 문제와 해결
> 설계 출처: [Hermes Agent](https://github.com/NousResearch/hermes-agent) (MIT, © 2025 Nous Research)
> `agent/anthropic_adapter.py`의 판단 방식을 참고했다. 코드 복사가 아니라 접근을 가져왔다.

---

## 1. 무엇을 푸는 문제인가

LLM 호출 코드를 한 모델 기준으로 짜면, **모델 ID만 바꿔도 HTTP 400이 난다.** Claude 계열만 봐도 계약이 서로 다르다.

| 모델 | 걸리는 지점 |
|---|---|
| `claude-fable-5` | `thinking: {"type":"disabled"}` → **400** (사고가 강제됨) · `temperature`/`top_p`/`top_k` → **400** |
| `claude-opus-5` / `4.8` / `4.7` | 샘플링 파라미터 **거부** · `budget_tokens` **제거됨** |
| `claude-sonnet-4-6` / `opus-4-6` | `effort: "xhigh"` **거부** (xhigh는 4.7부터) · 샘플링은 허용 |
| `claude-haiku-4-5` 및 이전 | `effort` 자체 **미지원** · 사고는 `budget_tokens` 수동 방식 |
| 4.6 이상 전부 | assistant prefill **거부** |

여기에 더 조용한 문제가 하나 있다. **Fable 5·Opus 5는 안전 분류기가 거부하면 HTTP 200에 `stop_reason: "refusal"`을 준다.** 확인하지 않으면 빈 `content`를 정상 응답으로 착각해, 실제로는 "거부당했다"인데 "JSON 파싱 실패" 같은 엉뚱한 오류로 둔갑한다.

## 2. 핵심 설계 — 이 한 줄이 전부다

> **새 모델을 허용목록(allowlist)에 넣지 말고, 옛 모델을 예외목록(denylist)에 둔다.**

허용목록 방식(`if model in ["4.7", "4.8", ...]`)은 새 모델이 나오는 순간 목록에 없어서 **조용히 옛 경로로 떨어진다.** 오류가 안 나고 잘못 동작하므로 발견이 늦다.

예외목록 방식은 **모르는 모델을 최신 계약으로 취급한다.** 새 모델은 대개 최신 계약을 따르므로, 코드를 고치지 않아도 동작한다. 틀렸을 때의 비용도 비대칭이다 — 예외목록에서 빠뜨리면 400 한 번 나고 바로 알지만, 허용목록에서 빠뜨리면 몇 주 동안 잘못된 파라미터로 돌아간다.

이 원칙 때문에 아래 목록들은 전부 **"이런 옛 모델은 예외"** 형태로만 적혀 있다.

## 3. 이식 방법 — 3단계

1. §4의 소스를 프로젝트에 복사한다 (TypeScript는 그대로, 다른 언어는 §6 참고).
2. LLM 호출부의 `max_tokens: N` 같은 하드코딩을 `...buildRequestParams(model, { maxTokens: N })`로 바꾼다.
3. 응답을 파싱하기 **전에** 거부를 확인한다 (`refusalOf`).

호출부는 모델이 무엇인지 몰라도 된다. 그것이 목적이다.

### 적용 후 실측 결과 (참고)

같은 코드가 모델마다 다른 것을 보낸다.

```
claude-fable-5    → {"max_tokens":8000,"output_config":{"effort":"xhigh"}}          temperature 제거됨
claude-sonnet-4-6 → {"max_tokens":8000,"output_config":{"effort":"high"},"temperature":0.7}   xhigh→high 강등
claude-haiku-4-5  → {"max_tokens":8000,"temperature":0.7}                            effort 자체 생략
claude-opus-5     → {"max_tokens":8000,"output_config":{"effort":"xhigh"}}
```

## 4. 소스 (TypeScript) — 그대로 복사해 쓴다

```ts
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
```

## 5. 호출부 적용 예 (Anthropic SDK)

```ts
import Anthropic from "@anthropic-ai/sdk";
import { buildRequestParams, refusalOf } from "./model-capabilities";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const resp = await client.messages.create({
  model,
  ...buildRequestParams(model, { maxTokens: 8000, effort: "xhigh" }),
  system: "…",
  messages: [{ role: "user", content: "…" }],
});

// 파싱 전에 반드시 거부를 먼저 확인한다
const refusal = refusalOf(resp);
if (refusal.refused) {
  throw new Error(`모델이 요청을 거부했습니다${refusal.category ? ` (${refusal.category})` : ""}.`);
}

const text = resp.content
  .filter((b): b is { type: "text"; text: string } => b.type === "text")
  .map((b) => b.text)
  .join("\n");
```

**주의**: `thinking` 블록은 `type: "text"`가 아니므로 위 필터에서 자동으로 걸러진다. 대화를 이어갈 때는 thinking 블록을 **원형 그대로 되돌려 보내야** 한다(같은 모델 기준). 다른 모델로 넘길 때는 조용히 무시되므로 굳이 제거하지 않아도 된다.

## 6. 다른 언어로 옮길 때 (Python 예)

로직은 언어와 무관하다. 판단 함수 네 개와 상한 표만 옮기면 된다.

```python
LEGACY_MANUAL_THINKING = (
    "claude-3",
    "claude-opus-4-0", "claude-opus-4-1", "claude-opus-4-2025",
    "claude-sonnet-4-0", "claude-sonnet-4-2025",
    "claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5",
)
NO_XHIGH = ("claude-opus-4-6", "claude-sonnet-4-6")
MANDATORY_THINKING = ("claude-fable", "claude-mythos")

OUTPUT_LIMITS = {
    "claude-fable": 128_000, "claude-mythos": 128_000,
    "claude-opus-5": 128_000, "claude-sonnet-5": 128_000,
    "claude-opus-4-8": 128_000, "claude-opus-4-7": 128_000,
    "claude-opus-4-6": 128_000, "claude-sonnet-4-6": 64_000,
    "claude-opus-4-5": 64_000, "claude-sonnet-4-5": 64_000, "claude-haiku-4-5": 64_000,
    "claude-opus-4": 32_000, "claude-sonnet-4": 64_000, "claude-3": 8_192,
}
DEFAULT_MAX_OUTPUT = 64_000


def _hit(model: str, names) -> bool:
    return any(n in model for n in names)


def build_request_params(model_id: str, *, max_tokens=8_000, effort=None,
                         disable_thinking=False, show_thinking=False, temperature=None) -> dict:
    m = (model_id or "").lower()
    is_claude = "claude" in m
    legacy = _hit(m, LEGACY_MANUAL_THINKING)

    # 접두사 매치 — 긴 것이 우선 (claude-opus-4-6 이 claude-opus-4 보다 먼저 잡히도록)
    matches = sorted((k for k in OUTPUT_LIMITS if k in m), key=len, reverse=True)
    limit = OUTPUT_LIMITS[matches[0]] if matches else DEFAULT_MAX_OUTPUT

    params = {"max_tokens": min(max_tokens, limit)}
    if not is_claude:
        if temperature is not None:
            params["temperature"] = temperature
        return params

    if not legacy:  # 적응형 사고 계열
        if disable_thinking and not _hit(m, MANDATORY_THINKING):
            params["thinking"] = {"type": "disabled"}
        elif show_thinking:
            params["thinking"] = {"type": "adaptive", "display": "summarized"}
        if effort:
            if effort == "xhigh" and _hit(m, NO_XHIGH):
                effort = "high"
            params["output_config"] = {"effort": effort}

    forbids_sampling = (not legacy) and (not _hit(m, NO_XHIGH))
    if temperature is not None and not forbids_sampling:
        params["temperature"] = temperature
    return params


def refusal_of(response) -> tuple[bool, str | None]:
    """Fable 5·Opus 5는 거부 시 HTTP 200 + stop_reason='refusal'을 준다."""
    if getattr(response, "stop_reason", None) != "refusal":
        return False, None
    details = getattr(response, "stop_details", None)
    return True, getattr(details, "category", None) if details else None
```

## 7. 검증 — 이 케이스는 반드시 통과해야 한다

옮긴 뒤 아래를 테스트로 고정한다. 특히 **네 번째**가 이 설계의 핵심이라 빠뜨리면 의미가 없다.

| # | 케이스 | 기대 |
|---|---|---|
| 1 | `fable`에 `disableThinking: true` | `thinking`이 **전달되지 않음** (전달하면 400) |
| 2 | `fable`에 `temperature: 0.7` | `temperature`가 **제거됨** |
| 3 | `sonnet-4-5`에 `temperature: 0.7` | `temperature` **유지** (옛 모델은 허용) |
| 4 | **모르는 모델**(`claude-vega-9`)의 계약 | **최신 계약**으로 판정 — 옛 경로로 떨어지면 실패 |
| 5 | `sonnet-4-6`에 `effort: "xhigh"` | `high`로 **강등** |
| 6 | `opus-5`에 `effort: "xhigh"` | `xhigh` **통과** |
| 7 | `max_tokens: 999999` | 모델 상한으로 **잘림** (4.6=64K, fable=128K) |
| 8 | `stop_reason: "refusal"` 응답 | 거부로 **판정**되고 category가 전달됨 |
| 9 | Claude가 아닌 모델 | 제약을 **가정하지 않음** |

Node 내장 러너를 쓰면 새 의존성 없이 검증할 수 있다.

```bash
node --test "tests/*.test.ts"     # Node 22.6+ (타입 스트리핑)
```

TypeScript에서 테스트가 `.ts` 확장자로 import하면 `tsconfig.json`에 다음이 필요하다.

```json
{ "compilerOptions": { "allowImportingTsExtensions": true, "noEmit": true } }
```

## 8. 유지보수 — 새 모델이 나오면

**대개 아무것도 안 해도 된다.** 모르는 모델은 최신 계약으로 처리된다.

손대야 하는 경우는 셋뿐이다.

1. 새 모델이 **옛 계약**을 쓴다 → `LEGACY_MANUAL_THINKING`에 추가 (드묾)
2. 새 모델이 **사고를 강제**한다 → `MANDATORY_THINKING`에 추가. **애매하면 넣는 쪽이 낫다.** 빠뜨리면 400으로 턴이 죽고, 잘못 넣으면 사고가 켜진 채 돌 뿐이다 (비대칭)
3. 출력 상한이 다르다 → `OUTPUT_LIMITS`에 추가. 없으면 기본 64K로 처리되어 안전하게 잘린다

**모델 목록을 신뢰하지 말 것.** 이 표는 2026-08 기준이다. 정확한 값은 Models API(`GET /v1/models`)로 조회하는 편이 낫고, 특히 `max_input_tokens`·`capabilities` 필드가 있으면 그것을 우선한다.

## 9. 이 설계가 다루지 않는 것

- **스트리밍 전환**: `shouldStream()`은 권고만 한다. 실제 스트리밍 호출은 호출부가 구현해야 한다. `max_tokens`가 16K를 넘으면 비스트리밍은 HTTP 타임아웃 위험이 있다.
- **prefill**: 4.6 이상은 assistant prefill을 거부한다. 이 어댑터는 메시지 배열을 건드리지 않으므로, prefill을 쓰고 있다면 호출부에서 제거해야 한다.
- **프로바이더 차이**: Bedrock·Vertex·Foundry는 모델 ID 접두사와 지원 기능이 다르다. 이 어댑터는 first-party API 기준이다.
- **fallback**: Fable 5·Opus 5의 서버측 거부 폴백(`fallbacks` 파라미터)은 별개 기능이다. 거부를 자동 우회하려면 그쪽을 봐야 한다.

## 10. 라이선스·출처

설계 참고: [Hermes Agent](https://github.com/NousResearch/hermes-agent) — MIT License, Copyright (c) 2025 Nous Research.
코드를 복사하지 않았고 판단 방식(예외목록 우선, 미지 모델은 최신 계약)을 참고했다. 재배포 시 이 출처 표기를 유지할 것.
