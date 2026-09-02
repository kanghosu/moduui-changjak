// Anthropic 호출 한 곳 — 라우트 6곳에 흩어져 있던 같은 코드를 모았다.
//
// 각 라우트가 따로 갖고 있던 것: JSON 추출, 파싱 실패 재시도, 거부 확인.
// 같은 로직이 여섯 벌이면 하나를 고칠 때 다섯을 빠뜨린다. 실제로 거부 확인은
// 최근까지 어디에도 없었다.
//
// 여기서 처리하는 것
//   1. 모델별 계약 (model-capabilities)
//   2. 거부(refusal) → 다른 모델로 한 번 더 시도
//   3. JSON 파싱 실패 → 더 강한 지시로 한 번 더 시도

import { buildRequestParams, refusalOf, fallbackModelFor, type Effort } from "./model-capabilities.ts";

/** SDK 버전에 종속되지 않도록 필요한 만큼만 구조를 정의한다 */
interface MessageLike {
  content: unknown[];
  stop_reason?: string | null;
  stop_details?: { category?: string | null } | null;
  usage?: UsageLike | null;
}
/** SDK 클라이언트. 버전마다 create()의 오버로드가 달라 정확히 맞추기 어려우므로
 *  경계에서 한 번만 좁힌다. 이 캐스트가 SDK 버전 종속을 여기 한 곳에 가둔다. */
type ClientLike = {
  messages: { create(body: Record<string, unknown>): Promise<MessageLike> };
};

/* ── 프롬프트 캐싱 ──────────────────────────────
   시스템 프롬프트(방법론 지침·few-shot 예시)는 요청마다 똑같은데 매번 정가로 보내고
   있었다(2026-09-02 모델 점검, docs/model-watch.md ②). cache_control을 붙이면
   같은 접두사의 두 번째 요청부터 캐시 읽기(입력가의 0.1배)로 처리된다.

   - 첫 요청은 쓰기 비용 1.25배(5분 TTL). 파싱 실패 재시도(STRICTER)가 한 번만
     캐시를 맞아도 이득이다 — 재시도는 시스템 프롬프트를 바꾸지 않으므로 반드시 맞는다.
   - 캐시 최소 길이는 모델별이다(opus-5 512토큰, sonnet-4-6 1024). 그보다 짧으면
     오류 없이 조용히 캐시되지 않는다. 짧고 요청마다 바뀌는 프롬프트(suggest)는 붙이지 않는다.
   - TTL 기본 5분. 캐시 읽기가 있으면 타이머가 무료로 갱신된다. 같은 프롬프트를 쓰는
     요청 간격이 5~60분이면 1시간 TTL(쓰기 2배)이 유리하다. usage 로그로 재서 정한다.
   - 접두사가 한 바이트라도 바뀌면 그 뒤가 전부 무효다. 시스템 프롬프트에 시각·요청 ID를
     넣지 말 것. 요청마다 다른 내용은 user 메시지에 둔다. */

export type CacheTtl = "5m" | "1h";

export interface CachedSystemBlock {
  readonly type: "text";
  readonly text: string;
  readonly cache_control: { readonly type: "ephemeral"; readonly ttl?: "1h" };
}

/** ANTHROPIC_CACHE_TTL=1h 로 바꿀 수 있다. 그 외 값은 전부 5분. */
export function cacheTtl(): CacheTtl {
  return process.env.ANTHROPIC_CACHE_TTL === "1h" ? "1h" : "5m";
}

/** 시스템 프롬프트를 캐시 표시가 붙은 블록 배열로 감싼다. 빈 문자열이면 빈 배열. */
export function cachedSystem(text: string): CachedSystemBlock[] {
  if (!text) return [];
  return [{
    type: "text",
    text,
    cache_control: cacheTtl() === "1h" ? { type: "ephemeral", ttl: "1h" } : { type: "ephemeral" },
  }];
}

export interface UsageLike {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** 호출당 토큰 사용량을 서버 로그로 남긴다.
 *  같은 라우트를 반복 호출했는데 cache_read가 계속 0이면 캐싱이 깨진 것이다
 *  (프롬프트 조립에 요청마다 바뀌는 값이 섞였는지 확인). */
export function logUsage(route: string, message: { usage?: UsageLike | null } | null | undefined): void {
  const u = message?.usage;
  if (!u) return;
  console.info(
    `[usage] ${route} in=${u.input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} ` +
    `cache_read=${u.cache_read_input_tokens ?? 0} out=${u.output_tokens ?? 0}`
  );
}

export class RefusalError extends Error {
  // Node의 타입 스트리핑은 생성자 파라미터 프로퍼티를 지원하지 않는다.
  // (`constructor(readonly x)` → ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX)
  // npm test로 검증하려면 필드를 명시해야 한다.
  readonly category: string | undefined;
  readonly triedModels: string[];

  constructor(category: string | undefined, triedModels: string[]) {
    super(
      `모델이 요청을 거부했습니다${category ? ` (${category})` : ""}. ` +
      `시도한 모델: ${triedModels.join(" → ")}`
    );
    this.name = "RefusalError";
    this.category = category;
    this.triedModels = triedModels;
  }
}

export function textOf(message: MessageLike): string {
  return (message.content as { type?: string; text?: string }[])
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("\n");
}

export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON 객체를 찾을 수 없음");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export interface CallOptions {
  readonly system: string;
  readonly user: string;
  readonly maxTokens: number;
  readonly effort?: Effort;
  /** 거부 시 다른 모델로 재시도할지. 기본 true */
  readonly allowFallback?: boolean;
  /** usage 로그에 찍을 라우트 이름 */
  readonly route?: string;
}

export interface CallResult<T> {
  readonly data: T;
  /** 실제로 응답한 모델 — 폴백됐다면 원래와 다르다 */
  readonly modelUsed: string;
  readonly fellBack: boolean;
}

/**
 * JSON 응답을 요구하는 호출. 거부·파싱 실패를 모두 흡수한다.
 * 끝까지 거부당하면 RefusalError를 던진다 — 호출부가 사용자에게 이유를 전할 수 있게.
 */
export async function callModelJson<T = unknown>(
  clientArg: unknown,
  model: string,
  opts: CallOptions
): Promise<CallResult<T>> {
  const client = clientArg as ClientLike;
  const tried: string[] = [];

  const attempt = async (useModel: string, extra: string): Promise<MessageLike> => {
    const resp = await client.messages.create({
      model: useModel,
      ...buildRequestParams(useModel, { maxTokens: opts.maxTokens, effort: opts.effort }),
      // 시스템 프롬프트는 재시도·폴백에서도 그대로라 캐시 접두사로 쓴다
      system: cachedSystem(opts.system),
      messages: [{ role: "user", content: opts.user + extra }],
    });
    logUsage(opts.route ?? "call", resp);
    return resp;
  };

  const STRICTER = "\n\n반드시 JSON 객체 하나만 출력하라. 코드펜스/설명 금지.";

  const runOn = async (useModel: string): Promise<CallResult<T> | "refused"> => {
    tried.push(useModel);
    // 1차 시도 → 파싱 실패 시 더 강한 지시로 2차
    for (const extra of ["", STRICTER]) {
      const resp = await attempt(useModel, extra);
      const refusal = refusalOf(resp);
      if (refusal.refused) return "refused";
      try {
        return { data: extractJson(textOf(resp)) as T, modelUsed: useModel, fellBack: tried.length > 1 };
      } catch {
        if (extra === STRICTER) throw new Error("모델이 유효한 JSON을 반환하지 않았습니다.");
      }
    }
    throw new Error("모델이 유효한 JSON을 반환하지 않았습니다.");
  };

  const first = await runOn(model);
  if (first !== "refused") return first;

  // 거부됨 — 다른 모델로 한 번 더
  const fallback = opts.allowFallback === false ? null : fallbackModelFor(model);
  if (!fallback) throw new RefusalError(undefined, tried);

  const second = await runOn(fallback);
  if (second !== "refused") return second;

  throw new RefusalError(undefined, tried);
}
