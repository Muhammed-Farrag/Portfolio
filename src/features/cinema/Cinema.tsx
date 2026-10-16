import { useEffect, useRef, useState } from 'react';
import { isMotionPaused } from '../motion/motion';
import { countWords, makePlan, positionAt, type BeatSpec, type Plan } from './director';
import './Cinema.css';

/** Set once the sequence has played or been skipped in this tab, so a reload does not replay it. */
const SEEN_KEY = 'portfolio:cinema';
/** Lets the hero's portrait assemble before the sequence measures and starts. */
const START_DELAY = 400;

type State = 'off' | 'playing' | 'paused' | 'done';

/** Each section names the transition that brings it on screen (data-beat-effect). */
export type Effect = 'warp' | 'clouds' | 'wipe' | 'ripple' | 'cards' | 'rays';

const seen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === 'done';
  } catch {
    return false;
  }
};
const remember = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, 'done');
  } catch {
    // Storage can be unavailable; the sequence then simply plays again on reload.
  }
};

/** The page's own scroll behaviour is smooth; the sequence positions it exactly, every frame. */
const scrollToY = (y: number) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });

/** Words a reader would actually read: visible text, minus decoration and interactive demos. */
function readableWords(el: HTMLElement): number {
  let words = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement;
    if (!parent || parent.closest('[aria-hidden="true"], [data-cinema-skip], [data-pending], .visually-hidden')) continue;
    words += countWords(n.textContent ?? '');
  }
  return words;
}

/** Measures every [data-beat] section into scene specs. */
function measure(): BeatSpec[] {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const sections = [...document.querySelectorAll<HTMLElement>('[data-beat]')];
  return sections.map((el, i) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const last = i === sections.length - 1;
    // Arrive with the section's top at the top of the viewport (the hero at 0); tall sections then
    // move through to their end; the last one runs to the bottom of the page (the footer).
    const from = i === 0 ? 0 : Math.min(max, top);
    const bottom = last ? max : top + el.offsetHeight - window.innerHeight;
    return {
      id: el.id,
      label: el.dataset.beat ?? el.id,
      words: readableWords(el),
      minMs: Number(el.dataset.beatMin ?? 0),
      from,
      to: Math.max(from, Math.min(max, bottom)),
      scrub: el.hasAttribute('data-beat-scrub'),
    };
  });
}

/**
 * The opening sequence. On every visit (once per tab) the page plays itself: each section arrives
 * with its own transition and stays long enough to be read. Any wheel, touch, key or navigation
 * click hands control to the visitor. Reduced motion, a link to a section, or an earlier pass in
 * this tab skip it.
 */
export function Cinema() {
  const [state, setState] = useState<State>('off');
  const [scene, setScene] = useState({ index: 0, count: 0, label: '' });
  const barRef = useRef<HTMLSpanElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const control = useRef({ paused: false, finish: () => {} });

  useEffect(() => {
    const root = document.documentElement;
    if (isMotionPaused() || location.hash || seen()) {
      root.dataset.cinema = 'done';
      // A link to a section: the browser looked for it before the page had rendered, so go there
      // now, and again once the fonts have settled the layout.
      const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) {
        const go = () => target.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
        go();
        void document.fonts?.ready.then(go);
      }
      return;
    }

    let plan: Plan = { beats: [], total: 0 };
    let elapsed = 0;
    let last = 0;
    let frame = 0;
    let shownIndex = -1;
    let expectedY = 0;
    let finished = false;
    const timers: number[] = [];

    const playEffect = (index: number) => {
      const veil = veilRef.current;
      const el = document.getElementById(plan.beats[index]?.id ?? '');
      const effect = el?.dataset.beatEffect;
      if (!veil || !effect) return;
      veil.dataset.effect = '';
      void veil.offsetWidth; // restart the animation
      veil.dataset.effect = effect;
    };

    const teardown = () => {
      finished = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      off.forEach((f) => f());
    };
    const finish = () => {
      if (finished) return;
      teardown();
      remember();
      root.dataset.cinema = 'done';
      setState('done');
    };

    const tick = (now: number) => {
      // A long frame (a busy device) still advances the clock, up to a quarter second at a time.
      const dt = last ? Math.min(250, now - last) : 0;
      last = now;
      if (!control.current.paused) elapsed += dt;
      // The visitor dragged the scrollbar or used find-in-page: hand over.
      if (Math.abs(window.scrollY - expectedY) > 40) return finish();
      const pos = positionAt(plan, elapsed);
      expectedY = Math.round(pos.y);
      scrollToY(expectedY);
      if (pos.index !== shownIndex) {
        shownIndex = pos.index;
        setScene({ index: pos.index, count: plan.beats.length, label: plan.beats[pos.index]!.label });
        if (pos.index > 0) playEffect(pos.index);
      }
      barRef.current?.style.setProperty('transform', `scaleX(${plan.total ? Math.min(1, elapsed / plan.total) : 1})`);
      if (pos.phase === 'done') return finish();
      frame = requestAnimationFrame(tick);
    };

    // Any input from the visitor ends the sequence (the controls themselves excepted).
    const interrupt = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('.cinema')) return;
      finish();
    };
    const opts = { passive: true, capture: true } as const;
    const off = [
      ['wheel', interrupt],
      ['touchstart', interrupt],
      ['keydown', interrupt],
      ['mousedown', interrupt],
    ].map(([type, fn]) => {
      window.addEventListener(type as string, fn as EventListener, opts);
      return () => window.removeEventListener(type as string, fn as EventListener, opts);
    });

    control.current.finish = finish;
    root.dataset.cinema = 'playing';
    scrollToY(0);
    setState('playing');
    timers.push(
      window.setTimeout(() => {
        plan = makePlan(measure());
        expectedY = window.scrollY;
        frame = requestAnimationFrame(tick);
      }, START_DELAY),
    );
    // Images and fonts change the layout; re-measure without losing our place.
    const remeasure = () => {
      if (!finished && plan.total) plan = makePlan(measure());
    };
    window.addEventListener('resize', remeasure);
    off.push(() => window.removeEventListener('resize', remeasure));

    // Unmounting (or React's development double-run) stops the sequence without marking it seen.
    return teardown;
  }, []);

  // After the sequence, each section still arrives with its transition when the visitor scrolls down to it.
  useEffect(() => {
    if (state !== 'done' && document.documentElement.dataset.cinema !== 'done') return;
    const veil = veilRef.current;
    if (!veil || isMotionPaused()) return;
    let lastY = window.scrollY;
    const io = new IntersectionObserver(
      (entries) => {
        const down = window.scrollY > lastY;
        lastY = window.scrollY;
        for (const e of entries) {
          const effect = (e.target as HTMLElement).dataset.beatEffect;
          if (!e.isIntersecting || !down || !effect) continue;
          veil.dataset.effect = '';
          void veil.offsetWidth;
          veil.dataset.effect = effect;
        }
      },
      { rootMargin: '0px 0px -55% 0px' },
    );
    document.querySelectorAll('[data-beat-effect]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [state]);

  const togglePause = () => {
    control.current.paused = !control.current.paused;
    setState(control.current.paused ? 'paused' : 'playing');
  };

  return (
    <>
      <div ref={veilRef} className="veil" aria-hidden="true" onAnimationEnd={(e) => e.target === e.currentTarget && (e.currentTarget.dataset.effect = '')}>
        <i />
        <i />
        <i />
        <i />
      </div>
      {(state === 'playing' || state === 'paused') && (
        <div className="cinema" role="region" aria-label="Opening sequence">
          <ol className="cinema__track" aria-hidden="true">
            {Array.from({ length: scene.count }, (_, k) => (
              <li key={k} data-state={k < scene.index ? 'done' : k === scene.index ? 'active' : undefined} />
            ))}
          </ol>
          <p className="cinema__label" aria-live="polite">
            <span className="cinema__count">
              {scene.count ? `${scene.index + 1}/${scene.count}` : ''}
            </span>{' '}
            {scene.label}
          </p>
          <div className="cinema__bar" aria-hidden="true">
            <span ref={barRef} />
          </div>
          <button type="button" className="cinema__button" onClick={togglePause}>
            {state === 'paused' ? 'Play' : 'Pause'}
          </button>
          <button type="button" className="cinema__button cinema__button--skip" onClick={() => control.current.finish()}>
            Skip intro
          </button>
        </div>
      )}
    </>
  );
}
