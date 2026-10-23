// The look of the event scenes: every figure and prop is first painted as a clean, solid
// silhouette into a small offscreen mask (one mask pixel per halftone cell), then read back as a
// fixed grid of soft dots. The grid never moves, so nothing shimmers; antialiased coverage sets
// each dot's size, and the silhouette's edge catches the light. At the reveal the dots leave the
// grid and gather into the event photograph's own density map (see gather()).
//
// Mask channels: red = background tone (audience, back limbs), green = foreground (the main
// figures), blue = props. They are painted with additive blending, so they never overwrite each
// other, and a cell takes the tone of its strongest channel, foreground first.

import { BONES, hips, mulberry32, shoulders, type Joints, type Vec } from './figure';

export const TONE = { back: 0, front: 1, prop: 2 } as const;
export type Tone = (typeof TONE)[keyof typeof TONE];

/** Pure channel colours for the mask. */
export const INK = { back: '#ff0000', front: '#00ff00', prop: '#0000ff' } as const;

/** A set of dots, in CSS pixels. */
export interface Dots {
  count: number;
  x: Float32Array;
  y: Float32Array;
  /** Diameter, CSS pixels. */
  size: Float32Array;
  alpha: Float32Array;
  tone: Uint8Array;
  /** A stable random value per dot (0..1). */
  seed: Float32Array;
}

export function makeDots(count: number): Dots {
  return {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    size: new Float32Array(count),
    alpha: new Float32Array(count),
    tone: new Uint8Array(count),
    seed: new Float32Array(count),
  };
}

/** A stable hash of a grid cell, 0..1. */
export function cellHash(i: number, j: number, salt = 0): number {
  let h = Math.imul(i * 374761393 + j * 668265263 + salt * 2246822519, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Reads an RGBA mask (cols × rows, one pixel per cell of `cell` CSS pixels) into dots. A dot's
 * size follows its coverage; cells on the silhouette's edge, especially facing the light (up and
 * to the left), are brighter, which gives the figures volume without noise.
 */
export function readMask(rgba: ArrayLike<number>, cols: number, rows: number, cell: number, out?: Dots): Dots {
  const cover = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= cols || j >= rows) return 0;
    const k = (j * cols + i) * 4;
    return Math.max(rgba[k]!, rgba[k + 1]!, rgba[k + 2]!) / 255;
  };
  let n = 0;
  for (let k = 0; k < cols * rows; k++) if (Math.max(rgba[k * 4]!, rgba[k * 4 + 1]!, rgba[k * 4 + 2]!) > 24) n++;
  const dots = out && out.x.length >= n ? out : makeDots(Math.max(n, 16));
  let d = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      const r = rgba[k]!;
      const g = rgba[k + 1]!;
      const b = rgba[k + 2]!;
      const c = Math.max(r, g, b) / 255;
      if (c <= 24 / 255) continue;
      const tone: Tone = g >= 0.5 * Math.max(r, b) && g > 24 ? TONE.front : b >= r ? TONE.prop : TONE.back;
      const lit = Math.max(1 - cover(i - 1, j), 1 - cover(i, j - 1), (1 - cover(i - 1, j - 1)) * 0.8);
      const shade = Math.max(1 - cover(i + 1, j), 1 - cover(i, j + 1)) * 0.35;
      const h = cellHash(i, j);
      dots.x[d] = (i + 0.5 + (h - 0.5) * 0.45) * cell;
      dots.y[d] = (j + 0.5 + (cellHash(i, j, 1) - 0.5) * 0.45) * cell;
      dots.size[d] = cell * (0.38 + 0.5 * c) * (1 + lit * 0.18);
      dots.alpha[d] = c * Math.min(1, 0.5 + 0.18 * h + lit * 0.5 + shade * 0.2);
      dots.tone[d] = tone;
      dots.seed[d] = h;
      d++;
    }
  }
  dots.count = d;
  return dots;
}

// Painting -------------------------------------------------------------------------------------

/** Maps a figure-local point to mask pixels; `s` is mask pixels per figure unit. */
export interface Pen {
  ctx: CanvasRenderingContext2D;
  map: (v: Vec) => Vec;
  s: number;
}

/** A tapered capsule from a (radius ra) to b (radius rb), in figure units. */
export function capsule(pen: Pen, a: Vec, b: Vec, ra: number, rb: number) {
  const { ctx, map, s } = pen;
  const A = map(a);
  const B = map(b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  const RA = ra * s;
  const RB = rb * s;
  ctx.beginPath();
  if (len < 1e-6 || len <= Math.abs(RA - RB)) {
    ctx.arc(A.x, A.y, Math.max(RA, RB), 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Outer tangents of the two end circles, so the side lines meet them smoothly.
  const base = Math.atan2(dy, dx);
  const off = Math.acos((RA - RB) / len);
  ctx.arc(A.x, A.y, RA, base + off, base - off + Math.PI * 2);
  ctx.arc(B.x, B.y, RB, base - off, base + off);
  ctx.closePath();
  ctx.fill();
}

const lerpV = (a: Vec, b: Vec, t: number): Vec => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const along = (from: Vec, to: Vec, d: number): Vec => {
  const l = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: from.x + ((to.x - from.x) / l) * d, y: from.y + ((to.y - from.y) / l) * d };
};

/**
 * One person in profile, facing +x in its local frame: legs, torso, neck, head with a chin, arms
 * and hands. Back limbs go in `back`, the rest in `front`; a background figure passes the same
 * ink for both.
 */
export function paintPerson(pen: Pen, j: Joints, front: string, back: string, thumb = 0) {
  const { ctx } = pen;
  const leg = (k: 0 | 1) => {
    capsule(pen, j.hip, j.knee[k], 0.06, 0.044);
    capsule(pen, j.knee[k], j.ankle[k], 0.043, 0.029);
    const heel = { x: j.ankle[k].x - 0.022, y: j.ankle[k].y - 0.006 };
    capsule(pen, heel, j.toe[k], 0.027, 0.018);
  };
  const arm = (k: 0 | 1) => {
    capsule(pen, j.shoulder, j.elbow[k], 0.04, 0.031);
    capsule(pen, j.elbow[k], j.hand[k], 0.03, 0.023);
    const fist = along(j.elbow[k], j.hand[k], Math.hypot(j.hand[k].x - j.elbow[k].x, j.hand[k].y - j.elbow[k].y) + 0.014);
    capsule(pen, j.hand[k], fist, 0.025, 0.021);
  };

  ctx.fillStyle = back;
  arm(0);
  leg(0);

  ctx.fillStyle = front;
  leg(1);
  // Torso: pelvis, a fuller chest, then the shoulders narrowing into the neck.
  const chest = lerpV(j.hip, j.neck, 0.62);
  capsule(pen, j.hip, chest, 0.068, 0.08);
  capsule(pen, chest, j.neck, 0.08, 0.05);
  // Neck into the base of the skull.
  const skull = along(j.head, j.neck, BONES.headR * 0.55);
  capsule(pen, j.neck, skull, 0.033, 0.034);
  // Head: a slightly tall oval, with the chin and nose forward of it.
  const up = { x: j.head.x - j.neck.x, y: j.head.y - j.neck.y };
  const ul = Math.hypot(up.x, up.y) || 1;
  const ux = up.x / ul;
  const uy = up.y / ul;
  // Forward is the head's "up" turned a quarter clockwise (the figure faces +x).
  const fx = uy;
  const fy = -ux;
  const H = pen.map(j.head);
  // The oval's long axis follows the head's "up", as it lands on the mask.
  const U = pen.map({ x: j.head.x + ux, y: j.head.y + uy });
  ctx.beginPath();
  ctx.ellipse(H.x, H.y, BONES.headR * 0.98 * pen.s, BONES.headR * 1.14 * pen.s, Math.atan2(U.y - H.y, U.x - H.x) - Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
  const chin = { x: j.head.x + fx * BONES.headR * 0.55 - ux * BONES.headR * 0.55, y: j.head.y + fy * BONES.headR * 0.55 - uy * BONES.headR * 0.55 };
  capsule(pen, { x: j.head.x - ux * BONES.headR * 0.2, y: j.head.y - uy * BONES.headR * 0.2 }, chin, BONES.headR * 0.62, BONES.headR * 0.3);
  const nose = { x: j.head.x + fx * BONES.headR * 0.98, y: j.head.y + fy * BONES.headR * 0.98 - uy * 0.008 };
  capsule(pen, j.head, nose, 0.012, 0.009);
  arm(1);
  // A thumb standing up from the front fist.
  if (thumb > 0) capsule(pen, { x: j.hand[1].x, y: j.hand[1].y + 0.012 }, { x: j.hand[1].x - 0.004, y: j.hand[1].y + 0.012 + 0.055 * thumb }, 0.015, 0.012);
}

/**
 * One person facing the camera (see frontSolve): legs a little apart, a torso broad at the
 * shoulders, the neck, an oval head, and both arms with their hands.
 */
export function paintPersonFront(pen: Pen, j: Joints, ink: string) {
  const { ctx } = pen;
  ctx.fillStyle = ink;
  const hp = hips(j);
  const sh = shoulders(j);
  for (const k of [0, 1] as const) {
    capsule(pen, hp[k], j.knee[k], 0.058, 0.044);
    capsule(pen, j.knee[k], j.ankle[k], 0.043, 0.03);
    capsule(pen, j.ankle[k], j.toe[k], 0.03, 0.024);
  }
  // Pelvis, a torso widening to the chest, and the line of the shoulders.
  capsule(pen, hp[0], hp[1], 0.066, 0.066);
  const chest = lerpV(j.hip, j.shoulder, 0.6);
  capsule(pen, j.hip, chest, 0.085, 0.105);
  capsule(pen, chest, j.shoulder, 0.105, 0.09);
  capsule(pen, sh[0], sh[1], 0.05, 0.05);
  capsule(pen, j.shoulder, j.neck, 0.036, 0.034);
  const H = pen.map(j.head);
  ctx.beginPath();
  ctx.ellipse(H.x, H.y, BONES.headR * 0.92 * pen.s, BONES.headR * 1.14 * pen.s, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const k of [0, 1] as const) {
    capsule(pen, sh[k], j.elbow[k], 0.04, 0.031);
    capsule(pen, j.elbow[k], j.hand[k], 0.03, 0.024);
    const fist = along(j.elbow[k], j.hand[k], Math.hypot(j.hand[k].x - j.elbow[k].x, j.hand[k].y - j.elbow[k].y) + 0.012);
    capsule(pen, j.hand[k], fist, 0.026, 0.022);
  }
}

/** The trophy, origin at the centre of its base: a cup with two handles, a stem and a plinth. */
export function paintTrophy(pen: Pen, o: Vec) {
  const { ctx, map } = pen;
  const P = (x: number, y: number) => map({ x: o.x + x, y: o.y + y });
  const poly = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([x, y], k) => {
      const q = P(x, y);
      if (k) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    });
    ctx.closePath();
    ctx.fill();
  };
  poly([[-0.05, 0], [0.05, 0], [0.046, 0.024], [-0.046, 0.024]]); // plinth
  poly([[-0.03, 0.024], [0.03, 0.024], [0.03, 0.034], [-0.03, 0.034]]);
  poly([[-0.011, 0.034], [0.011, 0.034], [0.015, 0.09], [-0.015, 0.09]]); // stem
  // Bowl: a rounded cup from the stem to the rim.
  ctx.beginPath();
  const a = P(-0.064, 0.2);
  ctx.moveTo(a.x, a.y);
  const c1 = P(-0.064, 0.115);
  const m = P(0, 0.086);
  const c2 = P(0.064, 0.115);
  const b = P(0.064, 0.2);
  ctx.quadraticCurveTo(c1.x, c1.y, m.x, m.y);
  ctx.quadraticCurveTo(c2.x, c2.y, b.x, b.y);
  ctx.closePath();
  ctx.fill();
  // Handles: rings either side of the cup.
  ctx.lineWidth = Math.max(1, 0.012 * pen.s);
  ctx.strokeStyle = ctx.fillStyle;
  for (const side of [-1, 1]) {
    const h = P(side * 0.068, 0.158);
    ctx.beginPath();
    ctx.ellipse(h.x, h.y, 0.02 * pen.s, 0.03 * pen.s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** A certificate held by the middle of its lower edge: a sheet with a seal. */
export function paintCertificate(pen: Pen, grip: Vec, w: number, h: number) {
  const { ctx, map } = pen;
  const a = map({ x: grip.x - w / 2, y: grip.y + h });
  const b = map({ x: grip.x + w / 2, y: grip.y });
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  ctx.fillRect(x, y, Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  // A darker seal and two lines of text read as a cut-out from the sheet.
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.55;
  const seal = map({ x: grip.x + w * 0.28, y: grip.y + h * 0.3 });
  ctx.beginPath();
  ctx.arc(seal.x, seal.y, 0.02 * pen.s, 0, Math.PI * 2);
  ctx.fill();
  for (const [t, k] of [[0.68, 0.6], [0.48, 0.45]] as const) {
    const l = map({ x: grip.x - w * 0.36, y: grip.y + h * t });
    ctx.fillRect(Math.min(l.x, l.x + (map({ x: grip.x - w * 0.36 + w * k, y: 0 }).x - l.x)), l.y - 0.005 * pen.s, Math.abs(w * k * pen.s), Math.max(1, 0.01 * pen.s));
  }
  ctx.restore();
}

const box = (pen: Pen, x0: number, y0: number, x1: number, y1: number) => {
  const a = pen.map({ x: x0, y: y1 });
  const b = pen.map({ x: x1, y: y0 });
  pen.ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
};

/** A table at stage x = `x`: a top on two legs. */
export function paintTable(pen: Pen, x: number, top: number, from: number, to: number) {
  box(pen, x + from, top - 0.026, x + to, top);
  box(pen, x + from + 0.02, 0, x + from + 0.042, top - 0.026);
  box(pen, x + to - 0.042, 0, x + to - 0.02, top - 0.026);
}

/** A small competition robot standing on a surface at height `top`: wheels, a body and a sensor mast. */
export function paintRobot(pen: Pen, x: number, top: number) {
  const { ctx, map, s } = pen;
  for (const dx of [-0.042, 0.042]) {
    const w = map({ x: x + dx, y: top + 0.022 });
    ctx.beginPath();
    ctx.arc(w.x, w.y, 0.022 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  box(pen, x - 0.06, top + 0.03, x + 0.06, top + 0.072);
  capsule(pen, { x: x + 0.028, y: top + 0.072 }, { x: x + 0.028, y: top + 0.112 }, 0.007, 0.006);
  const eye = map({ x: x + 0.028, y: top + 0.118 });
  ctx.beginPath();
  ctx.arc(eye.x, eye.y, 0.014 * s, 0, Math.PI * 2);
  ctx.fill();
}

/** The pedestal the trophy waits on, centred on x. */
export function paintPedestal(pen: Pen, x: number, w: number, h: number) {
  box(pen, x - w / 2, 0, x + w / 2, h - 0.014);
  box(pen, x - w / 2 - 0.012, h - 0.014, x + w / 2 + 0.012, h);
}

// Gathering into the photograph ----------------------------------------------------------------

/**
 * Samples `count` points (0..1 across, 0..1 down) from a density map (row-major, w × h, 0..255),
 * with probability proportional to the density, deterministically. Without a map, the points
 * fill the box evenly.
 */
export function sampleDensity(count: number, map: { data: ArrayLike<number>; w: number; h: number } | null, seed = 7): Float32Array {
  const rnd = mulberry32(seed);
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    let u = rnd();
    let v = rnd();
    if (map) {
      for (let tries = 0; tries < 60; tries++) {
        const px = Math.min(map.w - 1, Math.floor(u * map.w));
        const py = Math.min(map.h - 1, Math.floor(v * map.h));
        if (rnd() * 255 < map.data[py * map.w + px]!) break;
        u = rnd();
        v = rnd();
      }
    }
    out[i * 2] = u;
    out[i * 2 + 1] = v;
  }
  return out;
}

/**
 * Pairs each source point with a target so the paths stay orderly: both sets are cut into the
 * same number of horizontal bands by rank, and matched left to right within each band. Returns,
 * for source k, the index of its target.
 */
export function pair(sx: ArrayLike<number>, sy: ArrayLike<number>, tx: ArrayLike<number>, ty: ArrayLike<number>, n: number): Uint32Array {
  const bands = Math.max(1, Math.round(Math.sqrt(n) / 2));
  const order = (xs: ArrayLike<number>, ys: ArrayLike<number>) => {
    const byY = Array.from({ length: n }, (_, k) => k).sort((a, b) => ys[a]! - ys[b]! || xs[a]! - xs[b]!);
    const out: number[] = [];
    for (let b = 0; b < bands; b++) {
      const slice = byY.slice(Math.floor((b * n) / bands), Math.floor(((b + 1) * n) / bands));
      slice.sort((a, c) => xs[a]! - xs[c]! || ys[a]! - ys[c]!);
      out.push(...slice);
    }
    return out;
  };
  const s = order(sx, sy);
  const t = order(tx, ty);
  const map = new Uint32Array(n);
  for (let k = 0; k < n; k++) map[s[k]!] = t[k]!;
  return map;
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
