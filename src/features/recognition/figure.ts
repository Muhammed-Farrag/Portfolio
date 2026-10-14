// "The Moment of Victory": a 2D skeletal figure made of particles (docs/DESIGN_SPEC.md, Scene 05,
// approach A′). Pure functions of the scroll progress p ∈ [0, 1], so the scene never lags the
// scroll, reverses exactly and can be skipped.
//
// Units: figure units, 1 ≈ the figure's height. x grows to the right, y grows upwards from the
// ground. Limb angles are measured from straight down; positive turns the limb forward (+x).

export interface Vec {
  x: number;
  y: number;
}

export interface Pose {
  hipX: number;
  /** Torso lean from vertical; positive leans forward. */
  spine: number;
  /** Head tilt relative to the spine; positive looks down. */
  head: number;
  /** [back, front] legs and arms. */
  thigh: [number, number];
  knee: [number, number];
  upper: [number, number];
  elbow: [number, number];
}

export interface Joints {
  hip: Vec;
  neck: Vec;
  shoulder: Vec;
  head: Vec;
  knee: [Vec, Vec];
  ankle: [Vec, Vec];
  toe: [Vec, Vec];
  elbow: [Vec, Vec];
  hand: [Vec, Vec];
}

export const BONES = { thigh: 0.245, shin: 0.235, spine: 0.3, neck: 0.05, headR: 0.068, upper: 0.165, fore: 0.16, foot: 0.075, ankle: 0.025 };

/** The scene's timeline, as fractions of the scroll progress. */
export const TIMELINE = {
  walkEnd: 0.3,
  notice: 0.36,
  bend: 0.47,
  grasp: 0.52,
  lift: 0.62,
  raise: 0.72,
  disperseStart: 0.76,
  disperseEnd: 0.88,
  photoStart: 0.8,
  photoEnd: 0.92,
} as const;

/** Where the figure starts and stops, and where the trophy stands (figure units from the stage centre). */
export const STAGE = { startX: -1.45, stopX: -0.18, trophyX: 0.16 };

export const STAGES = ['Walks on', 'Notices', 'Bends', 'Picks it up', 'Raises it', 'Disperses', 'The photograph'] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const down = (angle: number, length: number): Vec => ({ x: Math.sin(angle) * length, y: -Math.cos(angle) * length });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });

/** Index of the narrative stage shown for progress p (see STAGES). */
export function stageAt(p: number): number {
  const T = TIMELINE;
  if (p < T.walkEnd) return 0;
  if (p < T.notice + 0.03) return 1;
  if (p < T.grasp - 0.02) return 2;
  if (p < T.lift) return 3;
  if (p < T.disperseStart) return 4;
  if (p < T.photoStart + 0.04) return 5;
  return 6;
}

const STAND: Pose = { hipX: 0, spine: 0.04, head: 0, thigh: [0, 0.02], knee: [0.06, 0.06], upper: [-0.06, 0.08], elbow: [0.18, 0.2] };
const NOTICE: Pose = { ...STAND, spine: 0.1, head: 0.55, upper: [-0.04, 0.1] };
const BEND: Pose = { hipX: 0, spine: 1.3, head: 0.25, thigh: [1.0, 1.35], knee: [2.0, 1.9], upper: [0.5, 0], elbow: [0.5, 0] };
const LIFT: Pose = { hipX: 0, spine: 0.06, head: -0.05, thigh: [0, 0.04], knee: [0.08, 0.08], upper: [-0.1, 0.35], elbow: [0.3, 1.7] };
const RAISE: Pose = { hipX: 0, spine: -0.08, head: -0.45, thigh: [-0.06, 0.12], knee: [0.04, 0.1], upper: [2.55, 3.0], elbow: [0.25, 0.05] };

function mix(a: Pose, b: Pose, t: number): Pose {
  const pair = (x: [number, number], y: [number, number]): [number, number] => [lerp(x[0], y[0], t), lerp(x[1], y[1], t)];
  return {
    hipX: lerp(a.hipX, b.hipX, t),
    spine: lerp(a.spine, b.spine, t),
    head: lerp(a.head, b.head, t),
    thigh: pair(a.thigh, b.thigh),
    knee: pair(a.knee, b.knee),
    upper: pair(a.upper, b.upper),
    elbow: pair(a.elbow, b.elbow),
  };
}

/** A walk cycle at phase φ, scaled by amplitude a (0 = standing). */
function walk(phi: number, a: number): Pose {
  const leg = (offset: number) => {
    const s = Math.sin(phi + offset);
    const swing = Math.max(0, Math.cos(phi + offset));
    return { thigh: 0.42 * s * a, knee: (0.1 + 0.75 * swing ** 1.4) * a + 0.06 * (1 - a) };
  };
  const back = leg(Math.PI);
  const front = leg(0);
  return {
    hipX: 0,
    spine: 0.07 * a + STAND.spine * (1 - a),
    head: 0,
    thigh: [back.thigh, front.thigh],
    knee: [back.knee, front.knee],
    upper: [0.38 * Math.sin(phi) * a - 0.06 * (1 - a), -0.38 * Math.sin(phi) * a + 0.08 * (1 - a)],
    elbow: [0.25, 0.3],
  };
}

/** Forward kinematics. The hip height is chosen so the lower ankle rests on the ground. */
export function solve(pose: Pose): Joints {
  const legs = [0, 1].map((i) => {
    const knee = down(pose.thigh[i]!, BONES.thigh);
    const ankle = add(knee, down(pose.thigh[i]! - pose.knee[i]!, BONES.shin));
    return { knee, ankle };
  });
  const lowest = Math.min(legs[0]!.ankle.y, legs[1]!.ankle.y);
  const hip = { x: pose.hipX, y: BONES.ankle - lowest };
  const spineDir = { x: Math.sin(pose.spine), y: Math.cos(pose.spine) };
  const neck = add(hip, { x: spineDir.x * BONES.spine, y: spineDir.y * BONES.spine });
  const shoulder = add(hip, { x: spineDir.x * BONES.spine * 0.9, y: spineDir.y * BONES.spine * 0.9 });
  const tilt = pose.spine + pose.head;
  const head = add(neck, { x: Math.sin(tilt) * (BONES.neck + BONES.headR), y: Math.cos(tilt) * (BONES.neck + BONES.headR) });
  const knee = legs.map((l) => add(hip, l.knee)) as [Vec, Vec];
  const ankle = legs.map((l) => add(hip, l.ankle)) as [Vec, Vec];
  const toe = ankle.map((a) => ({ x: a.x + BONES.foot, y: a.y - BONES.ankle * 0.6 })) as [Vec, Vec];
  const elbow = [0, 1].map((i) => add(shoulder, down(pose.upper[i]!, BONES.upper))) as [Vec, Vec];
  const hand = [0, 1].map((i) => add(elbow[i]!, down(pose.upper[i]! + pose.elbow[i]!, BONES.fore))) as [Vec, Vec];
  return { hip, neck, shoulder, head, knee, ankle, toe, elbow, hand };
}

/** Two-bone IK: the front arm's [upper, elbow] angles that put the hand on `target`. */
function reach(shoulder: Vec, target: Vec): [number, number] {
  const a = BONES.upper;
  const b = BONES.fore;
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  const d = Math.min(Math.hypot(dx, dy), a + b - 1e-4);
  const base = Math.atan2(dx, -dy);
  const alpha = Math.acos(Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d))));
  const upper = base - alpha;
  const elbowAt = add(shoulder, down(upper, a));
  const fore = Math.atan2(target.x - elbowAt.x, -(target.y - elbowAt.y));
  return [upper, fore - upper];
}

/** Trophy shape, in figure units with its origin at the centre of the base. */
export const TROPHY = { height: 0.2, grip: { x: 0, y: 0.06 } };

/** Where the trophy's grip should be when it stands on the ground. */
const groundGrip = (): Vec => ({ x: STAGE.trophyX, y: TROPHY.grip.y });

export interface Frame {
  joints: Joints;
  /** Origin of the trophy (centre of its base). */
  trophy: Vec;
  /** 0 = assembled, 1 = fully dispersed. */
  disperse: number;
  /** 0 = no photograph, 1 = the photograph fully shown. */
  photo: number;
  stage: number;
}

/** The whole scene at progress p. */
export function frameAt(p: number): Frame {
  const T = TIMELINE;
  const walkT = clamp01(p / T.walkEnd);
  // Ease out the walk so the figure arrives and stops; the cycle runs with the distance covered.
  const travel = 1 - (1 - walkT) ** 2;
  const hipX = lerp(STAGE.startX, STAGE.stopX, travel);
  const phi = ((hipX - STAGE.startX) / 0.62) * Math.PI * 2;

  let pose: Pose;
  if (p <= T.walkEnd) pose = walk(phi, 1 - smooth(0.82, 1, walkT));
  else if (p <= T.notice) pose = mix(walk(phi, 0), NOTICE, smooth(T.walkEnd, T.notice, p));
  else if (p <= T.grasp) pose = mix(NOTICE, BEND, smooth(T.notice, T.bend, p));
  else if (p <= T.lift) pose = mix(BEND, LIFT, smooth(T.grasp, T.lift, p));
  else pose = mix(LIFT, RAISE, smooth(T.lift, T.raise, p));
  pose = { ...pose, hipX };

  // Reaching: blend the front arm towards the trophy while bending and holding.
  const held = p >= T.grasp;
  const reachW = held ? 1 - smooth(T.grasp, T.grasp + 0.04, p) : smooth(T.notice + 0.03, T.bend, p);
  if (reachW > 0) {
    const shoulder = solve(pose).shoulder;
    const [u, e] = reach(shoulder, groundGrip());
    pose = { ...pose, upper: [pose.upper[0], lerp(pose.upper[1], u, reachW)], elbow: [pose.elbow[0], lerp(pose.elbow[1], e, reachW)] };
  }
  const joints = solve(pose);
  const hand = joints.hand[1];
  const grip = held ? hand : groundGrip();
  const trophy = { x: grip.x - TROPHY.grip.x, y: grip.y - TROPHY.grip.y };

  return {
    joints,
    trophy,
    disperse: smooth(T.disperseStart, T.disperseEnd, p),
    photo: smooth(T.photoStart, T.photoEnd, p),
    stage: stageAt(p),
  };
}

// Particles ----------------------------------------------------------------------------------

/** Body parts as capsules between two joints, with radii at each end. Index 0 = back limb. */
export type Part =
  | 'torso' | 'head' | 'thigh0' | 'thigh1' | 'shin0' | 'shin1' | 'foot0' | 'foot1'
  | 'upper0' | 'upper1' | 'fore0' | 'fore1' | 'trophy';

const SHARES: [Part, number][] = [
  ['torso', 0.24], ['head', 0.1], ['thigh0', 0.07], ['thigh1', 0.075], ['shin0', 0.05], ['shin1', 0.055],
  ['foot0', 0.015], ['foot1', 0.018], ['upper0', 0.035], ['upper1', 0.04], ['fore0', 0.03], ['fore1', 0.035], ['trophy', 0.2],
];

export interface Particles {
  count: number;
  part: Part[];
  /** Along the part (0..1), across it (-1..1); for the head and trophy, local coordinates. */
  u: Float32Array;
  v: Float32Array;
  /** Dispersal direction and a brightness seed. */
  dx: Float32Array;
  dy: Float32Array;
  seed: Float32Array;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Is (x, y) inside the trophy (local units)? A cup, two handles, a stem and a base. */
export function inTrophy(x: number, y: number): boolean {
  const ax = Math.abs(x);
  if (y >= 0 && y < 0.024) return ax < 0.048; // base
  if (y >= 0.024 && y < 0.034) return ax < 0.03;
  if (y >= 0.034 && y < 0.088) return ax < 0.011 + (y < 0.05 ? 0.01 * (1 - (y - 0.034) / 0.016) : 0); // stem
  if (y >= 0.088 && y <= 0.2) {
    const r = 0.06 * Math.sqrt(1 - ((0.2 - y) / 0.112) ** 2);
    if (ax < r) return true; // bowl
    const hx = ax - 0.068;
    const hy = y - 0.16;
    const ring = Math.hypot(hx / 0.022, hy / 0.03);
    return ring > 0.62 && ring < 1 && hx > -0.01; // handles
  }
  return false;
}

export function createParticles(count: number, seed = 11): Particles {
  const rnd = mulberry32(seed);
  const part: Part[] = [];
  const u = new Float32Array(count);
  const v = new Float32Array(count);
  const dx = new Float32Array(count);
  const dy = new Float32Array(count);
  const s = new Float32Array(count);
  let k = 0;
  for (const [name, share] of SHARES) {
    const n = name === SHARES[SHARES.length - 1]![0] ? count - k : Math.round(count * share);
    for (let j = 0; j < n && k < count; j++, k++) {
      part[k] = name;
      if (name === 'head') {
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd());
        u[k] = Math.cos(a) * r;
        v[k] = Math.sin(a) * r;
      } else if (name === 'trophy') {
        let x = 0;
        let y = 0;
        do {
          x = (rnd() - 0.5) * 0.2;
          y = rnd() * TROPHY.height;
        } while (!inTrophy(x, y));
        u[k] = x;
        v[k] = y;
      } else {
        u[k] = rnd();
        // Denser towards the outline, so the silhouette reads clearly.
        const t = rnd() * 2 - 1;
        v[k] = Math.sign(t) * Math.sqrt(Math.abs(t));
      }
      const a = rnd() * Math.PI * 2;
      const speed = 0.4 + rnd() * 1.1;
      dx[k] = Math.cos(a) * speed;
      dy[k] = Math.sin(a) * speed + 0.35;
      s[k] = rnd();
    }
  }
  return { count, part, u, v, dx, dy, seed: s };
}

/** Capsule ends and radii for a part, from the joints. */
function capsule(part: Part, j: Joints): [Vec, Vec, number, number] {
  switch (part) {
    case 'torso': return [j.hip, j.neck, 0.058, 0.07];
    case 'thigh0': return [j.hip, j.knee[0], 0.05, 0.038];
    case 'thigh1': return [j.hip, j.knee[1], 0.05, 0.038];
    case 'shin0': return [j.knee[0], j.ankle[0], 0.036, 0.026];
    case 'shin1': return [j.knee[1], j.ankle[1], 0.036, 0.026];
    case 'foot0': return [{ x: j.ankle[0].x - 0.015, y: j.ankle[0].y - 0.012 }, j.toe[0], 0.018, 0.014];
    case 'foot1': return [{ x: j.ankle[1].x - 0.015, y: j.ankle[1].y - 0.012 }, j.toe[1], 0.018, 0.014];
    case 'upper0': return [j.shoulder, j.elbow[0], 0.032, 0.026];
    case 'upper1': return [j.shoulder, j.elbow[1], 0.032, 0.026];
    case 'fore0': return [j.elbow[0], j.hand[0], 0.025, 0.02];
    case 'fore1': return [j.elbow[1], j.hand[1], 0.025, 0.02];
    default: return [j.hip, j.hip, 0, 0];
  }
}

/**
 * Writes each particle's position (figure units) into `out` (x, y pairs) and returns it. Back
 * limbs come first in the part order, so drawing in order layers the front limbs on top.
 */
export function placeParticles(ps: Particles, f: Frame, out: Float32Array): Float32Array {
  const spread = f.disperse * f.disperse * 1.8;
  for (let i = 0; i < ps.count; i++) {
    const part = ps.part[i]!;
    let x: number;
    let y: number;
    if (part === 'head') {
      x = f.joints.head.x + ps.u[i]! * BONES.headR;
      y = f.joints.head.y + ps.v[i]! * BONES.headR * 1.08;
    } else if (part === 'trophy') {
      x = f.trophy.x + ps.u[i]!;
      y = f.trophy.y + ps.v[i]!;
    } else {
      const [a, b, ra, rb] = capsule(part, f.joints);
      const ex = b.x - a.x;
      const ey = b.y - a.y;
      const len = Math.hypot(ex, ey) || 1;
      const t = ps.u[i]!;
      const r = (ra + (rb - ra) * t) * ps.v[i]!;
      x = a.x + ex * t - (ey / len) * r;
      y = a.y + ey * t + (ex / len) * r;
    }
    out[i * 2] = x + ps.dx[i]! * spread;
    out[i * 2 + 1] = y + ps.dy[i]! * spread;
  }
  return out;
}
