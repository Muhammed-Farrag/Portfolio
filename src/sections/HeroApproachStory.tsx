import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react';
import './HeroApproachStory.css';

const StoryCanvas = createContext<RefObject<HTMLCanvasElement> | null>(null);

/** The single canvas shared by the Hero portrait and the Hero-to-Approach transition. */
export function useStoryCanvas(): RefObject<HTMLCanvasElement> {
  const ref = useContext(StoryCanvas);
  if (!ref) throw new Error('useStoryCanvas must be used inside <HeroApproachStory>');
  return ref;
}

/**
 * Wraps the Hero and Approach sections around one transparent WebGL layer. The layer sticks to
 * the viewport while either section is on screen; section grounds paint below it and section
 * content above it, so particles travel between the two without covering any text.
 */
export function HeroApproachStory({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  return (
    <div className="story">
      <div className="story__layer" aria-hidden="true">
        <canvas ref={canvasRef} className="story__canvas" />
      </div>
      <StoryCanvas.Provider value={canvasRef}>{children}</StoryCanvas.Provider>
    </div>
  );
}
