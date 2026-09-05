import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveLangRouting } from "../lib/i18n.ts";

test("스위처로 고른 영어는 한국어 브라우저에서도 유지된다", () => {
  // Given: 브라우저는 한국어인데 사용자가 스위처로 English를 골라 쿠키가 en이다
  const input = { pathname: "/", cookie: "en", acceptLanguage: "ko-KR,ko;q=0.9" };

  // When: 랜딩 진입 경로를 결정한다
  const routing = resolveLangRouting(input);

  // Then: /ko로 튕기지 않고 영어 랜딩을 그대로 보여준다
  assert.deepEqual(routing, { kind: "pass", lang: "en" });
});

test("쿠키가 없으면 브라우저 언어로 보내고 그 선택을 기억한다", () => {
  // Given: 쿠키 없이 들어온 한국어·중국어 브라우저
  const cases = [
    ["ko-KR,ko;q=0.9", "/ko", "ko"],
    ["zh-CN,zh;q=0.9", "/zh", "zh"],
  ] as const;

  // When: 각각의 랜딩 진입 경로를 결정한다
  const actual = cases.map(([header]) => resolveLangRouting({ pathname: "/", cookie: null, acceptLanguage: header }));

  // Then: 해당 언어로 임시 리다이렉트하고 쿠키를 남긴다
  assert.deepEqual(
    actual,
    cases.map(([, pathname, lang]) => ({ kind: "redirect", pathname, lang, rememberLang: true, permanent: false })),
  );
});

test("쿠키가 브라우저 언어를 이긴다", () => {
  // Given: 영어 브라우저인데 쿠키에는 한국어 선택이 남아 있다
  const input = { pathname: "/", cookie: "ko", acceptLanguage: "en-US,en;q=0.9" };

  // When: 랜딩 진입 경로를 결정한다
  const routing = resolveLangRouting(input);

  // Then: 쿠키의 선택을 따른다
  assert.deepEqual(routing, { kind: "redirect", pathname: "/ko", lang: "ko", rememberLang: true, permanent: false });
});

test("망가진 쿠키는 무시하고 브라우저 언어로 떨어진다", () => {
  // Given: 지원하지 않는 값이 쿠키에 들어 있다
  const input = { pathname: "/", cookie: "fr", acceptLanguage: "ko-KR" };

  // When: 랜딩 진입 경로를 결정한다
  const routing = resolveLangRouting(input);

  // Then: 쿠키를 버리고 자동감지 결과를 쓴다
  assert.equal(routing.kind, "redirect");
  assert.equal(routing.lang, "ko");
});

test("/en은 영어 선택을 쿠키로 남기며 /로 보낸다", () => {
  // Given: 한국어 브라우저가 스위처의 영어 경로로 들어왔다
  const input = { pathname: "/en", cookie: null, acceptLanguage: "ko-KR" };

  // When: 진입 경로를 결정한다
  const routing = resolveLangRouting(input);

  // Then: /로 보내되 선택을 기억한다 — 기억하지 않으면 자동감지가 다시 /ko로 끌고 간다
  assert.deepEqual(routing, {
    kind: "redirect",
    pathname: "/",
    lang: "en",
    rememberLang: true,
    permanent: false,
  });
});

test("/en으로 남긴 쿠키가 있으면 한국어 브라우저도 영어에 머문다", () => {
  // Given: /en을 거쳐 lang=en 쿠키가 생긴 한국어 브라우저가 /를 다시 연다
  const afterSwitch = resolveLangRouting({ pathname: "/en", cookie: null, acceptLanguage: "ko-KR" });
  assert.equal(afterSwitch.kind, "redirect");

  // When: 그 쿠키를 들고 랜딩으로 돌아온다
  const routing = resolveLangRouting({
    pathname: afterSwitch.pathname,
    cookie: afterSwitch.lang,
    acceptLanguage: "ko-KR",
  });

  // Then: 영어에 머문다
  assert.deepEqual(routing, { kind: "pass", lang: "en" });
});

test("한국어 전용 앱 화면은 리다이렉트 없이 ko로 선언된다", () => {
  // Given: 앱 화면들과 언어 세그먼트를 가진 랜딩 경로들
  const cases = [
    ["/create", "ko"],
    ["/explore", "ko"],
    ["/library", "ko"],
    ["/movie/기생충", "ko"],
    ["/ko", "ko"],
    ["/zh", "zh"],
  ] as const;

  // When: 각 경로의 라우팅을 결정한다
  const actual = cases.map(([pathname]) => resolveLangRouting({ pathname, cookie: "zh", acceptLanguage: "en-US" }));

  // Then: 랜딩 쿠키와 무관하게 경로가 언어를 정하고, 앱 화면은 한국어로 남는다
  assert.deepEqual(actual, cases.map(([, lang]) => ({ kind: "pass", lang })));
});
