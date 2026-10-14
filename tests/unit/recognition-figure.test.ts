import { describe, expect, it } from 'vitest';
import { BONES, STAGE, TIMELINE, TROPHY, createParticles, frameAt, inTrophy, placeParticles, stageAt } from '../../src/features/recognition/figure';

const progress = Array.from({ length: 201 }, (_, k) => k / 200);

describe('the Moment of Victory figure', () => {
  it('always stands on the ground: the lower ankle rests at ankle height', () => {
    for (const p of progress) {
      const { ankle } = frameAt(p).joints;
      expect(Math.min(ankle[0].y, ankle[1].y)).toBeCloseTo(BONES.ankle, 6);
    }
  });

  it('walks on from the left and stops in front of the trophy', () => {
    expect(frameAt(0).joints.hip.x).toBeCloseTo(STAGE.startX, 6);
    const stop = frameAt(TIMELINE.walkEnd).joints.hip.x;
    expect(stop).toBeCloseTo(STAGE.stopX, 6);
    for (const p of progress.filter((q) => q > TIMELINE.walkEnd)) expect(frameAt(p).joints.hip.x).toBeCloseTo(stop, 6);
    // The walk advances monotonically.
    const xs = progress.filter((q) => q <= TIMELINE.walkEnd).map((q) => frameAt(q).joints.hip.x);
    expect(xs.every((x, i) => i === 0 || x >= xs[i - 1]!)).toBe(true);
  });

  it('the trophy waits on the ground until the hand reaches it, then travels with the hand', () => {
    expect(frameAt(0.1).trophy).toEqual({ x: STAGE.trophyX, y: 0 });
    const bent = frameAt(TIMELINE.bend + 0.01);
    const grip = { x: bent.trophy.x + TROPHY.grip.x, y: bent.trophy.y + TROPHY.grip.y };
    expect(Math.hypot(bent.joints.hand[1].x - grip.x, bent.joints.hand[1].y - grip.y), 'hand on the grip').toBeLessThan(0.01);
    for (const p of [TIMELINE.grasp, TIMELINE.lift, TIMELINE.raise, 0.75]) {
      const f = frameAt(p);
      expect(f.trophy.x + TROPHY.grip.x).toBeCloseTo(f.joints.hand[1].x, 6);
      expect(f.trophy.y + TROPHY.grip.y).toBeCloseTo(f.joints.hand[1].y, 6);
    }
  });

  it('bends down to pick it up and raises it above the head', () => {
    const standing = frameAt(TIMELINE.walkEnd).joints;
    const bent = frameAt(TIMELINE.bend).joints;
    const raised = frameAt(TIMELINE.raise).joints;
    expect(bent.hip.y).toBeLessThan(standing.hip.y - 0.1);
    expect(bent.head.y).toBeLessThan(standing.head.y - 0.3);
    expect(raised.hand[1].y, 'trophy hand above the head').toBeGreaterThan(raised.head.y + 0.15);
  });

  it('disperses, then hands over to the photograph, in order', () => {
    expect(frameAt(TIMELINE.disperseStart).disperse).toBe(0);
    expect(frameAt(TIMELINE.disperseEnd).disperse).toBe(1);
    expect(frameAt(TIMELINE.photoStart).photo).toBe(0);
    expect(frameAt(1).photo).toBe(1);
    expect(progress.map(stageAt)).toEqual([...progress.map(stageAt)].sort((a, b) => a - b));
    expect(stageAt(0)).toBe(0);
    expect(stageAt(1)).toBe(6);
  });

  it('is a pure function of progress, so scrolling back reverses it exactly', () => {
    for (const p of [0.12, 0.44, 0.67, 0.8]) expect(frameAt(p)).toEqual(frameAt(p));
  });

  it('samples particles over the body and the trophy, deterministically', () => {
    const a = createParticles(2000);
    const b = createParticles(2000);
    expect(a.count).toBe(2000);
    expect(Array.from(a.u)).toEqual(Array.from(b.u));
    const trophy = a.part.filter((p) => p === 'trophy').length;
    expect(trophy).toBeGreaterThan(300);
    for (let i = 0; i < a.count; i++) if (a.part[i] === 'trophy') expect(inTrophy(a.u[i]!, a.v[i]!)).toBe(true);
    const out = placeParticles(a, frameAt(0.5), new Float32Array(a.count * 2));
    expect(out.every(Number.isFinite)).toBe(true);
  });
});
