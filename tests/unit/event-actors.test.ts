import { describe, expect, it } from 'vitest';
import {
  CEREMONY,
  CEREMONY_PLACES,
  CLAPS,
  HANDOFF,
  JUDGING,
  ceremonyAt,
  ceremonyStageAt,
  judgingAt,
  judgingStageAt,
  toStage,
  type Actor,
} from '../../src/features/recognition/actors';
import { BONES } from '../../src/features/recognition/figure';

const progress = Array.from({ length: 201 }, (_, k) => k / 200);
const feet = (a: Actor) => Math.min(toStage(a.joints.ankle[0], a.at).y, toStage(a.joints.ankle[1], a.at).y);
const hand = (a: Actor, arm: 0 | 1) => toStage(a.joints.hand[arm], a.at);
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('Event 2: the certificate', () => {
  it('everyone stands on their ground line', () => {
    for (const p of progress) {
      const f = ceremonyAt(p);
      expect(feet(f.recipient)).toBeCloseTo(BONES.ankle, 6);
      expect(feet(f.official)).toBeCloseTo(BONES.ankle, 6);
      for (const a of f.audience) expect(feet(a)).toBeCloseTo(CEREMONY_PLACES.audienceY + BONES.ankle * CEREMONY_PLACES.audienceScale, 6);
    }
  });

  it('the honoree walks up and the two hands meet on the certificate', () => {
    expect(ceremonyAt(0).recipient.at.x).toBeCloseTo(CEREMONY_PLACES.start, 6);
    expect(ceremonyAt(CEREMONY.walkEnd).recipient.at.x).toBeCloseTo(CEREMONY_PLACES.recipient, 6);
    const meet = ceremonyAt(CEREMONY.meet + 0.01);
    expect(dist(hand(meet.official, 1), HANDOFF), 'official').toBeLessThan(0.01);
    expect(dist(hand(meet.recipient, 1), HANDOFF), 'honoree').toBeLessThan(0.01);
  });

  it('the certificate is always in a hand: the official’s, then the honoree’s', () => {
    for (const p of progress) {
      const f = ceremonyAt(p);
      const holder = dist(f.certificate, hand(f.official, 1)) < 1e-9 || dist(f.certificate, hand(f.recipient, 1)) < 1e-9;
      expect(holder, `p=${p}`).toBe(true);
    }
    expect(dist(ceremonyAt(0.1).certificate, hand(ceremonyAt(0.1).official, 1))).toBeLessThan(1e-9);
    expect(dist(ceremonyAt(0.7).certificate, hand(ceremonyAt(0.7).recipient, 1))).toBeLessThan(1e-9);
  });

  it('the audience claps: their hands meet on every beat, and part between', () => {
    const span = CEREMONY.clapEnd - CEREMONY.clapStart;
    // Mid-applause, figure 0 is exactly on a clap at t = k / CLAPS.
    const onBeat = ceremonyAt(CEREMONY.clapStart + (span * 3) / CLAPS).audience[0]!;
    expect(dist(hand(onBeat, 0), hand(onBeat, 1))).toBeLessThan(0.01);
    const between = ceremonyAt(CEREMONY.clapStart + (span * 3.5) / CLAPS).audience[0]!;
    expect(dist(hand(between, 0), hand(between, 1))).toBeGreaterThan(0.06);
  });

  it('gathers into the photograph, with the stages in order', () => {
    expect(CEREMONY.clapEnd).toBeLessThanOrEqual(CEREMONY.gatherStart);
    expect(ceremonyAt(CEREMONY.gatherStart).gather).toBe(0);
    expect(ceremonyAt(CEREMONY.gatherEnd).gather).toBe(1);
    expect(ceremonyAt(1).photo).toBe(1);
    expect(progress.map(ceremonyStageAt)).toEqual([...progress.map(ceremonyStageAt)].sort((a, b) => a - b));
  });
});

describe('Event 3: the judge', () => {
  it('the judge and the teams stand on the ground', () => {
    for (const p of progress) {
      const f = judgingAt(p);
      expect(feet(f.judge)).toBeCloseTo(BONES.ankle, 6);
      for (const a of f.team) expect(feet(a)).toBeCloseTo(BONES.ankle * a.at.scale, 6);
    }
  });

  it('walks the floor left to right, pausing twice', () => {
    const xs = progress.map((p) => judgingAt(p).judge.at.x);
    expect(xs.every((x, i) => i === 0 || x >= xs[i - 1]! - 1e-9)).toBe(true);
    const still = (a: number, b: number) => expect(judgingAt(a).judge.at.x).toBeCloseTo(judgingAt(b).judge.at.x, 6);
    still(JUDGING.walk1End, JUDGING.look1End);
    still(JUDGING.walk2End, JUDGING.look2End);
  });

  it('flashes once, then gathers into the clipping, then hands over to it', () => {
    expect(judgingAt(JUDGING.flash).flash).toBe(1);
    expect(judgingAt(JUDGING.flash - 0.05).flash).toBe(0);
    expect(judgingAt(JUDGING.gatherStart).flash).toBe(0);
    expect(judgingAt(JUDGING.gatherStart).gather).toBe(0);
    expect(judgingAt(JUDGING.gatherEnd).gather).toBe(1);
    expect(judgingAt(1).photo).toBe(1);
    expect(progress.map(judgingStageAt)).toEqual([...progress.map(judgingStageAt)].sort((a, b) => a - b));
  });
});
