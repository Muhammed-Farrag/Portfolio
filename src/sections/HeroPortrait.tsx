import { useEffect, useRef, useState, type PointerEvent } from 'react';
import fallbackUrl from '../assets/portrait/fallback.webp';
import photoUrl from '../assets/portrait/photo.webp';
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
/** Extra uBurst while the photograph is shown: the particles part around it. */
const PHOTO_BURST = 0.3;
/** A mouse must rest on the portrait this long before the photograph develops. */
const HOVER_DELAY = 120;
/** On touch, the photograph returns to particles on its own after this long. */
const TOUCH_HOLD = 6000;
/** Seconds for the photograph to develop, and to dissolve again. */
const DEVELOP_S = 1.1;
const DISSOLVE_S = 0.6;

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
  const [photo, setPhoto] = useState(false);
  const paused = useMotionPaused();
  /** Drives the photograph reveal inside the main effect; replaced once that effect runs. */
  const revealRef = useRef<(on: boolean) => void>(() => {});
  const timers = useRef({ hover: 0, touch: 0 });

  useEffect(() => revealRef.current(photo), [photo]);
  useEffect(() => {
    const t = timers.current;
    return () => {
      clearTimeout(t.hover);
      clearTimeout(t.touch);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const layer = canvas.parentElement!;
    const story = layer.parentElement!;
    const controller = new AbortController();
    const { signal } = controller;
    let renderer: ParticleRenderer | null = null;
    let frame = 0;
    // Photograph reveal: 0 shows the particles, 1 the photograph. It animates with its own
    // short-lived loop, which stops as soon as the reveal settles.
    let reveal = 0;
    let revealTarget = 0;
    let revealFrame = 0;
    let revealLast = 0;

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

      // Scrolling away returns the photograph to particles before the transition starts.
      if (revealTarget && window.scrollY > a.height * 0.25) setPhoto(false);
      stage.style.setProperty('--free', smooth(0, 0.12, t).toFixed(3));
      // The photograph develops through a soft circle that widens from the pointer, while the
      // particles part around it (uBurst) and fade.
      const fade = smooth(0.3, 0.9, reveal);
      stage.style.setProperty('--photo-r', `${(smooth(0.15, 1, reveal) * 150).toFixed(2)}%`);
      stage.style.setProperty('--photo-o', smooth(0.1, 0.55, reveal).toFixed(3));
      stage.style.setProperty('--photo-fade', fade.toFixed(3));
      // The cloud dims while dispersed, so any text it passes behind stays easy to read. On narrow
      // screens it has to cross the Hero's text and buttons, so it dims further.
      const depth = matchMedia('(max-width: 1023.98px)').matches ? 0.6 : 0.45;
      layer.style.setProperty('--dim', ((1 - depth * Math.sin(Math.PI * smooth(0.1, 0.9, t))) * (1 - fade)).toFixed(3));
      stage.dataset.progress = t.toFixed(3);
      if (figure) {
        figure.dataset.live = String(!still);
        // Complete just before the end, so a page that settles a few pixels short still shows the labels fully.
        figure.style.setProperty('--reveal', smooth(0.8, 0.98, t).toFixed(3));
      }
      if (!renderer) return;
      renderer.setFrame({ x: box.left - layerBox.left, y: box.top - layerBox.top, width: box.width, height: box.height });
      // Eased at both ends: the portrait holds its shape briefly before it dissolves.
      renderer.setExit(Math.sin(Math.PI * smooth(0, 1, t)) * TRANSITION_BURST + smooth(0, 0.7, reveal) * PHOTO_BURST);
      renderer.setMorph(smooth(0.3, 0.8, t));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const stepReveal = (now: number) => {
      const dt = revealLast ? Math.min(0.05, (now - revealLast) / 1000) : 1 / 60;
      revealLast = now;
      reveal = revealTarget ? Math.min(1, reveal + dt / DEVELOP_S) : Math.max(0, reveal - dt / DISSOLVE_S);
      update();
      if (reveal !== revealTarget) revealFrame = requestAnimationFrame(stepReveal);
      else revealFrame = revealLast = 0;
    };
    revealRef.current = (on) => {
      revealTarget = on ? 1 : 0;
      stage.dataset.photo = on ? 'on' : 'off';
      if (isMotionPaused()) {
        // Paused motion: the photograph simply appears and disappears.
        if (revealFrame) cancelAnimationFrame(revealFrame);
        revealFrame = revealLast = 0;
        reveal = revealTarget;
        update();
      } else if (!revealFrame && reveal !== revealTarget) {
        revealFrame = requestAnimationFrame(stepReveal);
      }
    };
    stage.dataset.photo = 'off';

    const stopReveal = () => {
      revealRef.current = () => {};
      if (revealFrame) cancelAnimationFrame(revealFrame);
    };

    // Without WebGL, show the still frame straight away instead of downloading the source first.
    if (!canvas.getContext('webgl', TRANSPARENT_CONTEXT_ATTRIBUTES)) {
      fail();
      return () => {
        controller.abort();
        stopReveal();
      };
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
      stopReveal();
      if (frame) cancelAnimationFrame(frame);
      renderer?.dispose();
      renderer = null;
    };
  }, [canvasRef]);

  // Mouse: the photograph develops after a short rest on the portrait and dissolves when the
  // pointer leaves. Touch and pen: a tap toggles it, and it returns to particles on its own.
  const aim = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--px', `${(((e.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty('--py', `${(((e.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
  };
  const onEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    aim(e);
    clearTimeout(timers.current.hover);
    timers.current.hover = window.setTimeout(() => setPhoto(true), HOVER_DELAY);
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(timers.current.hover);
    setPhoto(false);
  };
  const onTap = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return;
    aim(e);
    clearTimeout(timers.current.touch);
    if (!photo) timers.current.touch = window.setTimeout(() => setPhoto(false), TOUCH_HOLD);
    setPhoto(!photo);
  };

  return (
    <div className="hero__portrait" data-mode={mode}>
      <div
        ref={stageRef}
        className="hero__stage"
        role="img"
        aria-label={photo ? 'Photograph of Muhammed Farrag' : 'Portrait of Muhammed Farrag, drawn in particles'}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onPointerUp={onTap}
      >
        {mode === 'static' && <img className="hero__fallback" src={fallbackUrl} alt="" width={1000} height={1000} decoding="async" />}
        {mode !== 'loading' && <img className="hero__photo" src={photoUrl} alt="" width={738} height={738} decoding="async" />}
      </div>
      {mode !== 'loading' && (
        <div className="hero__controls">
          <button type="button" className="hero__control hero__reveal" aria-pressed={photo} onClick={() => setPhoto(!photo)}>
            <svg aria-hidden="true" viewBox="0 0 10 10" width="10" height="10">
              <circle cx="5" cy="3.3" r="2.1" fill="currentColor" />
              <path d="M.8 9.6C1.2 7 2.9 5.8 5 5.8s3.8 1.2 4.2 3.8z" fill="currentColor" />
            </svg>
            <span className="hero__control-label">Show photograph</span>
          </button>
          {mode === 'live' && (
            <button type="button" className="hero__control hero__motion" onClick={() => setMotionPaused(!paused)}>
              <svg aria-hidden="true" viewBox="0 0 10 10" width="10" height="10">
                {paused ? <path d="M2 1l7 4-7 4z" fill="currentColor" /> : <path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" />}
              </svg>
              <span className="hero__control-label">{paused ? 'Play motion' : 'Pause motion'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
