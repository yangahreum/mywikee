import type { Metadata } from "next";
import "pretendard/dist/web/static/pretendard.css";

export const metadata: Metadata = {
  title: "wiki — source editor",
  description: "LLM-Wiki source 문서 편집기",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#111315",
          background: "#ffffff",
        }}
      >
        {children}
      </body>
    </html>
  );
}
