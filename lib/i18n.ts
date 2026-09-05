import en from "../messages/en.json" with { type: "json" };
import ko from "../messages/ko.json" with { type: "json" };
import zh from "../messages/zh.json" with { type: "json" };

export const LANGS = ["en", "ko", "zh"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

/** 앱 화면(/create · /explore 등)은 아직 한국어 전용이다. 다국어는 후속 웨이브(D3). */
export const APP_LANG: Lang = "ko";

export type Dictionary = {
  readonly [key: string]: string | Dictionary;
};

const DICTIONARIES = { en, ko, zh } satisfies Record<Lang, Dictionary>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function readPath(dictionary: Dictionary, key: string): unknown {
  let current: unknown = dictionary;
  for (const segment of key.split(".")) {
    if (!isRecord(current) || !(segment in current)) return undefined;
    current = current[segment];
  }
  return current;
}

export function isLang(value: unknown): value is Lang {
  return typeof value === "string" && LANGS.some((lang) => lang === value);
}

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

export function t(dictionary: Dictionary, key: string): string {
  const value = readPath(dictionary, key);
  if (typeof value === "string") return value;

  const fallback = readPath(DICTIONARIES[DEFAULT_LANG], key);
  return typeof fallback === "string" ? fallback : key;
}

type WeightedLanguage = {
  readonly range: string;
  readonly quality: number;
  readonly order: number;
};

function parseQuality(parameters: readonly string[]): number {
  const qualityParameter = parameters.find((parameter) => parameter.trim().toLowerCase().startsWith("q="));
  if (!qualityParameter) return 1;

  const rawQuality = qualityParameter.split("=")[1]?.trim();
  if (!rawQuality) return 0;
  const quality = Number(rawQuality);
  return Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0;
}

export type LangRouting =
  | { readonly kind: "pass"; readonly lang: Lang }
  | {
      readonly kind: "redirect";
      readonly pathname: string;
      readonly lang: Lang;
      /** 언어 선택을 쿠키로 남길지. /en → / 같은 단순 별칭 정리에는 남기지 않는다. */
      readonly rememberLang: boolean;
      readonly permanent: boolean;
    };

export type LangRoutingInput = {
  readonly pathname: string;
  readonly cookie?: string | null;
  readonly acceptLanguage?: string | null;
};

function langFromPathname(pathname: string): Lang {
  if (pathname === "/") return DEFAULT_LANG;
  const segment = pathname.split("/")[1];
  return isLang(segment) ? segment : APP_LANG;
}

/**
 * 랜딩 진입(`/`)의 언어 결정과, 그 밖 라우트의 <html lang> 값을 한 곳에서 정한다.
 * 미들웨어는 이 결과를 NextResponse로 옮기기만 한다.
 */
export function resolveLangRouting({ pathname, cookie, acceptLanguage }: LangRoutingInput): LangRouting {
  // /en은 스위처의 영어 선택 경로다. 여기서 쿠키를 남겨야 자바스크립트 없이도
  // 영어 선택이 유지된다(그냥 /로 보내면 자동감지가 다시 ko/zh로 끌고 간다).
  if (pathname === "/en") {
    return { kind: "redirect", pathname: "/", lang: DEFAULT_LANG, rememberLang: true, permanent: false };
  }

  if (pathname !== "/") return { kind: "pass", lang: langFromPathname(pathname) };

  // 스위처가 남긴 선택은 자동감지보다 우선한다 (계획 D2).
  // en도 명시적 선택이므로 존중한다 — 여기서 en을 흘리면 ko/zh 브라우저가 영어를 고를 수 없다.
  const chosen = isLang(cookie) ? cookie : undefined;
  const lang = chosen ?? pickLangFromAcceptLanguage(acceptLanguage ?? null);

  return lang === DEFAULT_LANG
    ? { kind: "pass", lang: DEFAULT_LANG }
    : { kind: "redirect", pathname: `/${lang}`, lang, rememberLang: true, permanent: false };
}

export function pickLangFromAcceptLanguage(header: string | null): Lang {
  if (!header?.trim()) return DEFAULT_LANG;

  const weightedLanguages: WeightedLanguage[] = header
    .split(",")
    .map((part, order) => {
      const [rawRange, ...parameters] = part.trim().split(";");
      return {
        range: rawRange?.trim().toLowerCase() ?? "",
        quality: parseQuality(parameters),
        order,
      };
    })
    .filter((language) => language.range !== "")
    .sort((left, right) => right.quality - left.quality || left.order - right.order);

  const preferred = weightedLanguages[0];
  if (!preferred || preferred.quality <= 0 || preferred.range === "*") return DEFAULT_LANG;

  const primary = preferred.range.split("-")[0];
  return primary === "ko" || primary === "zh" ? primary : DEFAULT_LANG;
}
