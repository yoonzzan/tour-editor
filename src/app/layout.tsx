import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "하나투어 견적·일정 에디터",
  description: "협력사·견적·영업 담당자를 위한 통합 에디터",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
