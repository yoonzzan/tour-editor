import type { CSSProperties, ReactNode } from "react";

interface MockBrowserProps {
  url?: string;
  children: ReactNode;
  style?: CSSProperties;
  scale?: number;
}

export const MockBrowser = ({ url = "hanatour.com/editor/popup", children, style, scale = 1 }: MockBrowserProps) => (
  <div
    style={{
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.12)",
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      ...style,
    }}
  >
    {/* 브라우저 상단 바 */}
    <div
      style={{
        background: "#1e293b",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
      </div>
      <div
        style={{
          flex: 1,
          background: "#0f172a",
          borderRadius: 6,
          padding: "4px 12px",
          fontSize: 12,
          color: "#64748b",
          marginLeft: 8,
        }}
      >
        🔒 {url}
      </div>
    </div>
    {/* 콘텐츠 */}
    <div style={{ background: "#fff" }}>{children}</div>
  </div>
);

interface MockPopupProps {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export const MockPopup = ({ title = "견적 에디터", children, style }: MockPopupProps) => (
  <div
    style={{
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      border: "1px solid rgba(255,255,255,0.15)",
      width: 920,
      ...style,
    }}
  >
    {/* 팝업 헤더 */}
    <div
      style={{
        background: "#1e3a5f",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>🗺️ 하나투어 견적 에디터</div>
        <div style={{ fontSize: 13, color: "#94a3b8", background: "rgba(255,255,255,0.08)", padding: "2px 10px", borderRadius: 4 }}>
          QC00687628001 · 청발 장가계 5일
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <MockButton color="#3b82f6">저장</MockButton>
        <MockButton color="#475569">미리보기</MockButton>
        <MockButton color="#475569">Excel ▼</MockButton>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16, cursor: "pointer" }}>×</div>
      </div>
    </div>
    {/* 탭 */}
    <div style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex" }}>
      <MockTab active>일정표</MockTab>
      <MockTab>견적서</MockTab>
    </div>
    {/* 본문 */}
    <div style={{ background: "#f8fafc", minHeight: 400 }}>{children}</div>
  </div>
);

const MockButton = ({ children, color }: { children: ReactNode; color: string }) => (
  <div
    style={{
      background: color,
      color: "#fff",
      fontSize: 13,
      padding: "5px 14px",
      borderRadius: 6,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

const MockTab = ({ children, active }: { children: ReactNode; active?: boolean }) => (
  <div
    style={{
      padding: "10px 24px",
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? "#1e3a5f" : "#64748b",
      borderBottom: active ? "2px solid #1e3a5f" : "2px solid transparent",
      cursor: "pointer",
    }}
  >
    {children}
  </div>
);
