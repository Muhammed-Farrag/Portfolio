// "The Moment of Victory": a 2D skeletal figure, drawn as halftone dots by halftone.ts
// (docs/DESIGN_SPEC.md, Scene 05, approach A′). Pure functions of the scroll progress p ∈ [0, 1], so the scene never lags the
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
  walkEnd: 0.26,
  notice: 0.31,
  bend: 0.4,
  grasp: 0.45,
  lift: 0.52,
  /** The figure turns from profile to face the camera, the trophy at the chest. */
  turnStart: 0.53,
  turnEnd: 0.58,
  /** Both hands hold it overhead, then bring it back to the chest, as in the photograph. */
  raise: 0.63,
  lower: 0.66,
  chest: 0.7,
  gatherStart: 0.72,
  gatherEnd: 0.88,
  photoStart: 0.84,
  photoEnd: 0.95,
} as const;

/** Where the figure starts and stops, and where the trophy stands (figure units from the stage centre). */
export const STAGE = { startX: -1.45, stopX: -0.12, trophyX: 0.16 };

export const STAGES = ['The approach', 'The trophy', 'Reaching', 'Lifting', 'The celebration', 'The reveal', 'The photograph'] as const;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const down = (angle: number, length: number): Vec => ({ x: Math.sin(angle) * length, y: -Math.cos(angle) * length });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });

/** Index of the narrative stage shown for progress p (see STAGES). */
export function stageAt(p: number): number {
  const T = TIMELINE;
  if (p < T.walkEnd) return 0;
  if (p < T.notice + 0.03) return 1;
  if (p < T.grasp - 0.02) return 2;
  if (p < T.turnStart) return 3;
  if (p < T.gatherStart) return 4;
  if (p < T.photoStart) return 5;
  return 6;
}

export const STAND: Pose = { hipX: 0, spine: 0.04, head: 0, thigh: [0, 0.02], knee: [0.06, 0.06], upper: [-0.06, 0.08], elbow: [0.18, 0.2] };
export const NOTICE: Pose = { ...STAND, spine: 0.1, head: 0.55, upper: [-0.04, 0.1] };
// A lean over the pedestal: bent at the hips, knees soft.
const BEND: Pose = { hipX: 0, spine: 1.15, head: 0.2, thigh: [0.25, 0.35], knee: [0.5, 0.45], upper: [0.25, 0], elbow: [0.3, 0] };
const LIFT: Pose = { hipX: 0, spine: 0.06, head: -0.05, thigh: [0, 0.04], knee: [0.08, 0.08], upper: [-0.1, 0.35], elbow: [0.3, 1.7] };

export function mix(a: Pose, b: Pose, t: number): Pose {
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
export function walk(phi: number, a: number): Pose {
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

/** Two-bone IK: an arm's [upper, elbow] angles that put the hand on `target`. */
export function reach(shoulder: Vec, target: Vec): [number, number] {
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

/** The dotted pedestal the trophy waits on, centred on STAGE.trophyX. */
export const PEDESTAL = { w: 0.15, h: 0.22 };

/** Where the trophy's grip is while it stands on the pedestal. */
const restGrip = (): Vec => ({ x: STAGE.trophyX, y: PEDESTAL.h + TROPHY.grip.y });

// Front view ---------------------------------------------------------------------------------

/** Half-widths of the hips and shoulders seen from the front. */
export const FRONT = { hipW: 0.058, shoulderW: 0.1 };

/** A front-view figure's shoulder points, [viewer's left, viewer's right]. */
export const shoulders = (j: Joints): [Vec, Vec] => [
  { x: j.shoulder.x - FRONT.shoulderW, y: j.shoulder.y },
  { x: j.shoulder.x + FRONT.shoulderW, y: j.shoulder.y },
];
/** A front-view figure's hip points, [viewer's left, viewer's right]. */
export const hips = (j: Joints): [Vec, Vec] => [
  { x: j.hip.x - FRONT.hipW, y: j.hip.y },
  { x: j.hip.x + FRONT.hipW, y: j.hip.y },
];

/** An arm seen from the front that puts its hand on `target`, its elbow bending outwards. */
function frontArm(shoulder: Vec, target: Vec, side: -1 | 1): [Vec, Vec] {
  // Mirror the viewer's-left arm so both are solved bending towards +x, then mirror back.
  const m = (v: Vec): Vec => ({ x: shoulder.x + side * (v.x - shoulder.x), y: v.y });
  const [u, e] = reach(shoulder, m(target));
  const elbow = add(shoulder, down(u, BONES.upper));
  const hand = add(elbow, down(u + e, BONES.fore));
  return [m(elbow), m(hand)];
}

/**
 * A figure facing the camera, standing at x with its feet a little apart, its hands on two stage
 * points. Index 0 is the viewer's left. Uses the same Joints shape as the profile figure, with
 * `hip` and `shoulder` at the centre line (see hips() and shoulders()).
 */
export function frontSolve(x: number, hands: [Vec, Vec], stance = 0.06): Joints {
  const legLen = BONES.thigh + BONES.shin;
  const hipY = BONES.ankle + legLen * Math.cos(stance);
  const hip = { x, y: hipY };
  const neck = { x, y: hipY + BONES.spine };
  const shoulder = { x, y: hipY + BONES.spine * 0.84 };
  const head = { x, y: neck.y + BONES.neck + BONES.headR };
  const hp = hips({ hip } as Joints);
  const sh = shoulders({ shoulder } as Joints);
  const legs = ([0, 1] as const).map((k) => {
    const s = k ? 1 : -1;
    const knee = { x: hp[k].x + s * Math.sin(stance) * BONES.thigh, y: hipY - Math.cos(stance) * BONES.thigh };
    const ankle = { x: hp[k].x + s * Math.sin(stance) * legLen, y: BONES.ankle };
    return { knee, ankle, toe: { x: ankle.x + s * 0.028, y: ankle.y - BONES.ankle * 0.6 } };
  });
  const arms = ([0, 1] as const).map((k) => frontArm(sh[k], hands[k], k ? 1 : -1));
  return {
    hip,
    neck,
    shoulder,
    head,
    knee: [legs[0]!.knee, legs[1]!.knee],
    ankle: [legs[0]!.ankle, legs[1]!.ankle],
    toe: [legs[0]!.toe, legs[1]!.toe],
    elbow: [arms[0]![0], arms[1]![0]],
    hand: [arms[0]![1], arms[1]![1]],
  };
}

export interface Frame {
  /** The figure in profile. */
  joints: Joints;
  /** The figure facing the camera, from the turn on (null before it). */
  front: Joints | null;
  /** 0 = in profile, 1 = facing the camera; between, the two dissolve into each other. */
  turn: number;
  /** 0..1: how much the figure is walking (it sheds a trail of dust while it does). */
  walking: number;
  /** Origin of the trophy (centre of its base). */
  trophy: Vec;
  /** 0 = the figure on stage, 1 = its dots fully gathered into the photograph. */
  gather: number;
  /** 0 = no photograph, 1 = the photograph fully shown. */
  photo: number;
  stage: number;
}

/** Heights of the hands holding the trophy at the chest and overhead, facing the camera. */
const FRONT_CHEST = 0.6;
const FRONT_OVERHEAD = 1.07;

/** The whole scene at progress p. */
export function frameAt(p: number): Frame {
  const T = TIMELINE;
  const walkT = clamp01(p / T.walkEnd);
  // Ease out the walk so the figure arrives and stops; the cycle runs with the distance covered.
  const travel = 1 - (1 - walkT) ** 2;
  const hipX = lerp(STAGE.startX, STAGE.stopX, travel);
  const phi = ((hipX - STAGE.startX) / 0.62) * Math.PI * 2;

  const walking = p < T.walkEnd ? 1 - smooth(0.82, 1, walkT) : 0;
  let pose: Pose;
  if (p <= T.walkEnd) pose = walk(phi, walking);
  else if (p <= T.notice) pose = mix(walk(phi, 0), NOTICE, smooth(T.walkEnd, T.notice, p));
  else if (p <= T.grasp) pose = mix(NOTICE, BEND, smooth(T.notice, T.bend, p));
  else pose = mix(BEND, LIFT, smooth(T.grasp, T.lift, p));
  pose = { ...pose, hipX };

  // Reaching: blend the front arm towards the trophy while bending and holding.
  const held = p >= T.grasp;
  const reachW = held ? 1 - smooth(T.grasp, T.grasp + 0.04, p) : smooth(T.notice + 0.03, T.bend, p);
  if (reachW > 0) {
    const shoulder = solve(pose).shoulder;
    const [u, e] = reach(shoulder, restGrip());
    pose = { ...pose, upper: [pose.upper[0], lerp(pose.upper[1], u, reachW)], elbow: [pose.elbow[0], lerp(pose.elbow[1], e, reachW)] };
  }
  const joints = solve(pose);

  // Facing the camera: both hands on the trophy, at the chest, then overhead, then back.
  const turn = smooth(T.turnStart, T.turnEnd, p);
  let front: Joints | null = null;
  let grip = held ? joints.hand[1] : restGrip();
  if (p >= T.turnStart) {
    const up = smooth(T.turnEnd, T.raise, p) * (1 - smooth(T.lower, T.chest, p));
    const y = lerp(FRONT_CHEST, FRONT_OVERHEAD, up);
    const w = lerp(0.032, 0.06, up);
    front = frontSolve(hipX, [{ x: hipX - w, y }, { x: hipX + w, y }]);
    const mid = { x: (front.hand[0].x + front.hand[1].x) / 2, y: (front.hand[0].y + front.hand[1].y) / 2 };
    grip = { x: lerp(grip.x, mid.x, turn), y: lerp(grip.y, mid.y, turn) };
  }
  const trophy = { x: grip.x - TROPHY.grip.x, y: grip.y - TROPHY.grip.y };

  return {
    joints,
    front,
    turn,
    walking,
    trophy,
    gather: smooth(T.gatherStart, T.gatherEnd, p),
    photo: smooth(T.photoStart, T.photoEnd, p),
    stage: stageAt(p),
  };
}

/** A small deterministic PRNG (0..1). */
export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
