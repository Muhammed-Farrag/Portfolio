import { useEffect, useId, useRef, useState } from 'react';
import { useMotionPaused } from '../../features/motion/motion';

/** Planets: orbit radius and size (viewBox units), period (seconds), starting angle and tone. */
const PLANETS = [
  { r: 52, size: 5, period: 9, start: 0.4, tone: 'mist' },
  { r: 84, size: 8, period: 15, start: 2.2, tone: 'moonlight' },
  { r: 118, size: 7, period: 24, start: 4.1, tone: 'frost' },
  { r: 156, size: 11, period: 38, start: 1.1, tone: 'steel' },
] as const;
const CX = 200;
const CY = 150;

/**
 * Lumina's solar-system module, in miniature. The orbits turn on their own; moving over them (or
 * the slider) tilts the view, the way Lumina itself follows a hand. Paused motion freezes the
 * planets; nothing animates while the visual is off screen.
 */
export function LuminaOrbits() {
  const paused = useMotionPaused();
  const [tilt, setTilt] = useState(55);
  const tiltRef = useRef(tilt);
  const svgRef = useRef<SVGSVGElement>(null);
  // Each planet is drawn twice, behind and in front of the sun; the side of its orbit picks one.
  const planetRefs = useRef<{ back: SVGCircleElement | null; front: SVGCircleElement | null }[]>(PLANETS.map(() => ({ back: null, front: null })));
  const elapsed = useRef(0);
  const place = useRef(() => {});
  // useId contains colons, which do not belong in a url(#…) reference.
  const id = useId().replace(/:/g, '');
  tiltRef.current = tilt;

  place.current = () => {
    const squash = Math.sin((tiltRef.current * Math.PI) / 180);
    PLANETS.forEach((p, i) => {
      const { back, front } = planetRefs.current[i]!;
      if (!back || !front) return;
      const a = p.start + (elapsed.current / p.period) * Math.PI * 2;
      const behind = Math.sin(a) < 0;
      const cx = (CX + p.r * Math.cos(a)).toFixed(2);
      const cy = (CY + p.r * Math.sin(a) * squash).toFixed(2);
      for (const el of [back, front]) {
        el.setAttribute('cx', cx);
        el.setAttribute('cy', cy);
      }
      back.style.visibility = behind ? 'visible' : 'hidden';
      front.style.visibility = behind ? 'hidden' : 'visible';
    });
  };

  useEffect(() => {
    const svg = svgRef.current!;
    let frame = 0;
    let visible = false;
    let last = 0;
    const tick = (now: number) => {
      elapsed.current += last ? Math.min(100, now - last) / 1000 : 0;
      last = now;
      place.current();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame || paused || !visible) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(svg);
    return () => {
      io.disconnect();
      stop();
    };
  }, [paused]);

  // A new tilt redraws at once, also while the motion is paused.
  useEffect(() => place.current(), [tilt]);
  const squash = Math.sin((tilt * Math.PI) / 180);

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setTilt(Math.round(15 + ((e.clientY - box.top) / box.height) * 70));
  };

  return (
    <div className="lumina">
      <svg ref={svgRef} className="lumina__stage" viewBox="0 0 400 300" aria-hidden="true" onPointerMove={onPointer}>
        <defs>
          <radialGradient id={`${id}-sun`}>
            <stop offset="0" stopColor="var(--p-paper)" />
            <stop offset="0.45" stopColor="var(--p-paper)" stopOpacity="0.7" />
            <stop offset="1" stopColor="var(--p-paper)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {PLANETS.map((p) => (
          <ellipse key={p.r} className="lumina__orbit" cx={CX} cy={CY} rx={p.r} ry={p.r * squash} />
        ))}
        {PLANETS.map((p, i) => (
          <circle key={p.r} ref={(el) => void (planetRefs.current[i]!.back = el)} className="lumina__planet" data-tone={p.tone} r={p.size} cx={CX + p.r} cy={CY} />
        ))}
        <circle cx={CX} cy={CY} r={34} fill={`url(#${id}-sun)`} />
        <circle className="lumina__sun" cx={CX} cy={CY} r={14} />
        {PLANETS.map((p, i) => (
          <circle key={p.r} ref={(el) => void (planetRefs.current[i]!.front = el)} className="lumina__planet" data-tone={p.tone} r={p.size} cx={CX + p.r} cy={CY} />
        ))}
      </svg>
      <div className="lumina__footer">
        <label className="lumina__control" htmlFor={`${id}-tilt`}>
          <span className="mono">View angle</span>
          <input id={`${id}-tilt`} type="range" min={15} max={85} value={tilt} onChange={(e) => setTilt(Number(e.target.value))} />
        </label>
        <p className="lumina__note">Move over the orbits to tilt them. Lumina itself follows your hand.</p>
      </div>
    </div>
  );
}
