import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import fallbackUrl from '../assets/portrait/fallback.webp';
import photoUrl from '../assets/portrait/photo.webp';
import sourceUrl from '../assets/portrait/source-600.webp';
import { isMotionPaused, onMotionChange } from '../features/motion/motion';
import { onPaletteChange, slotRgb } from '../features/palette/palette';
import {
  TRANSPARENT_CONTEXT_ATTRIBUTES,
  createParticleRenderer,
  type ParticleRenderer,
  type PortraitSettings,
  type SampleStep,
} from '../features/particle-portrait';

type Mode = 'loading' | 'live' | 'static';

/** The portrait's colours from the visitor's palette: Edge to Paper, with an Edge to Accent highlight. */
const portraitColors = (): Pick<PortraitSettings, 'background' | 'palette'> => ({
  background: slotRgb('deep'),
  palette: { low: slotRgb('edge'), high: slotRgb('paper'), accentLow: slotRgb('edge'), accentHigh: slotRgb('accent') },
});

/** uBurst once the hero has scrolled away: the portrait bursts into the next scene. */
const EXIT_BURST = 0.75;
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
/** Exit progress, a pure function of the scroll position: 0 at the top, 1 once most of the hero has gone. */
function exitProgress(hero: HTMLElement): number {
  return clamp01(window.scrollY / (hero.offsetHeight * 0.7));
}

/** The portrait slot. It draws on the hero-wide canvas (owned by <Hero>) so the particles can burst across the scene. */
export function HeroPortrait({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('loading');
  const [photo, setPhoto] = useState(false);
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
    const hero = layer.parentElement!;
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
      hero.dataset.mode = next;
      setMode(next);
    };

    const fail = () => {
      renderer?.dispose();
      renderer = null;
      stage.dataset.state = 'static';
      setStoryMode('static');
    };

    // Places the portrait on its slot. As the hero scrolls away (by hand or in the autoplay
    // sequence) the particles burst outwards and fade: the transition into the next scene.
    const update = () => {
      frame = 0;
      const still = isMotionPaused() || !renderer;
      const layerBox = layer.getBoundingClientRect();
      const a = stage.getBoundingClientRect();
      const t = still ? 0 : exitProgress(hero);

      // Scrolling away returns the photograph to particles before the exit starts.
      if (revealTarget && window.scrollY > a.height * 0.25) setPhoto(false);
      stage.style.setProperty('--free', smooth(0, 0.12, t).toFixed(3));
      // The photograph develops through a soft circle that widens from the pointer, while the
      // particles part around it (uBurst) and fade.
      const fade = smooth(0.3, 0.9, reveal);
      stage.style.setProperty('--photo-r', `${(smooth(0.15, 1, reveal) * 150).toFixed(2)}%`);
      stage.style.setProperty('--photo-o', smooth(0.1, 0.55, reveal).toFixed(3));
      stage.style.setProperty('--photo-fade', fade.toFixed(3));
      layer.style.setProperty('--dim', ((1 - smooth(0.35, 1, t)) * (1 - fade)).toFixed(3));
      hero.style.setProperty('--exit', t.toFixed(3));
      stage.dataset.progress = t.toFixed(3);
      if (!renderer) return;
      renderer.setFrame({ x: a.left - layerBox.left, y: a.top - layerBox.top, width: a.width, height: a.height });
      renderer.setExit(smooth(0, 1, t) * EXIT_BURST + smooth(0, 0.7, reveal) * PHOTO_BURST);
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
        settings: { tone: 'moonlight', step: pickStep(), ...portraitColors() },
      });
      if ('fallback' in result) return fail();
      renderer = result;
      stage.dataset.points = String(result.pointCount);
      stage.dataset.state = result.state ?? 'starting';
      result.on('state', (state) => {
        stage.dataset.state = state;
        if (state === 'failed') fail();
      });
      update();
      // The entrance plays only when the page opens at the portrait, not mid-exit.
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
    const stopPalette = onPaletteChange(() => renderer?.set(portraitColors()));
    update();

    return () => {
      controller.abort();
      stopListening();
      stopPalette();
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
        aria-label={photo ? 'Photograph of Muhammed Farrag' : 'Portrait of Muhammed Farrag, drawn in particles. Focus to show the photograph.'}
        // Keyboard: focusing the portrait develops the photograph, moving focus away restores it.
        tabIndex={0}
        onFocus={() => setPhoto(true)}
        onBlur={() => setPhoto(false)}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onPointerUp={onTap}
      >
        {mode === 'static' && <img className="hero__fallback" src={fallbackUrl} alt="" width={1000} height={1000} decoding="async" />}
        {mode !== 'loading' && <img className="hero__photo" src={photoUrl} alt="" width={900} height={900} decoding="async" />}
      </div>
    </div>
  );
}
