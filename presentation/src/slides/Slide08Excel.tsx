import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const rows = [
  { label: "항공", items: "인천 ↔ 장가계 (왕복)", qty: 3, unit: 420000, color: "#3b82f6" },
  { label: "호텔", items: "장가계 그랜드 호텔 4박", qty: 4, unit: 180000, color: "#a78bfa" },
  { label: "관광", items: "천문산 외 6개소", qty: 6, unit: 35000, color: "#22c55e" },
  { label: "식사", items: "현지식 8식", qty: 8, unit: 28000, color: "#f59e0b" },
  { label: "차량", items: "전용 차량 5회", qty: 5, unit: 55000, color: "#06b6d4" },
  { label: "가이드", items: "가이드 5일", qty: 5, unit: 40000, color: "#ec4899" },
];

export const Slide08Excel = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // 메뉴 드롭다운 (1.5초)
  const menuSpring = spring({ frame: frame - 45, fps, config: { damping: 200 } });
  const menuOpacity = interpolate(menuSpring, [0, 1], [0, 1]);
  const menuY = interpolate(menuSpring, [0, 1], [-10, 0]);

  // 행 순차 등장
  const rowVisibleCount = Math.min(
    rows.length,
    Math.max(0, Math.floor((frame - 70) / 12))
  );

  // 인감 가이드 등장 (마지막)
  const stampSpring = spring({ frame: frame - 145, fps, config: { damping: 200 } });
  const stampOpacity = interpolate(stampSpring, [0, 1], [0, 1]);

  const total = rows.reduce((s, r) => s + r.unit * r.qty, 0);
  const commission = Math.floor(total * 0.1);
  const vat = Math.floor(commission * 0.1);
  const grand = total + commission + vat;

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
      <div style={{ width: 320, flexShrink: 0, paddingTop: 10 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 12, opacity: titleOpacity }}>
          Excel 출력
        </div>
        <div style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, opacity: titleOpacity }}>
          버튼 하나로 표준 견적산출내역서를<br />Excel(.xlsx)로 즉시 다운로드합니다.
        </div>

        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "📋", label: "일정표 + 견적서", desc: "시트 2장 자동 생성" },
            { icon: "🔽", label: "형식 선택", desc: "상세·총액·숨김 형식 드롭다운" },
            { icon: "(인)", label: "인감 가이드", desc: "견적서 우하단 점선 영역 포함" },
          ].map((feat, i) => {
            const s = spring({ frame: frame - (i * 15 + 20), fps, config: { damping: 200 } });
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
                <span
                  style={{
                    fontSize: feat.icon === "(인)" ? 14 : 20,
                    flexShrink: 0,
                    fontWeight: feat.icon === "(인)" ? 700 : "normal",
                    color: feat.icon === "(인)" ? "#94a3b8" : "inherit",
                    width: 28,
                    textAlign: "center",
                  }}
                >
                  {feat.icon}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1" }}>{feat.label}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{feat.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Excel▼ 드롭다운 메뉴 */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>형식 선택 드롭다운</div>
          <div
            style={{
              background: "#1e293b",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              overflow: "hidden",
              opacity: menuOpacity,
              transform: `translateY(${menuY}px)`,
            }}
          >
            {[
              { label: "📊 상세 내역", desc: "항목별 단가 표시", active: false },
              { label: "💰 총액만", desc: "최종 금액만 표시", active: true },
              { label: "🔒 가격 숨김", desc: "금액 없이 일정만", active: false },
            ].map((opt) => (
              <div
                key={opt.label}
                style={{
                  padding: "9px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: opt.active ? "rgba(59,130,246,0.15)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ fontSize: 12, color: opt.active ? "#93c5fd" : "#94a3b8", fontWeight: opt.active ? 700 : 400 }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: 11, color: "#475569" }}>{opt.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 우측: Excel 미리보기 */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 0 40px rgba(0,0,0,0.4)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Excel 상단 탭 */}
          <div style={{ background: "#217346", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>📊 견적산출내역서_장가계5일_v1.2.xlsx</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["파일", "홈", "삽입", "페이지 레이아웃"].map((t) => (
                <span key={t} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", padding: "2px 8px", cursor: "default" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* 시트 탭 */}
          <div style={{ background: "#f0f0f0", display: "flex", borderBottom: "1px solid #d0d0d0" }}>
            {["견적산출내역서", "일정표"].map((tab, i) => (
              <div
                key={tab}
                style={{
                  padding: "5px 16px",
                  fontSize: 12,
                  background: i === 0 ? "#fff" : "#f0f0f0",
                  color: i === 0 ? "#217346" : "#666",
                  fontWeight: i === 0 ? 700 : 400,
                  borderRight: "1px solid #d0d0d0",
                  borderTop: i === 0 ? "2px solid #217346" : "none",
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* 견적서 내용 */}
          <div style={{ flex: 1, padding: "16px 20px", background: "#fff", display: "flex", flexDirection: "column", gap: 0 }}>
            {/* 제목 */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>견 적 산 출 내 역 서</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>청발 장가계 5일 (2026-06-10 ~ 06-14) · v1.2</div>
            </div>

            {/* 테이블 헤더 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr 50px 80px 90px",
                background: "#217346",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "5px 10px",
                gap: 4,
              }}
            >
              <span>구분</span>
              <span>내역</span>
              <span style={{ textAlign: "right" }}>수량</span>
              <span style={{ textAlign: "right" }}>단가</span>
              <span style={{ textAlign: "right" }}>소계</span>
            </div>

            {/* 데이터 행 */}
            {rows.slice(0, rowVisibleCount).map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr 50px 80px 90px",
                  fontSize: 11,
                  color: "#1a1a1a",
                  padding: "4px 10px",
                  gap: 4,
                  background: i % 2 === 0 ? "#f9fafb" : "#fff",
                  borderBottom: "1px solid #e5e7eb",
                  alignItems: "center",
                }}
              >
                <span style={{ color: row.color, fontWeight: 700 }}>{row.label}</span>
                <span>{row.items}</span>
                <span style={{ textAlign: "right" }}>{row.qty}</span>
                <span style={{ textAlign: "right" }}>{row.unit.toLocaleString()}</span>
                <span style={{ textAlign: "right", fontWeight: 600 }}>{(row.unit * row.qty).toLocaleString()}</span>
              </div>
            ))}

            {/* 합계 */}
            {rowVisibleCount >= rows.length && (
              <div style={{ marginTop: 6 }}>
                {[
                  { label: "소계", value: total, bold: false },
                  { label: "운영 수수료 (10%)", value: commission, bold: false },
                  { label: "부가세", value: vat, bold: false },
                  { label: "합 계", value: grand, bold: true },
                ].map((r) => (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: r.bold ? 12 : 11,
                      fontWeight: r.bold ? 800 : 400,
                      color: r.bold ? "#217346" : "#374151",
                      padding: "3px 10px",
                      background: r.bold ? "#f0fdf4" : "transparent",
                      borderTop: r.bold ? "2px solid #217346" : "none",
                    }}
                  >
                    <span>{r.label}</span>
                    <span style={{ fontFamily: "monospace" }}>{r.value.toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            )}

            {/* 인감 가이드 */}
            <div
              style={{
                marginTop: "auto",
                alignSelf: "flex-end",
                width: 100,
                height: 60,
                border: "2px dashed #999",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: stampOpacity,
              }}
            >
              <span style={{ fontSize: 18, color: "#999", fontWeight: 700 }}>(인)</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
