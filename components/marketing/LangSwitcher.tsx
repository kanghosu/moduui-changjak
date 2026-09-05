"use client";

import { LANGS, type Dictionary, type Lang, t } from "@/lib/i18n";

type LangSwitcherProps = {
  readonly current: Lang;
  readonly dictionary: Dictionary;
};

/** 영어는 /en으로 보낸다. 미들웨어가 쿠키를 남기고 /로 정리한다. */
const PATHS: Record<Lang, string> = {
  en: "/en",
  ko: "/ko",
  zh: "/zh",
};

function rememberLanguage(lang: Lang): void {
  document.cookie = `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LangSwitcher({ current, dictionary }: LangSwitcherProps) {
  return (
    <nav aria-label="Language" className="marketing-lang-switcher flex flex-wrap items-center">
      {LANGS.map((lang) => (
        // next/link가 아니라 평범한 <a>다. Link는 쿠키를 바꾸기 전에 프리페치해 둔
        // 응답을 재생해서 방금 고른 언어를 무시한다. 언어 전환은 드문 동작이라
        // 전체 새로고침이 맞고, 그래야 서버가 <html lang>까지 다시 정한다.
        <a
          key={lang}
          href={PATHS[lang]}
          hrefLang={lang}
          aria-current={current === lang ? "page" : undefined}
          onClick={() => rememberLanguage(lang)}
          className={`marketing-lang-link rounded-ds-full border px-ds-3 py-ds-2 transition-colors duration-micro ${
            current === lang
              ? "border-mk-stage-accent bg-mk-stage-accent/10 text-mk-stage-accent"
              : "border-mk-stage-sub text-mk-stage-sub hover:border-mk-stage-text hover:text-mk-stage-text"
          }`}
        >
          {t(dictionary, `lang.${lang}`)}
        </a>
      ))}
    </nav>
  );
}
