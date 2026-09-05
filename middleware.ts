import { NextRequest, NextResponse } from "next/server";
import { resolveLangRouting, type Lang } from "@/lib/i18n";

export const config = {
  // 정적 자산·API를 뺀 모든 페이지. 랜딩(/ · /en)만 리다이렉트하고,
  // 나머지 라우트는 <html lang>을 서버에서 정하도록 x-lang 헤더만 붙인다.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

const LANG_COOKIE = "lang";
const COOKIE_MAX_AGE = 31_536_000;

function withLangHeader(request: NextRequest, lang: Lang): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-lang", lang);
  return NextResponse.next({ request: { headers } });
}

export function middleware(request: NextRequest): NextResponse {
  const routing = resolveLangRouting({
    pathname: request.nextUrl.pathname,
    cookie: request.cookies.get(LANG_COOKIE)?.value ?? null,
    acceptLanguage: request.headers.get("accept-language"),
  });

  if (routing.kind === "pass") return withLangHeader(request, routing.lang);

  const url = request.nextUrl.clone();
  url.pathname = routing.pathname;
  const response = NextResponse.redirect(url, routing.permanent ? 308 : 307);
  if (routing.rememberLang) {
    response.cookies.set(LANG_COOKIE, routing.lang, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  return response;
}
