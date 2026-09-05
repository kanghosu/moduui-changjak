import type { Metadata } from "next";
import { headers } from "next/headers";
import { isLang, type Lang } from "@/lib/i18n";
import { pretendard } from "./fonts";
import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://modustory.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Modu Story — Talk, and it becomes a story.",
  description: "Say your idea out loud. We shape it into a four-act, 24-block story map, and leave the hook to you.",
  openGraph: {
    title: "Modu Story — Talk, and it becomes a story.",
    description: "Say your idea out loud. We shape it into a four-act, 24-block story map, and leave the hook to you.",
    locale: "en_US",
    type: "website",
    url: siteUrl.toString(),
  },
  alternates: {
    languages: {
      en: new URL("/", siteUrl).toString(),
      ko: new URL("/ko", siteUrl).toString(),
      zh: new URL("/zh", siteUrl).toString(),
      "x-default": new URL("/", siteUrl).toString(),
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 미들웨어가 경로에서 정해 준 언어를 쓴다. 쿠키를 쓰면 /ko를 직접 연 방문자에게
  // lang="en"이 나가고, 한국어 전용인 앱 화면도 랜딩 쿠키를 따라가 버린다.
  // 헤더가 없는 경우(미들웨어 미적용)는 한국어 앱 화면이므로 ko로 떨어뜨린다.
  const headerLang = headers().get("x-lang");
  const htmlLang: Lang = isLang(headerLang) ? headerLang : "ko";

  return (
    <html lang={htmlLang} data-mode="light">
      <body className={pretendard.variable}>{children}</body>
    </html>
  );
}
