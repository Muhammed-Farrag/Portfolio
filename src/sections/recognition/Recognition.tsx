import { useEffect, useRef, useState, type CSSProperties } from 'react';
import photoUrl from '../../assets/recognition/roborave-beijing-2025.webp';
import type { SectionDef } from '../../content/site';
import { useMotionPaused } from '../../features/motion/motion';
import { STAGES, createParticles, frameAt, placeParticles, type Particles } from '../../features/recognition/figure';
import './Recognition.css';

const COLORS = { back: '#8ba3c5', front: '#f0ecdd', trophy: '#f0ecdd', trophyDim: '#b3c4dc', ground: '#495b7d' } as const;

/** Scroll progress through the track: 0 when it reaches the top of the viewport, 1 at its end. */
function trackProgress(track: HTMLElement): number {
  const box = track.getBoundingClientRect();
  const span = box.height - window.innerHeight;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, -box.top / span));
}

/** Draws one frame of the scene. The figure is laid out around the stage centre `cx`. */
function draw(ctx: CanvasRenderingContext2D, ps: Particles, buf: Float32Array, p: number, w: number, h: number, dpr: number, cx: number, groundAt: number) {
  const f = frameAt(p);
  const scale = Math.min(h * 0.46, w * (w < 768 ? 0.62 : 0.36));
  const ground = h * groundAt;
  const size = Math.max(1.6, scale / 190) * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w * dpr, h * dpr);

  // The ground: a dotted line that dissolves with the figure.
  const fade = 1 - f.disperse;
  if (fade > 0) {
    ctx.globalAlpha = 0.7 * fade;
    ctx.fillStyle = COLORS.ground;
    for (let x = 0; x < w; x += 6) ctx.fillRect(x * dpr, ground * dpr, size * 0.8, size * 0.8);
  }

  placeParticles(ps, f, buf);
  const alpha = 1 - f.disperse ** 1.6;
  if (alpha <= 0.002) return;
  for (let i = 0; i < ps.count; i++) {
    const part = ps.part[i]!;
    const s = ps.seed[i]!;
    ctx.fillStyle =
      part === 'trophy' ? (s > 0.35 ? COLORS.trophy : COLORS.trophyDim) : part.endsWith('0') ? COLORS.back : s > 0.82 ? COLORS.back : COLORS.front;
    ctx.globalAlpha = alpha * (part.endsWith('0') ? 0.7 : 0.75 + s * 0.25);
    const x = (cx + buf[i * 2]! * scale) * dpr;
    const y = (ground - buf[i * 2 + 1]! * scale) * dpr;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}

export function Recognition({ s }: { s: SectionDef }) {
  const paused = useMotionPaused();
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [stage, setStage] = useState(0);
  const live = !paused;

  // The canvas exists only while the scene is near the viewport.
  useEffect(() => {
    if (!live) return;
    const io = new IntersectionObserver(([e]) => setNear(!!e?.isIntersecting), { rootMargin: '50% 0px' });
    io.observe(trackRef.current!);
    return () => io.disconnect();
  }, [live]);

  useEffect(() => {
    const track = trackRef.current!;
    const canvas = canvasRef.current;
    if (!live || !near || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const small = matchMedia('(max-width: 767.98px)').matches;
    const ps = createParticles(small ? 1300 : 2400);
    const buf = new Float32Array(ps.count * 2);
    let frame = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const render = () => {
      frame = 0;
      const p = trackProgress(track);
      track.style.setProperty('--p', p.toFixed(4));
      const f = frameAt(p);
      track.style.setProperty('--photo', f.photo.toFixed(3));
      track.dataset.stage = String(f.stage);
      setStage(f.stage);
      // The stage centre and ground line come from CSS, so the photograph lands where the figure stood.
      const style = getComputedStyle(track);
      const cx = Number(style.getPropertyValue('--cx').trim() || 0.5) * w;
      draw(ctx, ps, buf, p, w, h, dpr, cx, Number(style.getPropertyValue('--ground').trim() || 0.8));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
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
  }, [live, near]);

  return (
    <section id={s.id} className={`section recog theme-${s.theme}`} data-blend={s.blendFrom} data-beat="Important events" data-beat-scrub="" data-beat-min="24000" data-beat-effect="warp" data-backdrop="rays" data-mode={live ? 'live' : 'static'} aria-labelledby={`${s.id}-title`}>
      <div className="recog__track" ref={trackRef} style={{ '--photo': live ? 0 : 1 } as CSSProperties}>
        <div className="recog__sticky">
          <div className="container recog__head">
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 id={`${s.id}-title`} className="display section__title">
              {s.title}
            </h2>
            {live && (
              <a className="recog__skip" href="#recognition-award">
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

          <figure className="recog__photo">
            <img src={photoUrl} alt="Muhammed Farrag on the RoboRAVE 2025 arena floor, wearing the Egyptian flag and holding a trophy." width={582} height={805} loading="lazy" decoding="async" />
            <figcaption className="mono">Photograph · Beijing, August 2025 · supplied by Muhammed</figcaption>
          </figure>

          <div className="recog__award">
            <p className="mono recog__team">Montura · Competitor</p>
            <h3 className="recog__title display">Best Creativity Trophy</h3>
            <p className="recog__event">RoboRAVE International Entrepreneurial Challenge · Beijing · August 2025</p>
            <ul className="recog__evidence" aria-label="Evidence">
              <li>Source: CV</li>
              <li>Photo: supplied by Muhammed</li>
            </ul>
            {live && <p className="recog__note">The figure is a symbolic animation; the photograph is the real moment.</p>}
          </div>

          {live && (
            <ol className="recog__stages mono" aria-hidden="true">
              {STAGES.map((label, k) => (
                <li key={label} data-state={k < stage ? 'done' : k === stage ? 'active' : undefined}>
                  {label}
                </li>
              ))}
            </ol>
          )}
        </div>
        <span id="recognition-award" className="recog__end" />
      </div>
    </section>
  );
}
