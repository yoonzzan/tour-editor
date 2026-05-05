import { Composition } from "remotion";
import { TourEditorPresentation } from "./Presentation";

export const RemotionRoot = () => {
  return (
    <Composition
      id="TourEditorPresentation"
      component={TourEditorPresentation}
      durationInFrames={1280}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
