import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { getDictionary, isLang, type Lang, t } from "@/lib/i18n";

type LocalizedPageProps = {
  readonly params: {
    readonly lang: string;
  };
};

const OPEN_GRAPH_LOCALES: Record<Lang, string> = {
  en: "en_US",
  ko: "ko_KR",
  zh: "zh_CN",
};

const SITE_PATHS: Record<Lang, string> = {
  en: "/",
  ko: "/ko",
  zh: "/zh",
};

function resolveLang(value: string): Lang {
  if (value === "en") redirect("/");
  if (!isLang(value)) notFound();
  return value;
}

function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://modustory.com");
}

function absolutePath(lang: Lang): string {
  return new URL(SITE_PATHS[lang], siteUrl()).toString();
}

function metadataFor(lang: Lang): Metadata {
  const dictionary = getDictionary(lang);
  const title = `${t(dictionary, "brand")} — ${t(dictionary, "hero.h").replace("\n", " ")}`;
  const description = t(dictionary, "hero.p").replace("\n", " ");

  return {
    metadataBase: siteUrl(),
    title,
    description,
    openGraph: {
      title,
      description,
      locale: OPEN_GRAPH_LOCALES[lang],
      type: "website",
      url: absolutePath(lang),
    },
    alternates: {
      languages: {
        en: absolutePath("en"),
        ko: absolutePath("ko"),
        zh: absolutePath("zh"),
        "x-default": absolutePath("en"),
      },
    },
  };
}

export function generateStaticParams(): Array<{ readonly lang: "ko" | "zh" }> {
  return [{ lang: "ko" }, { lang: "zh" }];
}

export function generateMetadata({ params }: LocalizedPageProps): Metadata {
  return metadataFor(resolveLang(params.lang));
}

export default function LocalizedHomePage({ params }: LocalizedPageProps) {
  const lang = resolveLang(params.lang);
  // <html lang>은 미들웨어의 x-lang을 읽는 루트 레이아웃이 서버에서 정한다.
  return <LandingPage lang={lang} dictionary={getDictionary(lang)} />;
}
