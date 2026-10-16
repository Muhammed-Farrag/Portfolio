import { useEffect, useRef } from 'react';
import { useMotionPaused } from '../features/motion/motion';

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

/** Stars within this distance of the pointer brighten and link into a small constellation. */
const REACH = 150;
const LINK = 90;

/**
 * The Hero's night sky: a field of twinkling stars on Storm. Moving the pointer over the hero
 * wakes the nearby stars, which brighten, grow and join with faint lines. The loop runs only while
 * the hero is on screen, and draws one still frame when motion is paused.
 */
export function HeroStars() {
  const ref = useRef<HTMLCanvasElement>(null);
  const paused = useMotionPaused();

  useEffect(() => {
    const canvas = ref.current!;
    const host = canvas.parentElement!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let frame = 0;
    let visible = true;
    const pointer = { x: -1e4, y: -1e4, energy: 0 };

    const seed = () => {
      const count = Math.round((w * h) / 4200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.08 ? 1.4 + Math.random() : 0.5 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
      }));
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const lit: [number, number, number][] = [];
      // Warp: as the hero scrolls away, every star streaks out from the centre (the transition
      // into the next scene). A pure function of the scroll position.
      const warp = paused ? 0 : Math.min(1, Math.max(0, window.scrollY / (h * 0.7)));
      if (warp > 0.01) {
        ctx.strokeStyle = '#f0ecdd';
        ctx.lineCap = 'round';
        for (const s of stars) {
          const k = warp * warp * 0.9 * (0.5 + s.speed / 3);
          ctx.globalAlpha = Math.min(1, 0.35 + warp) * (1 - warp * 0.35);
          ctx.lineWidth = s.r * 1.2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + (s.x - w / 2) * k, s.y + (s.y - h / 2) * k);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        return;
      }
      for (const s of stars) {
        const twinkle = paused ? 0.7 : 0.55 + 0.45 * Math.sin(s.phase + t * 0.001 * s.speed);
        const d = Math.hypot(s.x - pointer.x, s.y - pointer.y);
        const wake = d < REACH ? (1 - d / REACH) * pointer.energy : 0;
        if (wake > 0.25) lit.push([s.x, s.y, wake]);
        ctx.globalAlpha = Math.min(1, 0.25 + twinkle * 0.55 + wake * 0.6);
        ctx.fillStyle = wake > 0.2 ? '#f0ecdd' : '#b3c4dc';
        const r = s.r * (1 + wake * 1.4);
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (r > 1.6) {
          // A soft cross-shaped glint on the brightest stars.
          ctx.globalAlpha *= 0.35;
          ctx.fillRect(s.x - r * 3, s.y - 0.4, r * 6, 0.8);
          ctx.fillRect(s.x - 0.4, s.y - r * 3, 0.8, r * 6);
        }
      }
      // Constellation lines between the woken stars.
      ctx.strokeStyle = '#b3c4dc';
      ctx.lineWidth = 0.7;
      for (let i = 0; i < lit.length; i++) {
        for (let j = i + 1; j < lit.length; j++) {
          const [ax, ay, aw] = lit[i]!;
          const [bx, by, bw] = lit[j]!;
          const d = Math.hypot(ax - bx, ay - by);
          if (d > LINK) continue;
          ctx.globalAlpha = Math.min(aw, bw) * (1 - d / LINK) * 0.7;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      frame = 0;
      // The pointer's influence fades when it stops moving or leaves.
      pointer.energy *= 0.985;
      draw(t);
      if (visible && !paused) frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (paused) draw(0);
      else if (!frame && visible) frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const box = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width;
      h = box.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      seed();
      draw(performance.now());
    };
    const onMove = (e: PointerEvent) => {
      const box = host.getBoundingClientRect();
      pointer.x = e.clientX - box.left;
      pointer.y = e.clientY - box.top;
      pointer.energy = 1;
      if (paused) draw(0);
    };
    const onLeave = () => {
      pointer.energy = 0;
      if (paused) draw(0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    resize();
    start();
    return () => {
      ro.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [paused]);

  return <canvas ref={ref} className="hero__stars" aria-hidden="true" />;
}
