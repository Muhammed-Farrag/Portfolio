import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Pending } from '../../components/Pending';
import { events, type EventDef } from '../../content/events';
import type { SectionDef } from '../../content/site';
import { useMotionPaused } from '../../features/motion/motion';
import { CEREMONY_STAGES, JUDGING_STAGES } from '../../features/recognition/actors';
import { STAGES } from '../../features/recognition/figure';
import { ceremonyScene, judgingScene, victoryScene, type Density, type Scene } from '../../features/recognition/scenes';
import './Events.css';

const SCENES: Record<EventDef['scene'], { create: () => Scene; stages: readonly string[] }> = {
  victory: { create: victoryScene, stages: STAGES },
  ceremony: { create: ceremonyScene, stages: CEREMONY_STAGES },
  judging: { create: judgingScene, stages: JUDGING_STAGES },
};

/** How quickly the drawn scene catches up with the scroll position, ms: wheel steps glide instead of jumping. */
const EASE_MS = 120;
/** A jump larger than this (the skip link, a keyboard End) is shown at once rather than fast-forwarded. */
const SNAP = 0.3;

/** Scroll progress through the track: 0 when it reaches the top of the viewport, 1 at its end. */
function trackProgress(track: HTMLElement): number {
  const box = track.getBoundingClientRect();
  const span = box.height - window.innerHeight;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, -box.top / span));
}

const densities = new Map<string, Promise<Density>>();
/** A photograph's density map, read from its small greyscale mask (loaded once per page). */
function loadDensity(src: string): Promise<Density> {
  let d = densities.get(src);
  if (!d) {
    d = (async () => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true })!;
      g.drawImage(img, 0, 0);
      const rgba = g.getImageData(0, 0, c.width, c.height).data;
      const data = new Uint8Array(c.width * c.height);
      for (let k = 0; k < data.length; k++) data[k] = rgba[k * 4]!;
      return { data, w: c.width, h: c.height };
    })();
    densities.set(src, d);
  }
  return d;
}

/** One event: a tall track that scrolls past a sticky stage, where the scene plays and the photograph lands. */
function EventTrack({ e, index, live, head }: { e: EventDef; index: number; live: boolean; head: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [stage, setStage] = useState(0);
  const { create, stages } = SCENES[e.scene];
  const endId = `${e.id}-photo`;

  // The canvas exists only while the scene is near the viewport.
  useEffect(() => {
    if (!live) return;
    const io = new IntersectionObserver(([en]) => setNear(!!en?.isIntersecting), { rootMargin: '50% 0px' });
    io.observe(trackRef.current!);
    return () => io.disconnect();
  }, [live]);

  useEffect(() => {
    const track = trackRef.current!;
    const canvas = canvasRef.current;
    const photo = photoRef.current!;
    if (!live || !near || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scene = create();
    let disposed = false;
    let frame = 0;
    let shown = -1;
    let last = 0;
    let stageNow = -1;
    const view = { w: 0, h: 0, dpr: 1, cx: 0, ground: 0, photo: { x: 0, y: 0, w: 0, h: 0 } };

    const paint = (p: number) => {
      const f = scene.frame(p);
      track.style.setProperty('--p', p.toFixed(4));
      track.style.setProperty('--photo', f.photo.toFixed(3));
      track.style.setProperty('--gather', f.gather.toFixed(3));
      // Whichever of the head and the award is out of sight must not take taps meant for the other.
      track.toggleAttribute('data-landed', f.photo > 0.5);
      if (f.stage !== stageNow) {
        stageNow = f.stage;
        track.dataset.stage = String(f.stage);
        setStage(f.stage);
      }
      scene.draw(ctx, p, view);
    };
    // The drawn progress eases toward the scroll position, and the loop stops once it has settled.
    const tick = (now: number) => {
      frame = 0;
      const target = trackProgress(track);
      if (shown < 0 || Math.abs(target - shown) > SNAP) shown = target;
      else shown += (target - shown) * (1 - Math.exp(-Math.min(64, now - last) / EASE_MS));
      if (Math.abs(target - shown) < 0.0004) shown = target;
      last = now;
      paint(shown);
      if (shown !== target) frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      // The dots land on the print's picture as it rests, without the tilt it lands with.
      photo.style.transform = 'none';
      const pb = photo.querySelector('img')!.getBoundingClientRect();
      photo.style.transform = '';
      // The stage centre and ground line come from CSS, so the scene and the print share one layout.
      const style = getComputedStyle(track);
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.w = box.width;
      view.h = box.height;
      view.cx = Number(style.getPropertyValue('--cx').trim() || 0.5) * box.width;
      view.ground = Number(style.getPropertyValue('--ground').trim() || 0.8) * box.height;
      view.photo = { x: pb.left - box.left, y: pb.top - box.top, w: pb.width, h: pb.height };
      canvas.width = Math.round(view.w * view.dpr);
      canvas.height = Math.round(view.h * view.dpr);
      paint(shown < 0 ? (shown = trackProgress(track)) : shown);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('scroll', schedule, { passive: true });
    resize();
    loadDensity(e.photo.mask).then(
      (d) => {
        if (disposed) return;
        scene.setTarget(d);
        paint(shown);
      },
      () => {}, // Without the mask the dots fill the picture evenly.
    );
    return () => {
      disposed = true;
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [live, near, create, e.photo.mask]);

  const aspect = e.photo.width / e.photo.height;
  const last = stage === stages.length - 1;
  return (
    <div className="recog__track" ref={trackRef} data-event={e.scene} style={{ '--photo': live ? 0 : 1, '--aspect': aspect, '--native-h': e.photo.height } as CSSProperties}>
      <div className="recog__sticky">
        <div className="container recog__head">
          {head}
          {live && (
            <a className="recog__skip" href={`#${endId}`}>
              Skip to the photograph <span aria-hidden="true">↓</span>
            </a>
          )}
        </div>

        {live && near && <canvas ref={canvasRef} className="recog__canvas" aria-hidden="true" />}
        {live && (
          <p className="recog__symbolic mono" aria-hidden="true">
            Symbolic animation
          </p>
        )}

        <figure className="recog__photo" ref={photoRef}>
          <img src={e.photo.src} alt={e.photo.alt} width={e.photo.width} height={e.photo.height} loading="lazy" decoding="async" />
          <figcaption className="mono">{e.photo.caption}</figcaption>
        </figure>

        <div className="recog__award">
          <p className="mono recog__team">
            <span className="recog__count">
              {String(index + 1).padStart(2, '0')} / {String(events.length).padStart(2, '0')}
            </span>{' '}
            {e.role}
          </p>
          <h3 className="recog__title display">{e.title}</h3>
          <p className="recog__event">{e.event}</p>
          {e.draft && <Pending label="Draft">{e.draft}</Pending>}
        </div>

        {live && (
          <ol className="recog__stages mono" aria-hidden="true">
            {stages.map((label, k) => (
              <li key={label} data-state={k < stage ? 'done' : k === stage ? 'active' : undefined}>
                {label}
              </li>
            ))}
          </ol>
        )}
        {live && (
          <div className="recog__scroll mono" aria-hidden="true">
            <span>
              {last ? 'Keep scrolling for the next moment' : 'Scroll to explore this moment'} <span className="recog__hint">↓</span>
            </span>
            <span className="recog__progress">
              <span />
            </span>
          </div>
        )}
      </div>
      <span id={endId} className="recog__end" />
    </div>
  );
}

/** Important Events: three moments, each a symbolic halftone scene whose dots gather into the real photograph. */
export function Events({ s }: { s: SectionDef }) {
  const live = !useMotionPaused();
  return (
    <section id={s.id} className={`section recog theme-${s.theme}`} data-blend={s.blendFrom} data-beat="Important events" data-beat-scrub="" data-beat-min="27000" data-beat-effect="warp" data-backdrop="rays" data-mode={live ? 'live' : 'static'} aria-labelledby={`${s.id}-title`}>
      {events.map((e, i) => (
        <EventTrack
          key={e.id}
          e={e}
          index={i}
          live={live}
          head={
            i === 0 ? (
              <>
                <p className="eyebrow">{s.eyebrow}</p>
                <h2 id={`${s.id}-title`} className="display section__title">
                  {s.title}
                </h2>
              </>
            ) : null
          }
        />
      ))}
    </section>
  );
}
