// The opening autoplay sequence ("cinema"), as pure functions of elapsed time. The runtime
// (Cinema.tsx) measures the sections, builds a plan and scrolls the page to `positionAt(t)` every
// frame, so every scroll-driven scene plays exactly as it does when a visitor scrolls by hand.

/** Average adult silent-reading speed for on-screen text, words per minute. */
export const READING_WPM = 220;
/** Each scene stays long enough for an average reader to read this share of its text. */
export const READ_SHARE = 0.8;
/** Time to find the text when a scene arrives, seconds. */
export const READ_BUFFER_S = 1.5;
/** The transition between two scenes, milliseconds. */
export const TRAVEL_MS = 1800;

/** How long an average reader needs to read READ_SHARE of `words` words, in milliseconds. */
export function readingMs(words: number): number {
  return Math.round(((READ_SHARE * Math.max(0, words)) / (READING_WPM / 60) + READ_BUFFER_S) * 1000);
}

export interface BeatSpec {
  id: string;
  label: string;
  /** Words of readable text in the scene. */
  words: number;
  /** The scene's own animation needs at least this long, milliseconds. */
  minMs: number;
  /** Scroll position when the scene arrives, and at the end of its hold (tall or scrubbed scenes move through). */
  from: number;
  to: number;
  /** Scrubbed scenes (a scroll-driven animation) move at a constant speed; others ease. */
  scrub?: boolean;
}

export interface Beat extends BeatSpec {
  /** When the transition into this scene starts, when it arrives, and when its hold ends (ms). */
  start: number;
  arrive: number;
  end: number;
}

export interface Plan {
  beats: Beat[];
  total: number;
}

export function holdMs(spec: BeatSpec): number {
  return Math.max(spec.minMs, readingMs(spec.words));
}

export function makePlan(specs: BeatSpec[]): Plan {
  let t = 0;
  const beats = specs.map((spec, i) => {
    const start = t;
    const arrive = start + (i === 0 ? 0 : TRAVEL_MS);
    const end = arrive + holdMs(spec);
    t = end;
    return { ...spec, start, arrive, end };
  });
  return { beats, total: t };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Ease in and out (smootherstep), for travel between scenes. */
export const ease = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export interface Position {
  /** Scroll position. */
  y: number;
  /** Index of the current scene. */
  index: number;
  phase: 'travel' | 'hold' | 'done';
  /** Progress through the current phase, 0..1. */
  local: number;
}

/** Where the page should be `t` ms into the sequence. */
export function positionAt(plan: Plan, t: number): Position {
  const { beats } = plan;
  if (!beats.length) return { y: 0, index: 0, phase: 'done', local: 1 };
  if (t >= plan.total) {
    const last = beats[beats.length - 1]!;
    return { y: last.to, index: beats.length - 1, phase: 'done', local: 1 };
  }
  const index = Math.max(0, beats.findIndex((b) => t < b.end));
  const b = beats[index]!;
  if (t < b.arrive) {
    const prev = beats[index - 1];
    const local = (t - b.start) / (b.arrive - b.start);
    const from = prev ? prev.to : b.from;
    return { y: from + (b.from - from) * ease(local), index, phase: 'travel', local };
  }
  const local = (t - b.arrive) / (b.end - b.arrive);
  const k = b.scrub ? clamp01(local) : ease(local);
  return { y: b.from + (b.to - b.from) * k, index, phase: 'hold', local };
}

/** Counts words in a string of readable text. */
export function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) ?? []).length;
}
