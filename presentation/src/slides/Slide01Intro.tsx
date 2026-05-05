import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Slide01Intro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 200 } });
  const titleY = interpolate(frame, [10, 35], [40, 0], { extrapolateRight: "clamp" });
  const titleOpacity = interpolate(frame, [10, 35], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp" });
  const badgeOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      {/* 배경 격자 패턴 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* 로고 아이콘 */}
      <div
        style={{
          fontSize: 80,
          marginBottom: 32,
          transform: `scale(${logoScale})`,
          filter: "drop-shadow(0 0 30px rgba(59,130,246,0.6))",
        }}
      >
        🗺️
      </div>

      {/* 메인 타이틀 */}
      <div
        style={{
          fontSize: 76,
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-2px",
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        하나투어 견적 에디터
      </div>

      {/* 서브타이틀 */}
      <div
        style={{
          fontSize: 28,
          color: "#94a3b8",
          marginTop: 20,
          opacity: subtitleOpacity,
          letterSpacing: "0.5px",
        }}
      >
        협력사 · 견적담당 · 영업담당을 연결하는 통합 견적 플랫폼
      </div>

      {/* 뱃지 */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 48,
          opacity: badgeOpacity,
        }}
      >
        {["일정표 작성", "견적서 관리", "버전 히스토리", "Excel 출력"].map((label) => (
          <div
            key={label}
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 100,
              padding: "8px 22px",
              fontSize: 16,
              color: "#93c5fd",
              fontWeight: 500,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 하단 라인 */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#475569",
          fontSize: 14,
          opacity: badgeOpacity,
        }}
      >
        Tour Editor v1.0 · 2026
      </div>
    </AbsoluteFill>
  );
};
