import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const problems = [
  { icon: "💬", text: "하나톡·이메일·메신저 혼용 → 커뮤니케이션 추적 불가" },
  { icon: "📄", text: "엑셀·워드·PDF 각자 다른 포맷 → 매번 변환 작업" },
  { icon: "🔁", text: "협력사 → 담당자 → 영업 → 고객, 동일 내용 3회 이상 재작업" },
  { icon: "🗂️", text: "버전 관리 불가 — 어떤 파일이 최종인지 모름" },
];

const ProblemCard = ({ icon, text, delay }: { icon: string; text: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const y = interpolate(cardSpring, [0, 1], [20, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 12,
        padding: "18px 24px",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 18, color: "#cbd5e1", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
};

export const Slide02Problem = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });

  const arrowOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  const afterScale = spring({ frame: frame - 100, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: "#0f172a",
        display: "flex",
        padding: "60px 120px",
        flexDirection: "column",
        fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      {/* 제목 */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: 12,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        지금까지의 견적 작업
      </div>
      <div
        style={{
          fontSize: 22,
          color: "#ef4444",
          marginBottom: 40,
          fontWeight: 600,
          opacity: titleOpacity,
        }}
      >
        견적 1건 작성에 평균 60분 — 실제 기획은 고작 10분
      </div>

      <div style={{ display: "flex", gap: 48, flex: 1, alignItems: "flex-start" }}>
        {/* 문제 목록 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {problems.map((p, i) => (
            <ProblemCard key={p.icon} icon={p.icon} text={p.text} delay={i * 12 + 5} />
          ))}
        </div>

        {/* 화살표 + 솔루션 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            opacity: arrowOpacity,
            paddingTop: 60,
          }}
        >
          <div style={{ fontSize: 48, color: "#64748b" }}>→</div>
          <div
            style={{
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              borderRadius: 16,
              padding: "32px 36px",
              textAlign: "center",
              transform: `scale(${afterScale})`,
              boxShadow: "0 0 40px rgba(59,130,246,0.3)",
            }}
          >
            <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1 }}>5분</div>
            <div style={{ fontSize: 18, color: "#bfdbfe", marginTop: 8 }}>목표 작성 시간</div>
            <div
              style={{
                marginTop: 16,
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 14,
                color: "#e0f2fe",
              }}
            >
              단일 웹 에디터로 통합
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
