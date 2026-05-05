import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const stats = [
  { value: "60분", label: "기존 작업 시간", color: "#ef4444", before: true },
  { value: "→", label: "", color: "#64748b", before: false },
  { value: "5분", label: "목표 작업 시간", color: "#22c55e", before: false },
];

const features = [
  { icon: "🗺️", label: "일정표 에디터", desc: "드래그앤드롭 + 다중 항목" },
  { icon: "💰", label: "견적서 자동 계산", desc: "단가 → 합계 즉시 산출" },
  { icon: "📚", label: "버전 히스토리", desc: "불변 버전 관리" },
  { icon: "📊", label: "Excel 출력", desc: "인감 가이드 포함" },
  { icon: "👥", label: "3개 역할 분기", desc: "서버 권한 자동 분기" },
  { icon: "🔗", label: "팝업 연동", desc: "postMessage 부모 연결" },
];

export const Slide09Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 배경 빛 효과 (pulse)
  const glowScale = interpolate(frame, [0, 60, 120], [0.8, 1.05, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 수치 비교
  const statSpring = spring({ frame: frame - 10, fps, config: { damping: 200 } });

  // 피처 그리드
  const featureVisibleCount = Math.min(
    features.length,
    Math.max(0, Math.floor((frame - 40) / 10))
  );

  // 마무리 메시지
  const msgOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  // CTA
  const ctaSpring = spring({ frame: frame - 90, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
        padding: "60px 120px",
      }}
    >
      {/* 배경 격자 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* 중앙 글로우 */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          transform: `scale(${glowScale})`,
          pointerEvents: "none",
        }}
      />

      {/* 수치 비교 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          marginBottom: 40,
          opacity: interpolate(statSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(statSpring, [0, 1], [0.9, 1])})`,
        }}
      >
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: s.value === "→" ? 40 : 64,
                fontWeight: 900,
                color: s.color,
                lineHeight: 1,
                textShadow: s.value !== "→" ? `0 0 30px ${s.color}60` : "none",
              }}
            >
              {s.value}
            </div>
            {s.label && (
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>{s.label}</div>
            )}
          </div>
        ))}
      </div>

      {/* 기능 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          width: "100%",
          maxWidth: 900,
          marginBottom: 40,
        }}
      >
        {features.slice(0, featureVisibleCount).map((feat, i) => {
          const s = spring({ frame: frame - (i * 10 + 40), fps, config: { damping: 200 } });
          return (
            <div
              key={feat.label}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                gap: 12,
                alignItems: "center",
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{feat.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1" }}>{feat.label}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{feat.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 마무리 메시지 */}
      <div
        style={{
          textAlign: "center",
          opacity: msgOpacity,
          marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          협력사 · 견적담당 · 영업담당을 하나로
        </div>
        <div style={{ fontSize: 15, color: "#64748b" }}>
          하나투어 기존 시스템에서 팝업으로 바로 실행 — 별도 도입 없이 즉시 사용 가능
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: interpolate(ctaSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(ctaSpring, [0, 1], [0.8, 1])})`,
          display: "flex",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: "#fff",
            padding: "14px 36px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            boxShadow: "0 0 30px rgba(59,130,246,0.4)",
          }}
        >
          🗺️ 데모 요청
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "#cbd5e1",
            padding: "14px 36px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          📄 기획서 보기
        </div>
      </div>

      {/* 하단 */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 13,
          color: "#334155",
          opacity: msgOpacity,
        }}
      >
        Tour Editor v1.0 · 2026 · 하나투어 견적 플랫폼
      </div>
    </AbsoluteFill>
  );
};
