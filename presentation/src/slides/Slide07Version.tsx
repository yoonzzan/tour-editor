import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const versions = [
  {
    ver: "v1.0",
    date: "2026-06-08 14:23",
    author: "하나투어 (협력사)",
    role: "partner",
    color: "#8b5cf6",
    changes: ["1~5일차 일정 초안", "호텔 3개소 단가 입력", "초기 견적 제출"],
    active: false,
  },
  {
    ver: "v1.1",
    date: "2026-06-09 09:41",
    author: "김담당 (견적팀)",
    role: "agent",
    color: "#3b82f6",
    changes: ["항공료 업데이트", "수수료율 12% → 10% 조정", "현지 가이드 비용 추가"],
    active: false,
  },
  {
    ver: "v1.2",
    date: "2026-06-09 16:05",
    author: "이영업 (영업팀)",
    role: "sales",
    color: "#22c55e",
    changes: ["가격 표시 방식: 총액 표시로 변경", "3일차 관광 1개 추가", "최종 승인"],
    active: true,
  },
];

const roleLabel: Record<string, string> = {
  partner: "협력사",
  agent: "견적담당",
  sales: "영업담당",
};

export const Slide07Version = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // diff 패널 등장
  const diffSpring = spring({ frame: frame - 80, fps, config: { damping: 200 } });
  const diffOpacity = interpolate(diffSpring, [0, 1], [0, 1]);
  const diffY = interpolate(diffSpring, [0, 1], [30, 0]);

  // 새 버전 생성 애니메이션 (4초 후)
  const newVerFrame = frame - 120;
  const newVerSpring = spring({ frame: newVerFrame, fps, config: { damping: 200 } });
  const newVerOpacity = interpolate(newVerSpring, [0, 1], [0, 1]);
  const newVerY = interpolate(newVerSpring, [0, 1], [-20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#0f172a",
        display: "flex",
        padding: "50px 80px",
        gap: 48,
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      {/* 좌측 */}
      <div style={{ width: 360, flexShrink: 0, paddingTop: 10 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 12, opacity: titleOpacity }}>
          버전 히스토리
        </div>
        <div style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, opacity: titleOpacity }}>
          모든 수정은 새 버전을 생성합니다.<br />기존 버전은 절대 덮어쓰지 않습니다.
        </div>

        {/* 룰 박스 */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "🔒", label: "불변 버전", desc: "v1.0 → v1.1 → v1.2 채번. 되돌리기 불가" },
            { icon: "👁️", label: "Diff 비교", desc: "버전 간 변경 항목 한눈에 확인" },
            { icon: "📜", label: "작성자 추적", desc: "역할·작성자·타임스탬프 전체 기록" },
          ].map((feat, i) => {
            const s = spring({ frame: frame - (i * 15 + 25), fps, config: { damping: 200 } });
            return (
              <div
                key={feat.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateX(${interpolate(s, [0, 1], [-20, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{feat.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1" }}>{feat.label}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{feat.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측: 버전 목록 + diff */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 버전 카드들 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {versions.map((v, i) => {
            const cardSpring = spring({ frame: frame - (i * 20 + 10), fps, config: { damping: 200 } });
            return (
              <div
                key={v.ver}
                style={{
                  background: v.active ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                  border: v.active ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  opacity: interpolate(cardSpring, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(cardSpring, [0, 1], [20, 0])}px)`,
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: v.color,
                        fontFamily: "monospace",
                        background: `${v.color}20`,
                        padding: "3px 10px",
                        borderRadius: 6,
                      }}
                    >
                      {v.ver}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        background: `${v.color}30`,
                        color: v.color,
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {roleLabel[v.role]}
                    </span>
                    {v.active && (
                      <span style={{ fontSize: 11, background: "#22c55e", color: "#fff", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                        최신
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                    {v.author} · {v.date}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {v.changes.map((c) => (
                    <span key={c} style={{ fontSize: 11, color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* 새 버전 생성 중 */}
          {newVerFrame >= 0 && (
            <div
              style={{
                opacity: newVerOpacity,
                transform: `translateY(${newVerY}px)`,
                background: "rgba(59,130,246,0.08)",
                border: "1px dashed rgba(59,130,246,0.4)",
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: "#3b82f6", fontFamily: "monospace", background: "rgba(59,130,246,0.15)", padding: "3px 10px", borderRadius: 6 }}>v1.3</span>
              <span style={{ fontSize: 12, color: "#3b82f6" }}>작성 중 — 저장 시 자동 채번</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>이영업 (영업팀)</span>
            </div>
          )}
        </div>

        {/* Diff 비교 패널 */}
        <div
          style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            overflow: "hidden",
            opacity: diffOpacity,
            transform: `translateY(${diffY}px)`,
          }}
        >
          <div style={{ background: "#0f172a", padding: "8px 16px", display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Diff 비교</span>
            <span style={{ fontSize: 12, color: "#8b5cf6", fontFamily: "monospace", background: "rgba(139,92,246,0.1)", padding: "2px 8px", borderRadius: 4 }}>v1.0</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>→</span>
            <span style={{ fontSize: 12, color: "#22c55e", fontFamily: "monospace", background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: 4 }}>v1.2</span>
          </div>
          <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { type: "add", text: "+ 3일차 관광 — 국립공원 황석채 전망대" },
              { type: "add", text: "+ 가이드 비용 40,000원 × 5일 추가" },
              { type: "change", text: "~ 항공료 380,000 → 420,000원 (업데이트)" },
              { type: "change", text: "~ 수수료율 12% → 10% (조정)" },
              { type: "change", text: "~ 가격 표시: 상세 → 총액 (영업 결정)" },
            ].map((diff, di) => {
              const ds = spring({ frame: frame - (di * 8 + 85), fps, config: { damping: 200 } });
              return (
                <div
                  key={diff.text}
                  style={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: diff.type === "add" ? "#4ade80" : "#fbbf24",
                    background: diff.type === "add" ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)",
                    padding: "4px 10px",
                    borderRadius: 4,
                    opacity: interpolate(ds, [0, 1], [0, 1]),
                  }}
                >
                  {diff.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
