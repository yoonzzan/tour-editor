import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Slide01Intro } from "./slides/Slide01Intro";
import { Slide02Problem } from "./slides/Slide02Problem";
import { Slide03Entry } from "./slides/Slide03Entry";
import { Slide04Roles } from "./slides/Slide04Roles";
import { Slide05Itinerary } from "./slides/Slide05Itinerary";
import { Slide06Quote } from "./slides/Slide06Quote";
import { Slide07Version } from "./slides/Slide07Version";
import { Slide08Excel } from "./slides/Slide08Excel";
import { Slide09Outro } from "./slides/Slide09Outro";

const TRANSITION_FRAMES = 20;

export const TourEditorPresentation = () => {
  return (
    <TransitionSeries>
      {/* 인트로: 4초 = 120f */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Slide01Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* 문제 제기: 6초 = 180f */}
      <TransitionSeries.Sequence durationInFrames={180}>
        <Slide02Problem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
      />

      {/* 에디터 진입: 5초 = 150f */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Slide03Entry />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
      />

      {/* 역할 소개: 5초 = 150f */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Slide04Roles />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
      />

      {/* 일정표 에디터: 8초 = 240f */}
      <TransitionSeries.Sequence durationInFrames={240}>
        <Slide05Itinerary />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
      />

      {/* 견적서 에디터: 7초 = 210f */}
      <TransitionSeries.Sequence durationInFrames={210}>
        <Slide06Quote />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
      />

      {/* 버전 관리: 5초 = 150f */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <Slide07Version />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES })}
      />

      {/* Excel 출력: 4초 = 120f */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Slide08Excel />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      {/* 아웃트로: 4초 + 20f 전환 보정 = 120f */}
      <TransitionSeries.Sequence durationInFrames={120}>
        <Slide09Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
