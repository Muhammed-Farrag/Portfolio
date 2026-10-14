// The Approach diagram: four layers joined by a route, each with a leader line to its label.
// Coordinates are in the portrait's space (x right, y up, about -0.5..0.5), so the same particles
// can morph from the portrait into this shape. ApproachFigure draws the same geometry as SVG and
// places the HTML labels, which is what reduced-motion, paused and no-WebGL visitors see.

import { POINT_STRIDE } from '../particle-portrait/sampling';

export interface DiagramNode {
  label: string;
  x: number;
  y: number;
}

/** The four layers named in the Approach summary, top to bottom. */
export const NODES: readonly DiagramNode[] = [
  { label: 'Intelligence', x: -0.22, y: 0.33 },
  { label: 'Orchestration', x: -0.04, y: 0.11 },
  { label: 'Product', x: -0.22, y: -0.11 },
  { label: 'Operations', x: -0.04, y: -0.33 },
];
export const NODE_RADIUS = 0.07;
export const CORE_RADIUS = 0.022;
/** Labels start here; leader lines stop just short of it. */
export const LABEL_X = 0.13;

/** Share of particles per element, in order of visual importance (brightest particles first). */
const SHARES = { cores: 0.16, rings: 0.4, leaders: 0.08, edges: 0.18, field: 0.18 };

/** Deterministic PRNG (mulberry32), so the diagram and the tests are stable. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Route segments between consecutive nodes, from rim to rim. */
export function edges(): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < NODES.length - 1; i++) {
    const a = NODES[i]!;
    const b = NODES[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const [ux, uy] = [(b.x - a.x) / len, (b.y - a.y) / len];
    const gap = NODE_RADIUS * 1.35;
    out.push({ x1: a.x + ux * gap, y1: a.y + uy * gap, x2: b.x - ux * gap, y2: b.y - uy * gap });
  }
  return out;
}

/** Horizontal leader lines from each node's rim to its label. */
export function leaders(): Segment[] {
  return NODES.map((n) => ({ x1: n.x + NODE_RADIUS * 1.35, y1: n.y, x2: LABEL_X - 0.02, y2: n.y }));
}

/**
 * `count` target positions (x, y pairs), grouped in the order of SHARES: cores, rings, leaders,
 * edges, field. Each group is shuffled so that nothing about the source order leaks into it.
 */
export function diagramTargets(count: number, seed = 7): Float32Array {
  const rand = random(seed);
  const out = new Float32Array(count * 2);
  let i = 0;
  const push = (x: number, y: number) => {
    if (i < count) {
      out[i * 2] = x;
      out[i * 2 + 1] = y;
      i++;
    }
  };
  const quota = (share: number) => Math.round(count * share);
  const along = (segments: Segment[], n: number, jitter: number) => {
    for (let k = 0; k < n; k++) {
      const s = segments[k % segments.length]!;
      const t = rand();
      push(s.x1 + (s.x2 - s.x1) * t + (rand() - 0.5) * jitter, s.y1 + (s.y2 - s.y1) * t + (rand() - 0.5) * jitter);
    }
  };
  const start = () => i;
  const shuffleFrom = (from: number) => {
    for (let k = i - 1; k > from; k--) {
      const j = from + Math.floor(rand() * (k - from + 1));
      for (const o of [0, 1]) [out[k * 2 + o], out[j * 2 + o]] = [out[j * 2 + o]!, out[k * 2 + o]!];
    }
  };

  let from = start();
  for (let k = 0; k < quota(SHARES.cores); k++) {
    const n = NODES[k % NODES.length]!;
    const r = CORE_RADIUS * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    push(n.x + Math.cos(a) * r, n.y + Math.sin(a) * r);
  }
  shuffleFrom(from);

  from = start();
  for (let k = 0; k < quota(SHARES.rings); k++) {
    const n = NODES[k % NODES.length]!;
    const r = NODE_RADIUS + (rand() - 0.5) * 0.012;
    const a = rand() * Math.PI * 2;
    push(n.x + Math.cos(a) * r, n.y + Math.sin(a) * r);
  }
  shuffleFrom(from);

  from = start();
  along(leaders(), quota(SHARES.leaders), 0.004);
  shuffleFrom(from);

  from = start();
  along(edges(), quota(SHARES.edges), 0.006);
  shuffleFrom(from);

  // The rest is a faint field of stars: an ellipse around the route that thins out towards its
  // edge (so it has no visible boundary), kept clear of the label column.
  from = start();
  while (i < count) {
    const r = rand() ** 0.7;
    const a = rand() * Math.PI * 2;
    const x = -0.15 + Math.cos(a) * r * 0.33;
    if (x < LABEL_X - 0.02) push(x, Math.sin(a) * r * 0.47);
  }
  shuffleFrom(from);
  return out;
}

/**
 * Pairs each sampled portrait point with a target: the brightest points take the first (most
 * important) targets, so the cores and rings are drawn in Moonlight and the field in Steel.
 * Returns x, y pairs in the source points' order, ready for ParticleRenderer.setMorphTarget().
 */
export function assignTargets(points: Float32Array, targets: Float32Array): Float32Array {
  const count = points.length / POINT_STRIDE;
  if (targets.length !== count * 2) throw new Error(`need ${count} targets, got ${targets.length / 2}`);
  const order = Array.from({ length: count }, (_, k) => k);
  const lum = (k: number) => points[k * POINT_STRIDE + 2]! * 0.2126 + points[k * POINT_STRIDE + 3]! * 0.7152 + points[k * POINT_STRIDE + 4]! * 0.0722;
  order.sort((a, b) => lum(b) - lum(a) || a - b);
  const out = new Float32Array(count * 2);
  order.forEach((source, rank) => {
    out[source * 2] = targets[rank * 2]!;
    out[source * 2 + 1] = targets[rank * 2 + 1]!;
  });
  return out;
}
