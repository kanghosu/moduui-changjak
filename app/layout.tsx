import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모두의 영화 창작 — 시네마 스튜디오",
  description: "좋아하는 영화의 뼈대(4막·24블록)로 나만의 이야기를 만드는 창작 스튜디오",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
