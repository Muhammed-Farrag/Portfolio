import { describe, expect, it } from 'vitest';
import { BONES, PEDESTAL, STAGE, TIMELINE, TROPHY, frameAt, stageAt } from '../../src/features/recognition/figure';

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

  it('the trophy waits on its pedestal until the hand reaches it, then travels with the hand', () => {
    expect(frameAt(0.1).trophy.x).toBeCloseTo(STAGE.trophyX, 9);
    expect(frameAt(0.1).trophy.y).toBeCloseTo(PEDESTAL.h, 9);
    const bent = frameAt(TIMELINE.bend + 0.01);
    const grip = { x: bent.trophy.x + TROPHY.grip.x, y: bent.trophy.y + TROPHY.grip.y };
    expect(Math.hypot(bent.joints.hand[1].x - grip.x, bent.joints.hand[1].y - grip.y), 'hand on the grip').toBeLessThan(0.01);
    for (const p of [TIMELINE.grasp, TIMELINE.lift]) {
      const f = frameAt(p);
      expect(f.trophy.x + TROPHY.grip.x).toBeCloseTo(f.joints.hand[1].x, 6);
      expect(f.trophy.y + TROPHY.grip.y).toBeCloseTo(f.joints.hand[1].y, 6);
    }
    // Facing the camera, it is held in both hands: the grip sits between them.
    for (const p of [TIMELINE.turnEnd, TIMELINE.raise, TIMELINE.chest, 0.75]) {
      const f = frameAt(p);
      const [l, r] = f.front!.hand;
      expect(f.trophy.x + TROPHY.grip.x).toBeCloseTo((l.x + r.x) / 2, 6);
      expect(f.trophy.y + TROPHY.grip.y).toBeCloseTo((l.y + r.y) / 2, 6);
    }
  });

  it('bends down to pick it up, turns to face the camera, raises it overhead and brings it to the chest', () => {
    const standing = frameAt(TIMELINE.walkEnd).joints;
    const bent = frameAt(TIMELINE.bend).joints;
    expect(bent.hip.y, "knees soften").toBeLessThan(standing.hip.y);
    expect(bent.head.y).toBeLessThan(standing.head.y - 0.2);
    expect(frameAt(TIMELINE.turnStart - 0.001).turn).toBe(0);
    expect(frameAt(TIMELINE.turnStart - 0.001).front).toBeNull();
    expect(frameAt(TIMELINE.turnEnd).turn).toBe(1);
    const raised = frameAt(TIMELINE.raise).front!;
    for (const k of [0, 1] as const) expect(raised.hand[k].y, 'both hands above the head').toBeGreaterThan(raised.head.y + 0.1);
    expect(raised.hand[0].x).toBeLessThan(raised.hand[1].x);
    const chest = frameAt(TIMELINE.chest).front!;
    expect(chest.hand[0].y).toBeLessThan(chest.shoulder.y);
    expect(chest.hand[0].y).toBeGreaterThan(chest.hip.y);
  });

  it('facing the camera, it still stands on the ground, feet apart under the hips', () => {
    for (const p of [TIMELINE.turnStart, TIMELINE.raise, 0.75]) {
      const j = frameAt(p).front!;
      expect(Math.min(j.ankle[0].y, j.ankle[1].y)).toBeCloseTo(BONES.ankle, 6);
      expect(j.ankle[0].x).toBeLessThan(j.hip.x);
      expect(j.ankle[1].x).toBeGreaterThan(j.hip.x);
    }
  });

  it('holds the trophy up until the dots gather, then hands over to the photograph, in order', () => {
    expect(TIMELINE.raise).toBeLessThan(TIMELINE.gatherStart);
    expect(frameAt(TIMELINE.gatherStart).gather).toBe(0);
    expect(frameAt(TIMELINE.gatherEnd).gather).toBe(1);
    expect(TIMELINE.photoStart).toBeLessThan(TIMELINE.gatherEnd);
    expect(frameAt(TIMELINE.photoStart).photo).toBe(0);
    expect(frameAt(1).photo).toBe(1);
    expect(progress.map(stageAt)).toEqual([...progress.map(stageAt)].sort((a, b) => a - b));
    expect(stageAt(0)).toBe(0);
    expect(stageAt(1)).toBe(6);
  });

  it('is a pure function of progress, so scrolling back reverses it exactly', () => {
    for (const p of [0.12, 0.44, 0.67, 0.8]) expect(frameAt(p)).toEqual(frameAt(p));
  });
});
