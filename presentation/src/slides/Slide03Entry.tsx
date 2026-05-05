import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Slide03Entry = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // 기존 시스템 화면 등장
  const existingScale = spring({ frame, fps, config: { damping: 200 } });

  // 클릭 표시 (2초 후)
  const clickOpacity = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" });

  // 팝업 등장 (2.5초 후)
  const popupY = interpolate(frame, [70, 100], [80, 0], { extrapolateRight: "clamp" });
  const popupOpacity = interpolate(frame, [70, 100], [0, 1], { extrapolateRight: "clamp" });

  // postMessage 화살표
  const arrowOpacity = interpolate(frame, [115, 130], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        padding: "50px 100px",
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 8,
          opacity: titleOpacity,
        }}
      >
        에디터 진입 방식
      </div>
      <div style={{ fontSize: 18, color: "#64748b", marginBottom: 40, opacity: titleOpacity }}>
        독립 앱이 아닌 — 기존 하나투어 시스템에서 팝업으로 실행
      </div>

      <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flex: 1 }}>
        {/* 기존 시스템 화면 */}
        <div
          style={{
            flex: 1,
            transform: `scale(${existingScale})`,
            transformOrigin: "top left",
          }}
        >
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            기존 하나투어 시스템
          </div>
          <div
            style={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>견적서 상세 화면</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>QC00687628001</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>청발 장가계 5일 · 작성자: 조유미</div>
              </div>
            </div>
            {[
              { label: "상품코드", value: "PKG-ZJJ-5D" },
              { label: "여행기간", value: "2026-06-10 ~ 06-14" },
              { label: "인원", value: "성인 2명 / 아동 1명" },
              { label: "담당 세일즈", value: "한상일 팀장" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 24 }}>
                <span style={{ fontSize: 13, color: "#64748b", width: 90, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: "#cbd5e1" }}>{row.value}</span>
              </div>
            ))}
            {/* 에디터 열기 버튼 */}
            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  background: "#3b82f6",
                  color: "#fff",
                  padding: "10px 24px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  position: "relative",
                  boxShadow: "0 0 20px rgba(59,130,246,0.4)",
                }}
              >
                📝 에디터 열기
                {/* 클릭 커서 */}
                <div
                  style={{
                    position: "absolute",
                    right: -20,
                    bottom: -20,
                    fontSize: 28,
                    opacity: clickOpacity,
                    transform: "rotate(-20deg)",
                  }}
                >
                  👆
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 화살표 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 80,
            gap: 8,
            opacity: clickOpacity,
          }}
        >
          <div style={{ fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>window.open()</div>
          <div style={{ fontSize: 36, color: "#3b82f6" }}>→</div>
        </div>

        {/* 팝업 에디터 */}
        <div
          style={{
            flex: 1.2,
            opacity: popupOpacity,
            transform: `translateY(${popupY}px)`,
          }}
        >
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            견적 에디터 팝업
          </div>
          <div
            style={{
              border: "2px solid #3b82f6",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 0 40px rgba(59,130,246,0.25)",
            }}
          >
            {/* 팝업 헤더 */}
            <div style={{ background: "#1e3a5f", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>🗺️ 하나투어 견적 에디터</span>
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", color: "#94a3b8", padding: "2px 8px", borderRadius: 4 }}>v1.0</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["저장", "미리보기", "Excel▼"].map((b) => (
                  <div key={b} style={{ background: b === "저장" ? "#3b82f6" : "rgba(255,255,255,0.1)", color: "#fff", padding: "4px 12px", borderRadius: 5, fontSize: 12, fontWeight: 600 }}>
                    {b}
                  </div>
                ))}
              </div>
            </div>
            {/* 탭 */}
            <div style={{ background: "#f1f5f9", display: "flex", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, color: "#1e3a5f", borderBottom: "2px solid #1e3a5f" }}>일정표</div>
              <div style={{ padding: "8px 20px", fontSize: 13, color: "#64748b" }}>견적서</div>
            </div>
            {/* 콘텐츠 */}
            <div style={{ background: "#f8fafc", padding: 20, minHeight: 160 }}>
              <div style={{ background: "#fff", borderRadius: 8, padding: 16, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>1일차 · 2026-06-10 (수)</div>
                {["관광 — 천문산 케이블카", "식사 — 현지 중식당", "호텔 — 장가계 그랜드"].map((item) => (
                  <div key={item} style={{ fontSize: 12, color: "#334155", padding: "6px 10px", background: "#f8fafc", borderRadius: 5, marginBottom: 4 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* postMessage 표시 */}
          <div
            style={{
              marginTop: 12,
              opacity: arrowOpacity,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#22c55e",
              fontFamily: "monospace",
            }}
          >
            <span>↑ 저장 완료 시</span>
            <span style={{ background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: 4 }}>
              postMessage → 부모 창 새로고침
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
