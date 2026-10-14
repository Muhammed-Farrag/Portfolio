import { useEffect, useRef, useState } from 'react';
import fallbackUrl from '../assets/portrait/fallback.webp';
import sourceUrl from '../assets/portrait/source-600.webp';
import { isMotionPaused, onMotionChange, setMotionPaused, useMotionPaused } from '../features/motion/motion';
import {
  PORTFOLIO_BACKGROUND,
  TRANSPARENT_CONTEXT_ATTRIBUTES,
  createParticleRenderer,
  type ParticleRenderer,
  type SampleStep,
} from '../features/particle-portrait';
import { assignTargets, diagramTargets } from '../features/story/approachDiagram';
import { APPROACH_FIGURE_ID } from './ApproachFigure';
import { useStoryCanvas } from './HeroApproachStory';

type Mode = 'loading' | 'live' | 'static';

/** uBurst at the middle of the Hero-to-Approach transition. */
const TRANSITION_BURST = 0.42;
/** The entrance starts at this fraction of a full legacy scatter. */
const ASSEMBLE_STRENGTH = 0.45;

/** Ultra density where the device can afford it; Fine on small or modest devices; Soft on Save-Data. */
function pickStep(): SampleStep {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return 4;
  const small = matchMedia('(max-width: 767px)').matches;
  const modest = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return small || modest ? 3 : 2;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Transition progress, a pure function of the scroll position (so it never lags and reverses
 * exactly): 0 at the top of the page, 1 once the Approach figure is centred in the viewport.
 */
function transitionProgress(figure: DOMRect): number {
  const travelled = window.scrollY;
  const remaining = figure.top + figure.height / 2 - window.innerHeight / 2;
  if (remaining <= 0) return 1;
  if (travelled <= 0) return 0;
  return travelled / (travelled + remaining);
}

export function HeroPortrait() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useStoryCanvas();
  const [mode, setMode] = useState<Mode>('loading');
  const paused = useMotionPaused();

  useEffect(() => {
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const layer = canvas.parentElement!;
    const story = layer.parentElement!;
    const controller = new AbortController();
    const { signal } = controller;
    let renderer: ParticleRenderer | null = null;
    let frame = 0;

    const setStoryMode = (next: Mode) => {
      story.dataset.mode = next;
      setMode(next);
    };

    const fail = () => {
      renderer?.dispose();
      renderer = null;
      stage.dataset.state = 'static';
      setStoryMode('static');
    };

    // Places the portrait on its slot and, while motion is allowed, carries it to the Approach
    // figure: it disperses on the way (uBurst), changes shape in the middle (uMorph) and settles.
    const update = () => {
      frame = 0;
      const figure = document.getElementById(APPROACH_FIGURE_ID);
      const still = isMotionPaused() || !renderer;
      const layerBox = layer.getBoundingClientRect();
      const a = stage.getBoundingClientRect();
      const b = figure?.getBoundingClientRect();
      const t = still || !b ? 0 : transitionProgress(b);
      const travel = smooth(0.2, 0.85, t);
      const box = b
        ? { left: lerp(a.left, b.left, travel), top: lerp(a.top, b.top, travel), width: lerp(a.width, b.width, travel), height: lerp(a.height, b.height, travel) }
        : a;

      stage.style.setProperty('--free', smooth(0, 0.12, t).toFixed(3));
      // The cloud dims while dispersed, so any text it passes behind stays easy to read. On narrow
      // screens it has to cross the Hero's text and buttons, so it dims further.
      const depth = matchMedia('(max-width: 1023.98px)').matches ? 0.6 : 0.45;
      layer.style.setProperty('--dim', (1 - depth * Math.sin(Math.PI * smooth(0.1, 0.9, t))).toFixed(3));
      stage.dataset.progress = t.toFixed(3);
      if (figure) {
        figure.dataset.live = String(!still);
        // Complete just before the end, so a page that settles a few pixels short still shows the labels fully.
        figure.style.setProperty('--reveal', smooth(0.8, 0.98, t).toFixed(3));
      }
      if (!renderer) return;
      renderer.setFrame({ x: box.left - layerBox.left, y: box.top - layerBox.top, width: box.width, height: box.height });
      // Eased at both ends: the portrait holds its shape briefly before it dissolves.
      renderer.setExit(Math.sin(Math.PI * smooth(0, 1, t)) * TRANSITION_BURST);
      renderer.setMorph(smooth(0.3, 0.8, t));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Without WebGL, show the still frame straight away instead of downloading the source first.
    if (!canvas.getContext('webgl', TRANSPARENT_CONTEXT_ATTRIBUTES)) {
      fail();
      return () => controller.abort();
    }

    const image = new Image();
    image.decoding = 'async';
    image.onerror = () => !signal.aborted && fail();
    image.onload = () => {
      if (signal.aborted) return;
      const result = createParticleRenderer(canvas, image, {
        pointerTarget: stage,
        sizeTarget: layer,
        transparent: true,
        paused: isMotionPaused(),
        settings: { tone: 'moonlight', background: PORTFOLIO_BACKGROUND, step: pickStep() },
      });
      if ('fallback' in result) return fail();
      renderer = result;
      result.setMorphTarget(assignTargets(result.getPoints(), diagramTargets(result.pointCount)));
      stage.dataset.points = String(result.pointCount);
      stage.dataset.state = result.state ?? 'starting';
      result.on('state', (state) => {
        stage.dataset.state = state;
        if (state === 'failed') fail();
      });
      update();
      // The entrance plays only when the page opens at the portrait, not mid-transition.
      if (!isMotionPaused() && Number(stage.dataset.progress) === 0) result.assemble(ASSEMBLE_STRENGTH);
      setStoryMode('live');
    };
    image.src = sourceUrl;

    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', schedule, { signal });
    void document.fonts?.ready.then(() => !signal.aborted && schedule());
    const stopListening = onMotionChange(() => {
      if (!renderer) return;
      if (isMotionPaused()) renderer.pause();
      else renderer.resume();
      update();
    });
    update();

    return () => {
      controller.abort();
      stopListening();
      if (frame) cancelAnimationFrame(frame);
      renderer?.dispose();
      renderer = null;
    };
  }, [canvasRef]);

  return (
    <div className="hero__portrait" data-mode={mode}>
      <div ref={stageRef} className="hero__stage" role="img" aria-label="Portrait of Muhammed Farrag, drawn in particles">
        {mode === 'static' && <img className="hero__fallback" src={fallbackUrl} alt="" width={1000} height={1000} decoding="async" />}
      </div>
      {mode === 'live' && (
        <button type="button" className="hero__motion" onClick={() => setMotionPaused(!paused)}>
          <svg aria-hidden="true" viewBox="0 0 10 10" width="10" height="10">
            {paused ? <path d="M2 1l7 4-7 4z" fill="currentColor" /> : <path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" />}
          </svg>
          <span className="hero__motion-label">{paused ? 'Play motion' : 'Pause motion'}</span>
        </button>
      )}
    </div>
  );
}
