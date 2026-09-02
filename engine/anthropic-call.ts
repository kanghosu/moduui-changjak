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
}
/** SDK 클라이언트. 버전마다 create()의 오버로드가 달라 정확히 맞추기 어려우므로
 *  경계에서 한 번만 좁힌다. 이 캐스트가 SDK 버전 종속을 여기 한 곳에 가둔다. */
type ClientLike = {
  messages: { create(body: Record<string, unknown>): Promise<MessageLike> };
};

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
    return client.messages.create({
      model: useModel,
      ...buildRequestParams(useModel, { maxTokens: opts.maxTokens, effort: opts.effort }),
      system: opts.system,
      messages: [{ role: "user", content: opts.user + extra }],
    });
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
