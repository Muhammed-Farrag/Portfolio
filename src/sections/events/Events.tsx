import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Pending } from '../../components/Pending';
import { events, type EventDef } from '../../content/events';
import type { SectionDef } from '../../content/site';
import { useMotionPaused } from '../../features/motion/motion';
import { CEREMONY_STAGES, JUDGING_STAGES } from '../../features/recognition/actors';
import { STAGES } from '../../features/recognition/figure';
import { ceremonyScene, judgingScene, victoryScene, type Scene } from '../../features/recognition/scenes';
import './Events.css';

const SCENES: Record<EventDef['scene'], { create: (small: boolean) => Scene; stages: readonly string[] }> = {
  victory: { create: victoryScene, stages: STAGES },
  ceremony: { create: ceremonyScene, stages: CEREMONY_STAGES },
  judging: { create: judgingScene, stages: JUDGING_STAGES },
};

/** Scroll progress through the track: 0 when it reaches the top of the viewport, 1 at its end. */
function trackProgress(track: HTMLElement): number {
  const box = track.getBoundingClientRect();
  const span = box.height - window.innerHeight;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, -box.top / span));
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
    const scene = create(matchMedia('(max-width: 767.98px)').matches);
    let frame = 0;
    const view = { w: 0, h: 0, dpr: 1, cx: 0, ground: 0, photo: { x: 0, y: 0, w: 0, h: 0 } };

    const render = () => {
      frame = 0;
      const p = trackProgress(track);
      const f = scene.frame(p);
      track.style.setProperty('--p', p.toFixed(4));
      track.style.setProperty('--photo', f.photo.toFixed(3));
      track.dataset.stage = String(f.stage);
      setStage(f.stage);
      scene.draw(ctx, p, view);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const pb = photo.getBoundingClientRect();
      // The stage centre and ground line come from CSS, so the photograph lands where the figures stood.
      const style = getComputedStyle(track);
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      view.w = box.width;
      view.h = box.height;
      view.cx = Number(style.getPropertyValue('--cx').trim() || 0.5) * box.width;
      view.ground = Number(style.getPropertyValue('--ground').trim() || 0.8) * box.height;
      view.photo = { x: pb.left - box.left, y: pb.top - box.top, w: pb.width, h: pb.height };
      canvas.width = Math.round(view.w * view.dpr);
      canvas.height = Math.round(view.h * view.dpr);
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('scroll', schedule, { passive: true });
    resize();
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [live, near, create]);

  const aspect = e.photo.width / e.photo.height;
  return (
    <div className="recog__track" ref={trackRef} data-event={e.scene} style={{ '--photo': live ? 0 : 1, '--aspect': aspect } as CSSProperties}>
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
      </div>
      <span id={endId} className="recog__end" />
    </div>
  );
}

/** Important Events: three moments, each a symbolic particle scene that hands over to the real photograph. */
export function Events({ s }: { s: SectionDef }) {
  const live = !useMotionPaused();
  return (
    <section id={s.id} className={`section recog theme-${s.theme}`} data-blend={s.blendFrom} data-beat="Important events" data-beat-scrub="" data-beat-min="54000" data-beat-effect="warp" data-backdrop="rays" data-mode={live ? 'live' : 'static'} aria-labelledby={`${s.id}-title`}>
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
