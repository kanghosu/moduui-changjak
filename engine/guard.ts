export interface CounterStore {
  incr(key: string, ttlSeconds: number): Promise<number>;
  readonly kind: "kv" | "memory";
}

export interface GuardConfig {
  readonly rpm: number;
  readonly daily: number;
  readonly maxInput: number;
  readonly disabled: boolean;
}

export type GuardResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly status: number; readonly message: string };

export interface GuardCheckOptions {
  /** 초기 요청 검사에서는 false로 두고, 실제 모델 호출 직전에 checkDailyGuard를 호출한다. */
  readonly consumeDaily?: boolean;
}

const DEFAULTS = {
  rpm: 6,
  daily: 300,
  maxInput: 4000,
} as const;

const RATE_TTL_SECONDS = 60;
const DAILY_TTL_SECONDS = 86_400;

type GuardEnv = Readonly<Record<string, string | undefined>>;
type CounterEntry = { readonly count: number; readonly expiresAt: number };

// 이 메모리 카운터는 서버리스 인스턴스마다 따로 유지되는 best-effort다.
// KV를 연결하지 않으면 인스턴스 간 공유가 없어 공개 배포의 완전한 보호가 아니다.
const memoryCounters = new Map<string, CounterEntry>();

const memoryStore: CounterStore = {
  kind: "memory",
  async incr(key, ttlSeconds) {
    const now = Date.now();
    const previous = memoryCounters.get(key);
    const count = previous && previous.expiresAt > now ? previous.count + 1 : 1;
    memoryCounters.set(key, { count, expiresAt: now + ttlSeconds * 1000 });
    return count;
  },
};

class CounterStoreError extends Error {
  readonly name = "CounterStoreError";
  readonly operation: "incr" | "expire";
  readonly status: number;

  constructor(operation: "incr" | "expire", status: number) {
    super(`가드 카운터 ${operation} 요청이 실패했습니다 (${status}).`);
    this.operation = operation;
    this.status = status;
  }
}

function parseCounterValue(payload: unknown): number {
  if (typeof payload === "number" && Number.isFinite(payload)) return payload;
  if (typeof payload === "string" && payload.trim() !== "") {
    const parsed = Number(payload);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof payload === "object" && payload !== null && "result" in payload) {
    return parseCounterValue(payload.result);
  }
  throw new CounterStoreError("incr", 502);
}

class KvCounterStore implements CounterStore {
  readonly kind = "kv" as const;
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const encodedKey = encodeURIComponent(key);
    const increment = await fetch(`${this.baseUrl}/incr/${encodedKey}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!increment.ok) throw new CounterStoreError("incr", increment.status);
    const payload: unknown = await increment.json();

    const expire = await fetch(`${this.baseUrl}/expire/${encodedKey}/${ttlSeconds}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!expire.ok) throw new CounterStoreError("expire", expire.status);
    return parseCounterValue(payload);
  }
}

function nonNegativeInteger(raw: string | undefined, fallback: number): number {
  if (!raw || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

export function guardConfig(env: GuardEnv): GuardConfig {
  return {
    rpm: nonNegativeInteger(env.GUARD_RPM, DEFAULTS.rpm),
    daily: nonNegativeInteger(env.GUARD_DAILY, DEFAULTS.daily),
    maxInput: nonNegativeInteger(env.GUARD_MAX_INPUT, DEFAULTS.maxInput),
    disabled: env.GUARD_DISABLED === "1",
  };
}

export function tooLong(text: string, max: number): boolean {
  return text.length > max;
}

export function limitDecision(input: {
  readonly perIpCount: number;
  readonly dailyCount: number;
  readonly config: GuardConfig;
}): { readonly allowed: boolean; readonly reason?: "rate" | "daily" } {
  if (input.config.disabled) return { allowed: true };
  if (input.perIpCount > input.config.rpm) return { allowed: false, reason: "rate" };
  if (input.dailyCount > input.config.daily) return { allowed: false, reason: "daily" };
  return { allowed: true };
}

export function createCounterStore(env: GuardEnv = process.env): CounterStore {
  const url = env.KV_REST_API_URL?.trim().replace(/\/+$/, "");
  const token = env.KV_REST_API_TOKEN?.trim();
  return url && token ? new KvCounterStore(url, token) : memoryStore;
}

function clientIp(req: Pick<Request, "headers">): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

function dailyKey(): string {
  return `guard:daily:${new Date().toISOString().slice(0, 10)}`;
}

function rateKey(ip: string): string {
  return `guard:rate:${ip}`;
}

function denial(reason: "rate" | "daily"): GuardResult {
  if (reason === "rate") return { ok: false, status: 429, message: "잠시 후 다시 시도해 주세요." };
  return {
    ok: false,
    status: 429,
    message: "오늘 사용량이 가득 찼어요. 내일 다시 열립니다.",
  };
}

export async function checkGuard(
  req: Pick<Request, "headers">,
  textLength: number,
  options: GuardCheckOptions = {},
): Promise<GuardResult> {
  const config = guardConfig(process.env);
  if (config.disabled) return { ok: true };
  if (textLength > config.maxInput) {
    return {
      ok: false,
      status: 400,
      message: `입력이 너무 길어요. ${config.maxInput}자 이내로 줄여주세요.`,
    };
  }

  const store = createCounterStore();
  const perIpCount = await store.incr(rateKey(clientIp(req)), RATE_TTL_SECONDS);
  const dailyCount = options.consumeDaily === false
    ? 0
    : await store.incr(dailyKey(), DAILY_TTL_SECONDS);
  const decision = limitDecision({ perIpCount, dailyCount, config });
  if (!decision.allowed && decision.reason) return denial(decision.reason);
  return { ok: true };
}

/** 모델을 호출하는 순간에만 일일 카운터를 증가시킨다. mock/휴리스틱 경로는 호출하지 않는다. */
export async function checkDailyGuard(_req: Pick<Request, "headers">): Promise<GuardResult> {
  const config = guardConfig(process.env);
  if (config.disabled) return { ok: true };
  const store = createCounterStore();
  const dailyCount = await store.incr(dailyKey(), DAILY_TTL_SECONDS);
  const decision = limitDecision({ perIpCount: 0, dailyCount, config });
  if (!decision.allowed && decision.reason === "daily") return denial("daily");
  return { ok: true };
}
