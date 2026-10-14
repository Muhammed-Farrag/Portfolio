import { describe, expect, it } from 'vitest';
import { CORE_RADIUS, LABEL_X, NODES, NODE_RADIUS, assignTargets, diagramTargets, edges } from '../../src/features/story/approachDiagram';

const pairs = (a: Float32Array) => Array.from({ length: a.length / 2 }, (_, k) => [a[k * 2]!, a[k * 2 + 1]!] as const);

describe('approach diagram', () => {
  it('names the four layers from the approved Approach summary, top to bottom', () => {
    expect(NODES.map((n) => n.label)).toEqual(['Intelligence', 'Orchestration', 'Product', 'Operations']);
    for (let k = 1; k < NODES.length; k++) expect(NODES[k]!.y).toBeLessThan(NODES[k - 1]!.y);
  });

  for (const count of [10_203, 4_525, 2_549]) {
    it(`gives exactly one target per particle for ${count} points, inside the portrait's space`, () => {
      const t = diagramTargets(count);
      expect(t.length).toBe(count * 2);
      for (const [x, y] of pairs(t)) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(Math.abs(x)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(y)).toBeLessThanOrEqual(0.5);
      }
    });
  }

  it('is deterministic', () => {
    expect(diagramTargets(4_525)).toEqual(diagramTargets(4_525));
  });

  it('draws every node: a core and a ring around each centre', () => {
    const t = pairs(diagramTargets(10_203));
    for (const n of NODES) {
      const near = t.filter(([x, y]) => Math.hypot(x - n.x, y - n.y) <= CORE_RADIUS + 1e-6).length;
      const ring = t.filter(([x, y]) => Math.abs(Math.hypot(x - n.x, y - n.y) - NODE_RADIUS) < 0.007).length;
      expect(near, `${n.label} core`).toBeGreaterThan(300);
      expect(ring, `${n.label} ring`).toBeGreaterThan(900);
    }
  });

  it('keeps the label column clear of particles except the leader lines', () => {
    const t = pairs(diagramTargets(10_203));
    expect(t.filter(([x]) => x > LABEL_X - 0.01).length).toBe(0);
  });

  it('routes edges between consecutive layers without touching the rings', () => {
    for (const [k, e] of edges().entries()) {
      for (const n of [NODES[k]!, NODES[k + 1]!]) {
        expect(Math.hypot(e.x1 - n.x, e.y1 - n.y)).toBeGreaterThan(NODE_RADIUS);
        expect(Math.hypot(e.x2 - n.x, e.y2 - n.y)).toBeGreaterThan(NODE_RADIUS);
      }
    }
  });

  it('gives the brightest particles the cores and the dimmest the field', () => {
    const count = 1_000;
    const points = new Float32Array(count * 5);
    for (let k = 0; k < count; k++) points.set([0, 0, k / count, k / count, k / count], k * 5); // brightness rises with k
    const targets = diagramTargets(count);
    const assigned = assignTargets(points, targets);
    // The brightest point takes target 0 (a core); the darkest takes the last (the field).
    expect([assigned[(count - 1) * 2], assigned[(count - 1) * 2 + 1]]).toEqual([targets[0], targets[1]]);
    expect([assigned[0], assigned[1]]).toEqual([targets[(count - 1) * 2], targets[(count - 1) * 2 + 1]]);
    // Every target is used exactly once.
    expect(new Set(pairs(assigned).map((p) => p.join())).size).toBe(new Set(pairs(targets).map((p) => p.join())).size);
  });
});
