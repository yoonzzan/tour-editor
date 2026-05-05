import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const categories = [
  { label: "항공", color: "#3b82f6", unit: 420000, count: 3, icon: "✈️" },
  { label: "호텔", color: "#a78bfa", unit: 180000, count: 4, icon: "🏨" },
  { label: "관광", color: "#22c55e", unit: 35000, count: 6, icon: "🗺️" },
  { label: "식사", color: "#f59e0b", unit: 28000, count: 8, icon: "🍽️" },
  { label: "차량", color: "#06b6d4", unit: 55000, count: 5, icon: "🚌" },
  { label: "가이드", color: "#ec4899", unit: 40000, count: 5, icon: "👤" },
];

const formatKRW = (n: number) =>
  n.toLocaleString("ko-KR") + "원";

export const Slide06Quote = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // 좌측 패널
  const leftSpring = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const leftOpacity = interpolate(leftSpring, [0, 1], [0, 1]);
  const leftX = interpolate(leftSpring, [0, 1], [-60, 0]);

  // 단가 입력 애니메이션 — 2초(60f)부터
  const inputFrame = frame - 60;
  const isTyping = inputFrame >= 0 && inputFrame < 40;
  const typedValue = isTyping
    ? Math.floor(interpolate(inputFrame, [0, 40], [0, 420000]))
    : inputFrame >= 0 ? 420000 : 0;

  // 금액 자동 계산 (카테고리별 순차)
  const totalVisible = Math.max(0, Math.floor((frame - 80) / 15));

  // 합계 등장
  const summarySpring = spring({ frame: frame - 175, fps, config: { damping: 200 } });

  // 환율 표시
  const rateOpacity = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" });

  const grandTotal = categories.reduce((s, c) => s + c.unit * c.count, 0);
  const commission = Math.floor(grandTotal * 0.1);
  const vat = Math.floor(commission * 0.1);
  const total = grandTotal + commission + vat;

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
      {/* 좌측: 설명 */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          paddingTop: 10,
          opacity: leftOpacity,
          transform: `translateX(${leftX}px)`,
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 12, opacity: titleOpacity }}>
          견적서 자동 계산
        </div>
        <div style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, opacity: titleOpacity }}>
          일정표 항목에서 구분·수량이 자동 생성되고,<br />단가를 입력하면 합계가 즉시 계산됩니다.
        </div>

        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "⚡", label: "자동 항목 생성", desc: "일정표 → 견적 구분 자동 매핑" },
            { icon: "💱", label: "환율 연동", desc: "USD/CNY 실시간 환율 적용" },
            { icon: "📊", label: "원가 계산", desc: "수수료·VAT 자동 가산" },
          ].map((feat, i) => {
            const s = spring({ frame: frame - (i * 15 + 30), fps, config: { damping: 200 } });
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

        {/* 환율 */}
        <div
          style={{
            marginTop: 28,
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            opacity: rateOpacity,
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>현재 적용 환율</div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ fontSize: 14, color: "#93c5fd" }}>USD <span style={{ color: "#fff", fontWeight: 700 }}>1,340원</span></div>
            <div style={{ fontSize: 14, color: "#93c5fd" }}>CNY <span style={{ color: "#fff", fontWeight: 700 }}>184원</span></div>
          </div>
        </div>
      </div>

      {/* 우측: 견적서 모의 UI */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div
          style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            overflow: "hidden",
            flex: 1,
          }}
        >
          {/* 헤더 */}
          <div style={{ background: "#1e3a5f", padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>💰 견적서 탭</span>
            <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#94a3b8" }}>
              <span>성인 2명 / 아동 1명</span>
              <span>·</span>
              <span>5일 4박</span>
            </div>
          </div>

          {/* 카테고리 테이블 */}
          <div style={{ padding: "14px 18px" }}>
            {/* 헤더 행 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 80px 110px 130px",
              gap: 8,
              padding: "6px 10px",
              fontSize: 11,
              color: "#475569",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 6,
            }}>
              <span>구분</span>
              <span>내역</span>
              <span style={{ textAlign: "right" }}>수량</span>
              <span style={{ textAlign: "right" }}>단가</span>
              <span style={{ textAlign: "right" }}>소계</span>
            </div>

            {/* 행들 */}
            {categories.map((cat, i) => {
              const rowSpring = spring({ frame: frame - (i * 10 + 10), fps, config: { damping: 200 } });
              const rowOpacity = interpolate(rowSpring, [0, 1], [0, 1]);
              const showAmount = i < totalVisible;
              const unitValue = i === 0 ? typedValue : cat.unit;
              const subtotal = showAmount ? unitValue * cat.count : 0;

              return (
                <div
                  key={cat.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 80px 110px 130px",
                    gap: 8,
                    padding: "7px 10px",
                    borderRadius: 6,
                    marginBottom: 3,
                    background: "rgba(255,255,255,0.02)",
                    opacity: rowOpacity,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12 }}>{cat.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        background: cat.color,
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: 3,
                        fontWeight: 700,
                      }}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {cat.label === "항공" ? "인천 → 장가계 왕복" :
                      cat.label === "호텔" ? "장가계 그랜드 호텔" :
                      cat.label === "관광" ? "천문산 등 6개소" :
                      cat.label === "식사" ? "현지식 8식" :
                      cat.label === "차량" ? "전용 차량 5회" : "가이드 5일"}
                  </span>
                  <span style={{ fontSize: 12, color: "#e2e8f0", textAlign: "right" }}>{cat.count}</span>
                  <div style={{ textAlign: "right" }}>
                    {i === 0 ? (
                      <span
                        style={{
                          fontSize: 12,
                          color: isTyping ? "#fbbf24" : "#e2e8f0",
                          background: i === 0 && inputFrame >= 0 && inputFrame < 10 ? "rgba(59,130,246,0.2)" : "transparent",
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: i === 0 && inputFrame >= 0 && inputFrame < 50 ? "1px solid rgba(59,130,246,0.5)" : "1px solid transparent",
                          display: "inline-block",
                          minWidth: 80,
                          fontFamily: "monospace",
                        }}
                      >
                        {unitValue > 0 ? unitValue.toLocaleString() : "-"}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "monospace" }}>
                        {cat.unit.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: showAmount ? "#22c55e" : "#334155",
                      textAlign: "right",
                      fontWeight: showAmount ? 700 : 400,
                      fontFamily: "monospace",
                      transition: "none",
                    }}
                  >
                    {showAmount ? subtotal.toLocaleString() : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 합계 영역 */}
          <div
            style={{
              margin: "0 18px 14px",
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "12px 16px",
              opacity: interpolate(summarySpring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(summarySpring, [0, 1], [20, 0])}px)`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "소계 합산", value: grandTotal, color: "#e2e8f0" },
                { label: "운영 수수료 (10%)", value: commission, color: "#f59e0b" },
                { label: "부가세 (수수료의 10%)", value: vat, color: "#f59e0b" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: row.color }}>
                  <span>{row.label}</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatKRW(row.value)}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#3b82f6",
                }}
              >
                <span>TOTAL</span>
                <span style={{ fontFamily: "monospace" }}>{formatKRW(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
