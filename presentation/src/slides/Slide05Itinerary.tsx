import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const days = [
  {
    day: 1,
    date: "2026-06-10 (수)",
    items: [
      { category: "관광", name: "천문산 케이블카", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
      { category: "관광", name: "유리다리 전망대", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
      { category: "식사", name: "현지 중식 (마라탕)", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
      { category: "숙박", name: "장가계 그랜드 호텔", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    ],
  },
  {
    day: 2,
    date: "2026-06-11 (목)",
    items: [
      { category: "관광", name: "원가계 핵심 트레킹", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
      { category: "식사", name: "후난 현지식", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
      { category: "숙박", name: "장가계 그랜드 호텔", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    ],
  },
];

export const Slide05Itinerary = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // 에디터 패널 등장
  const editorSpring = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const editorOpacity = interpolate(editorSpring, [0, 1], [0, 1]);
  const editorX = interpolate(editorSpring, [0, 1], [-60, 0]);

  // 각 항목 등장 타이밍
  const itemDelays = [20, 35, 50, 65, 90, 105, 120, 135];

  // 드래그 애니메이션 (4초 후)
  const dragFrame = frame - 120;
  const isDragging = dragFrame > 0 && dragFrame < 60;
  const dragY = isDragging ? interpolate(dragFrame, [0, 30, 60], [0, -80, -120], { extrapolateRight: "clamp" }) : 0;
  const dragOpacity = isDragging ? interpolate(dragFrame, [0, 10], [0, 1]) : 1;

  // + 버튼 클릭 애니메이션 (5.5초)
  const addBtnPulse = interpolate(
    frame,
    [160, 170, 180],
    [1, 1.15, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  // 새 항목 추가 (6초)
  const newItemSpring = spring({ frame: frame - 180, fps, config: { damping: 200 } });
  const newItemOpacity = interpolate(newItemSpring, [0, 1], [0, 1]);
  const newItemY = interpolate(newItemSpring, [0, 1], [-20, 0]);

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
      {/* 좌측: 제목 + 설명 */}
      <div style={{ width: 380, flexShrink: 0, paddingTop: 10 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 12, opacity: titleOpacity }}>
          일정표 에디터
        </div>
        <div style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7, opacity: titleOpacity }}>
          일차별로 항목을 자유롭게 추가하고, <br />드래그앤드롭으로 순서를 조정합니다.
        </div>

        {/* 기능 설명 박스들 */}
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "➕", label: "다중 항목 추가", desc: "같은 구분(관광) 여러 개 허용" },
            { icon: "↕️", label: "드래그 순서 조정", desc: "숙박은 항상 마지막 고정" },
            { icon: "🔍", label: "상품 검색 연동", desc: "MCP로 하나투어 상품 DB 조회" },
          ].map((feat, i) => {
            const s = spring({ frame: frame - (i * 15 + 30), fps, config: { damping: 200 } });
            return (
              <div
                key={feat.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateX(${interpolate(s, [0, 1], [-20, 0])}px)`,
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{feat.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#cbd5e1" }}>{feat.label}</div>
                  <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{feat.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측: 에디터 모의 UI */}
      <div
        style={{
          flex: 1,
          opacity: editorOpacity,
          transform: `translateX(${editorX}px)`,
        }}
      >
        <div
          style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            overflow: "hidden",
            height: "100%",
          }}
        >
          {/* 에디터 헤더 */}
          <div style={{ background: "#1e3a5f", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>🗺️ 일정표 탭</span>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ background: "#3b82f6", color: "#fff", padding: "4px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>저장</div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#1e293b" }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>단체명</div>
                <div style={{ fontSize: 14, color: "#e2e8f0", background: "#0f172a", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>청발 장가계 5일</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>여행일수</div>
                <div style={{ fontSize: 14, color: "#e2e8f0", background: "#0f172a", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>5일 4박</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>출발일</div>
                <div style={{ fontSize: 14, color: "#e2e8f0", background: "#0f172a", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>2026-06-10</div>
              </div>
            </div>
          </div>

          {/* 일차별 블록 */}
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
            {days.map((day, dayIdx) => {
              const daySpring = spring({ frame: frame - (dayIdx * 20 + 10), fps, config: { damping: 200 } });
              return (
                <div
                  key={day.day}
                  style={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    overflow: "hidden",
                    opacity: interpolate(daySpring, [0, 1], [0, 1]),
                    transform: `translateY(${interpolate(daySpring, [0, 1], [20, 0])}px)`,
                  }}
                >
                  {/* 일차 헤더 */}
                  <div style={{ background: "rgba(59,130,246,0.1)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ background: "#3b82f6", color: "#fff", padding: "2px 10px", borderRadius: 100, fontSize: 13, fontWeight: 700 }}>{day.day}일차</span>
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>{day.date}</span>
                    </div>
                    <div
                      style={{
                        background: "#3b82f6",
                        color: "#fff",
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        transform: `scale(${dayIdx === 0 ? addBtnPulse : 1})`,
                      }}
                    >
                      + 항목 추가
                    </div>
                  </div>

                  {/* 항목들 */}
                  <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {day.items.map((item, itemIdx) => {
                      const globalIdx = dayIdx * 4 + itemIdx;
                      const delay = itemDelays[Math.min(globalIdx, itemDelays.length - 1)];
                      const itemSpring = spring({ frame: frame - delay, fps, config: { damping: 200 } });
                      const isDraggingItem = dayIdx === 0 && itemIdx === 0 && isDragging;

                      return (
                        <div
                          key={item.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            background: item.bg,
                            border: `1px solid ${item.color}30`,
                            borderRadius: 8,
                            padding: "8px 12px",
                            opacity: isDraggingItem
                              ? interpolate(dragFrame, [0, 10, 50, 60], [1, 0.9, 0.9, 1])
                              : interpolate(itemSpring, [0, 1], [0, 1]),
                            transform: isDraggingItem
                              ? `translateY(${dragY}px) scale(1.02)`
                              : `translateY(${interpolate(itemSpring, [0, 1], [10, 0])}px)`,
                            boxShadow: isDraggingItem ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
                            zIndex: isDraggingItem ? 10 : "auto",
                            position: "relative",
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#475569", cursor: "grab" }}>⠿</span>
                          <span
                            style={{
                              fontSize: 11,
                              background: item.color,
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {item.category}
                          </span>
                          <span style={{ fontSize: 13, color: "#e2e8f0", flex: 1 }}>{item.name}</span>
                          <span style={{ fontSize: 11, color: "#475569" }}>✕</span>
                        </div>
                      );
                    })}

                    {/* 새 항목 추가 (day 1에만) */}
                    {dayIdx === 0 && (
                      <div
                        style={{
                          opacity: newItemOpacity,
                          transform: `translateY(${newItemY}px)`,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "rgba(34,197,94,0.08)",
                          border: "1px dashed rgba(34,197,94,0.4)",
                          borderRadius: 8,
                          padding: "8px 12px",
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#475569" }}>⠿</span>
                        <span style={{ fontSize: 11, background: "#22c55e", color: "#fff", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>관광</span>
                        <span style={{ fontSize: 13, color: "#e2e8f0" }}>국립공원 황석채 전망대</span>
                        <span style={{ fontSize: 11, color: "#22c55e", marginLeft: "auto", background: "rgba(34,197,94,0.15)", padding: "1px 6px", borderRadius: 3 }}>NEW</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
