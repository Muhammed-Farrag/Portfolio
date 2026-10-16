import { describe, expect, it } from 'vitest';
import { TRAVEL_MS, countWords, holdMs, makePlan, positionAt, readingMs, type BeatSpec } from '../../src/features/cinema/director';

const spec = (id: string, words: number, minMs: number, from: number, to = from, scrub = false): BeatSpec => ({ id, label: id, words, minMs, from, to, scrub });

describe('cinema director', () => {
  it('gives an average reader time for 80% of the words at 220 wpm, plus 1.5 s', () => {
    expect(readingMs(0)).toBe(1500);
    // 110 words: 88 words at 220 wpm = 24 s, plus 1.5 s.
    expect(readingMs(110)).toBe(25_500);
  });

  it('holds each scene for its animation or its reading time, whichever is longer', () => {
    expect(holdMs(spec('a', 10, 6000, 0))).toBe(6000);
    expect(holdMs(spec('b', 220, 6000, 0))).toBe(readingMs(220));
  });

  it('lays the scenes end to end with a transition between them', () => {
    const plan = makePlan([spec('hero', 8, 6000, 0), spec('events', 40, 20_000, 900, 4000, true), spec('contact', 30, 0, 6000)]);
    const [a, b, c] = plan.beats;
    expect([a!.start, a!.arrive, a!.end]).toEqual([0, 0, 6000]);
    expect(b!.start).toBe(6000);
    expect(b!.arrive).toBe(6000 + TRAVEL_MS);
    expect(c!.start).toBe(b!.end);
    expect(plan.total).toBe(c!.end);
  });

  it('travels between scenes, moves through tall scenes, and ends on the last one', () => {
    const plan = makePlan([spec('hero', 8, 6000, 0), spec('events', 40, 20_000, 900, 4000, true), spec('contact', 30, 0, 6000)]);
    const [, b] = plan.beats;
    expect(positionAt(plan, 1000)).toMatchObject({ y: 0, index: 0, phase: 'hold' });
    const mid = positionAt(plan, b!.start + TRAVEL_MS / 2);
    expect(mid.phase).toBe('travel');
    expect(mid.y).toBeCloseTo(450, 0);
    // A scrubbed scene moves at a constant speed, so its animation plays at an even pace.
    const half = positionAt(plan, (b!.arrive + b!.end) / 2);
    expect(half).toMatchObject({ index: 1, phase: 'hold' });
    expect(half.y).toBeCloseTo(2450, 0);
    expect(positionAt(plan, plan.total + 10)).toMatchObject({ y: 6000, index: 2, phase: 'done' });
  });

  it('is monotonic while moving down the page', () => {
    const plan = makePlan([spec('hero', 8, 6000, 0), spec('events', 40, 20_000, 900, 4000, true), spec('contact', 30, 0, 6000)]);
    let last = -1;
    for (let t = 0; t <= plan.total; t += 50) {
      const { y } = positionAt(plan, t);
      expect(y).toBeGreaterThanOrEqual(last - 1e-6);
      last = y;
    }
  });

  it('counts words, including Arabic and numbers', () => {
    expect(countWords('Best Creativity Trophy · Beijing · August 2025')).toBe(6);
    expect(countWords('رواد مصر الرقمية 2026')).toBe(4);
  });
});
