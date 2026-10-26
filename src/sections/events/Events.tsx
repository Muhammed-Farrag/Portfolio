import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Starfield } from '../../components/Starfield';
import { events, type EventDef } from '../../content/events';
import type { SectionDef } from '../../content/site';
import { useMotionPaused } from '../../features/motion/motion';
import { mixSlots, slot, slotAlpha } from '../../features/palette/palette';
import { ceremonyScene, judgingScene, setSceneColors, victoryScene, type Density, type Scene } from '../../features/recognition/scenes';
import './Events.css';

const SCENES: Record<EventDef['scene'], () => Scene> = {
  victory: victoryScene,
  ceremony: ceremonyScene,
  judging: judgingScene,
};

/** Each story plays on its own, start to photograph, in this long. */
const PLAY_MS = 5000;
/** Then it rests on the photograph this long before the slideshow moves on (until the visitor takes over). */
const REST_MS = 4000;
/** A horizontal drag longer than this on the stage swipes to the next or previous moment. */
const SWIPE_PX = 50;

/** The scenes' dots in the palette: back tones a dimmed accent, front paper, props accent. */
const syncSceneColors = () =>
  setSceneColors({ tones: [mixSlots('accent', 'deep', 0.82), slot('paper'), slot('accent')], flash: slot('paper'), flashEdge: slotAlpha('paper', 0.6) });

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

const wrap = (i: number) => (i + events.length) % events.length;

/**
 * Important Events: a slideshow of three moments on one stage. The active moment's halftone scene
 * plays by itself for PLAY_MS once the stage is half on screen, its dots gather into the sharp
 * photograph, and a blurred enlargement of that photograph fills the stage behind. After REST_MS
 * it moves on to the next moment, until the visitor takes over with the tabs, the ‹ › buttons or a
 * swipe. Paused or reduced motion: no scenes and no advancing, just the photographs and the words.
 */
export function Events({ s }: { s: SectionDef }) {
  const live = !useMotionPaused();
  const id = useId();
  const [active, setActive] = useState(0);
  const [run, setRun] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  /** Set once the visitor uses a tab, a button or a swipe: the slideshow stops moving on by itself. */
  const steered = useRef(false);
  const control = useRef<{ start: (i: number) => void }>({ start: () => {} });
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const e = events[active]!;

  const goTo = (i: number, byVisitor: boolean) => {
    if (byVisitor) steered.current = true;
    setActive(wrap(i));
    setRun((n) => n + 1);
  };

  // The stage's animation: one canvas, one scene per moment (made once), driven by p in 0..1.
  useEffect(() => {
    const root = rootRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current;
    if (!live || !canvas) {
      root.style.setProperty('--photo', '1');
      root.style.setProperty('--p', '1');
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scenes = events.map((ev) => SCENES[ev.scene]());
    let disposed = false;
    let index = 0;
    let p = 0;
    let startedAt = 0;
    let frame = 0;
    let timer = 0;
    let visible = false;
    let begun = false;
    const view = { w: 0, h: 0, dpr: 1, cx: 0, ground: 0, photo: { x: 0, y: 0, w: 0, h: 0 } };

    const measure = () => {
      const photo = photoRef.current!;
      const box = canvas.getBoundingClientRect();
      // The dots land on the photograph as it rests, without the scale it lands with.
      photo.style.transform = 'none';
      const pb = photo.querySelector('img')!.getBoundingClientRect();
      photo.style.transform = '';
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.w = box.width;
      view.h = box.height;
      view.photo = { x: pb.left - box.left, y: pb.top - box.top, w: pb.width, h: pb.height };
      // The figures act where the photograph lands: centred on it, standing on its lower edge.
      view.cx = view.photo.x + view.photo.w / 2;
      view.ground = Math.min(view.h - 24, view.photo.y + view.photo.h * 0.92);
      canvas.width = Math.round(view.w * view.dpr);
      canvas.height = Math.round(view.h * view.dpr);
    };
    const paint = () => {
      const scene = scenes[index]!;
      const f = scene.frame(p);
      root.style.setProperty('--p', p.toFixed(4));
      root.style.setProperty('--photo', f.photo.toFixed(3));
      root.style.setProperty('--gather', f.gather.toFixed(3));
      scene.draw(ctx, p, view);
    };
    const rest = () => {
      clearTimeout(timer);
      if (!steered.current && visible) timer = window.setTimeout(() => goTo(index + 1, false), REST_MS);
    };
    const tick = (now: number) => {
      frame = 0;
      if (!startedAt) startedAt = now - p * PLAY_MS;
      p = Math.min(1, (now - startedAt) / PLAY_MS);
      paint();
      if (p < 1) frame = requestAnimationFrame(tick);
      else rest();
    };
    const resume = () => {
      if (frame || !begun) return;
      startedAt = 0;
      if (p < 1) frame = requestAnimationFrame(tick);
      else rest();
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      clearTimeout(timer);
    };
    control.current.start = (i: number) => {
      pause();
      index = i;
      p = 0;
      measure();
      paint();
      if (visible) {
        begun = true;
        resume();
      }
    };

    // The slideshow starts the first time half of the stage is on screen, and waits while it is off screen.
    const io = new IntersectionObserver(
      ([en]) => {
        visible = !!en?.isIntersecting;
        if (!visible) return pause();
        if (!begun) {
          begun = true;
          control.current.start(index);
        } else resume();
      },
      { threshold: 0.5 },
    );
    io.observe(stage);
    const ro = new ResizeObserver(() => {
      measure();
      paint();
    });
    ro.observe(canvas);
    syncSceneColors();
    measure();
    paint();
    events.forEach((ev, k) =>
      loadDensity(ev.photo.mask).then(
        (d) => {
          if (disposed) return;
          scenes[k]!.setTarget(d);
          if (k === index) paint();
        },
        () => {}, // Without the mask the dots fill the picture evenly.
      ),
    );
    return () => {
      disposed = true;
      pause();
      io.disconnect();
      ro.disconnect();
      control.current.start = () => {};
    };
  }, [live]);

  // A new moment (from a tab, a button, a swipe or the slideshow itself) plays from the start once
  // its photograph is in the page.
  useEffect(() => {
    if (run) control.current.start(active);
  }, [active, run]);

  const onTabKey = (ev: KeyboardEvent) => {
    const by = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
    if (!by) return;
    ev.preventDefault();
    const next = wrap(active + by);
    goTo(next, true);
    tabsRef.current[next]?.focus();
  };
  const onDown = (ev: PointerEvent) => {
    if ((ev.target as Element).closest('button, a')) return;
    swipe.current = { x: ev.clientX, y: ev.clientY };
  };
  const onUp = (ev: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = ev.clientX - start.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(ev.clientY - start.y)) goTo(active + (dx < 0 ? 1 : -1), true);
  };

  return (
    <section ref={rootRef} id={s.id} className={`section recog has-stars theme-${s.theme}`} data-blend={s.blendFrom} data-mode={live ? 'live' : 'static'} aria-labelledby={`${s.id}-title`}>
      <Starfield />
      <div className="container">
        <header className="recog__header">
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 id={`${s.id}-title`} className="display section__title">
            {s.title}
          </h2>
        </header>

        <div className="recog__tabs" role="tablist" aria-label="Moments" onKeyDown={onTabKey}>
          {events.map((ev, k) => (
            <button
              key={ev.id}
              ref={(el) => void (tabsRef.current[k] = el)}
              id={`${id}-tab-${k}`}
              type="button"
              role="tab"
              className="recog__tab"
              aria-selected={k === active}
              aria-controls={`${id}-stage`}
              tabIndex={k === active ? 0 : -1}
              onClick={() => goTo(k, true)}
            >
              <span className="recog__tab-number mono">{String(k + 1).padStart(2, '0')}</span>
              <span className="recog__tab-title">{ev.title}</span>
              <span className="recog__tab-progress" aria-hidden="true" />
            </button>
          ))}
        </div>

        <div
          ref={stageRef}
          id={`${id}-stage`}
          className="recog__stage"
          role="tabpanel"
          aria-labelledby={`${id}-tab-${active}`}
          data-event={e.scene}
          style={{ '--aspect': e.photo.width / e.photo.height, '--native-h': e.photo.height } as CSSProperties}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
        >
          <img className="recog__backdrop" src={e.photo.src} alt="" aria-hidden="true" draggable={false} />
          {live && <canvas ref={canvasRef} className="recog__canvas" aria-hidden="true" />}

          <div className="recog__award" key={`award-${active}`}>
            <p className="mono recog__team">
              <span className="recog__count">
                {String(active + 1).padStart(2, '0')} / {String(events.length).padStart(2, '0')}
              </span>{' '}
              {e.role}
            </p>
            <h3 className="recog__title display">{e.title}</h3>
            <p className="recog__event">{e.event}</p>
          </div>

          <figure className="recog__photo" ref={photoRef}>
            {/* Not draggable: a native image drag would cancel the swipe. */}
            <img src={e.photo.src} alt={e.photo.alt} width={e.photo.width} height={e.photo.height} decoding="async" draggable={false} />
            <figcaption className="mono">{e.photo.caption}</figcaption>
          </figure>

          <button type="button" className="recog__nav recog__nav--prev" aria-label="Previous moment" onClick={() => goTo(active - 1, true)}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="recog__nav recog__nav--next" aria-label="Next moment" onClick={() => goTo(active + 1, true)}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}
