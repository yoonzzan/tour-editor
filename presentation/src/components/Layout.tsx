import { AbsoluteFill } from "remotion";
import type { ReactNode } from "react";

interface LayoutProps {
  bg?: string;
  children: ReactNode;
}

export const SlideLayout = ({ bg = "#0f172a", children }: LayoutProps) => (
  <AbsoluteFill style={{ background: bg, fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif" }}>
    {children}
  </AbsoluteFill>
);

export const GradientLayout = ({ children }: { children: ReactNode }) => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
    }}
  >
    {children}
  </AbsoluteFill>
);

export const LightLayout = ({ children }: { children: ReactNode }) => (
  <AbsoluteFill
    style={{
      background: "#f8fafc",
      fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
    }}
  >
    {children}
  </AbsoluteFill>
);
