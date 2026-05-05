import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const roles = [
  {
    key: "partner",
    label: "협력사",
    english: "Partner",
    icon: "🤝",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.3)",
    tasks: ["비딩 코드로 견적 접근", "일정표·비용 직접 입력", "빠른 비딩 제출"],
    hidden: ["항공 조회 불가"],
  },
  {
    key: "agent",
    label: "견적 담당자",
    english: "Agent",
    icon: "📋",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.3)",
    tasks: ["비딩 비교 및 취합", "원가 검토", "항공 요금 조회"],
    hidden: [],
    featured: true,
  },
  {
    key: "sales",
    label: "영업 담당자",
    english: "Sales",
    icon: "💼",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
    tasks: ["최종 일정·마진 조정", "가격 표시 방식 선택", "처리상태 기반 조건부 수정"],
    hidden: ["배정된 견적만 접근 가능"],
  },
];

export const Slide04Roles = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        padding: "60px 120px",
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 46,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 10,
          opacity: titleOpacity,
        }}
      >
        3가지 사용자 역할
      </div>
      <div style={{ fontSize: 18, color: "#64748b", marginBottom: 50, opacity: titleOpacity }}>
        역할마다 접근 권한과 UI가 서버에서 자동 분기됩니다
      </div>

      <div style={{ display: "flex", gap: 32, flex: 1 }}>
        {roles.map((role, i) => {
          const cardSpring = spring({ frame: frame - (i * 15 + 10), fps, config: { damping: 200 } });
          const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const y = interpolate(cardSpring, [0, 1], [40, 0]);

          return (
            <div
              key={role.key}
              style={{
                flex: 1,
                background: role.bg,
                border: `2px solid ${role.featured ? role.color : role.border}`,
                borderRadius: 20,
                padding: "36px 32px",
                opacity,
                transform: `translateY(${y}px)`,
                position: "relative",
                boxShadow: role.featured ? `0 0 40px ${role.bg}` : "none",
              }}
            >
              {role.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: role.color,
                    color: "#fff",
                    fontSize: 12,
                    padding: "4px 16px",
                    borderRadius: 100,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  전체 기능 접근
                </div>
              )}

              <div style={{ fontSize: 48, marginBottom: 16 }}>{role.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{role.label}</div>
              <div style={{ fontSize: 15, color: role.color, marginBottom: 28, fontWeight: 600 }}>{role.english}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {role.tasks.map((task) => (
                  <div key={task} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: role.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, color: "#cbd5e1" }}>{task}</span>
                  </div>
                ))}
              </div>

              {role.hidden.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  {role.hidden.map((h) => (
                    <div key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, color: "#475569" }}>🚫 {h}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 URL 설명 */}
      <div
        style={{
          marginTop: 32,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8,
          padding: "12px 20px",
          fontFamily: "monospace",
          fontSize: 15,
          color: "#64748b",
          opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        /editor/popup?quoteNo=<span style={{ color: "#f59e0b" }}>QC00687628001</span>&role=<span style={{ color: "#22c55e" }}>agent</span>
      </div>
    </AbsoluteFill>
  );
};
