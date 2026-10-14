import { useEffect, useRef, useState } from 'react';
import fallbackUrl from '../assets/portrait/fallback.webp';
import sourceUrl from '../assets/portrait/source-600.webp';
import {
  CONTEXT_ATTRIBUTES,
  PORTFOLIO_BACKGROUND,
  createParticleRenderer,
  type ParticleRenderer,
  type SampleStep,
} from '../features/particle-portrait';

type Mode = 'loading' | 'live' | 'static';

/** Extra uBurst at the end of the scroll-away transition. */
const EXIT_BURST = 0.22;
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

export function HeroPortrait() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('loading');

  useEffect(() => {
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const hero = stage.closest('section') ?? stage;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const { signal } = controller;
    let renderer: ParticleRenderer | null = null;
    let frame = 0;

    const fail = () => {
      renderer?.dispose();
      renderer = null;
      stage.dataset.state = 'static';
      setMode('static');
    };

    // 0 while the hero fills the viewport, 1 once three quarters of it has scrolled away.
    const updateExit = () => {
      frame = 0;
      const r = hero.getBoundingClientRect();
      const progress = reduced.matches ? 0 : Math.min(1, Math.max(0, -r.top / (r.height * 0.75)));
      stage.style.setProperty('--exit', progress.toFixed(3));
      renderer?.setExit(progress * EXIT_BURST);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateExit);
    };

    // Without WebGL, show the still frame straight away instead of downloading the source first.
    if (!canvas.getContext('webgl', CONTEXT_ATTRIBUTES)) {
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
        sizeTarget: stage,
        paused: reduced.matches,
        settings: { tone: 'moonlight', background: PORTFOLIO_BACKGROUND, step: pickStep() },
      });
      if ('fallback' in result) return fail();
      renderer = result;
      stage.dataset.points = String(result.pointCount);
      stage.dataset.state = result.state ?? 'starting';
      result.on('state', (state) => {
        stage.dataset.state = state;
        if (state === 'failed') fail();
      });
      if (!reduced.matches) result.assemble(ASSEMBLE_STRENGTH);
      setMode('live');
      updateExit();
    };
    image.src = sourceUrl;

    window.addEventListener('scroll', onScroll, { passive: true, signal });
    reduced.addEventListener(
      'change',
      () => {
        if (!renderer) return;
        if (reduced.matches) renderer.pause();
        else renderer.resume();
        updateExit();
      },
      { signal },
    );

    return () => {
      controller.abort();
      if (frame) cancelAnimationFrame(frame);
      renderer?.dispose();
      renderer = null;
    };
  }, []);

  return (
    <div className="hero__portrait" data-mode={mode}>
      <div ref={stageRef} className="hero__stage" role="img" aria-label="Portrait of Muhammed Farrag, drawn in particles">
        <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
        {mode === 'static' && <img className="hero__fallback" src={fallbackUrl} alt="" width={1000} height={1000} decoding="async" />}
      </div>
    </div>
  );
}
