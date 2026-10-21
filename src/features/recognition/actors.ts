// Events 2 and 3: several figures on one stage, built on the figure of Event 1
// (figure.ts). Like Event 1, every scene is a pure function of the scroll progress p ∈ [0, 1].
//
// Each figure is posed in its own local frame (facing right, standing at x = 0) and placed on the
// stage by a transform: position, facing (1 right, -1 left) and scale. Units are figure units.

import { NOTICE, STAND, clamp01, lerp, mix, reach, smooth, solve, walk, type Joints, type Pose, type Vec } from './figure';

export interface Place {
  x: number;
  y: number;
  facing: 1 | -1;
  scale: number;
}

export interface Actor {
  /** The figure's joints in its local frame. */
  joints: Joints;
  at: Place;
}

/** A local point on the stage. */
export const toStage = (v: Vec, at: Place): Vec => ({ x: at.x + at.facing * at.scale * v.x, y: at.y + at.scale * v.y });
/** A stage point in a figure's local frame. */
export const toLocal = (v: Vec, at: Place): Vec => ({ x: (v.x - at.x) / (at.facing * at.scale), y: (v.y - at.y) / at.scale });

/** Poses the arm `arm` (0 back, 1 front) so its hand lands on a stage point, blended by weight w. */
function armTo(pose: Pose, at: Place, arm: 0 | 1, target: Vec, w = 1): Pose {
  if (w <= 0) return pose;
  const [u, e] = reach(solve(pose).shoulder, toLocal(target, at));
  const upper = [...pose.upper] as [number, number];
  const elbow = [...pose.elbow] as [number, number];
  upper[arm] = lerp(upper[arm], u, w);
  elbow[arm] = lerp(elbow[arm], e, w);
  return { ...pose, upper, elbow };
}

const hand = (a: Actor, arm: 0 | 1) => toStage(a.joints.hand[arm], a.at);

/** Hip position and walk phase for a walk that eases out over [t0, t1] from x0 to x1. */
function stroll(p: number, t0: number, t1: number, x0: number, x1: number) {
  const t = clamp01((p - t0) / (t1 - t0));
  const x = lerp(x0, x1, 1 - (1 - t) ** 2);
  // Ease in at the start, settle at the end.
  const amp = p <= t0 || p >= t1 ? 0 : smooth(0, 0.12, t) * (1 - smooth(0.82, 1, t));
  return { x, phi: (Math.abs(x - x0) / 0.62) * Math.PI * 2, amp };
}

// ---- Event 2: the certificate ---------------------------------------------------------------

export const CEREMONY = {
  walkEnd: 0.26,
  offer: 0.34,
  meet: 0.42,
  take: 0.5,
  clapStart: 0.46,
  clapEnd: 0.7,
  gatherStart: 0.72,
  gatherEnd: 0.88,
  photoStart: 0.84,
  photoEnd: 0.95,
} as const;

export const CEREMONY_STAGES = ['The approach', 'The handover', 'The applause', 'The reveal', 'The photograph'] as const;

/** Where people stand. The audience is further back: smaller, higher, either side of the stage. */
export const CEREMONY_PLACES = {
  start: -1.5,
  recipient: -0.12,
  official: 0.42,
  audience: [-1.35, -1.0, -0.65, 0.9, 1.25, 1.6],
  audienceScale: 0.64,
  audienceY: 0.1,
} as const;

/** Where the certificate changes hands, and where the honoree shows it. */
export const HANDOFF: Vec = { x: (CEREMONY_PLACES.recipient + CEREMONY_PLACES.official) / 2, y: 0.62 };
const SHOW: Vec = { x: CEREMONY_PLACES.recipient + 0.17, y: 0.7 };
const OFFICIAL_HOLD: Vec = { x: CEREMONY_PLACES.official - 0.13, y: 0.6 };

/** Number of claps over the applause. */
export const CLAPS = 7;

/** Gap between the hands of an applauding figure; 0 at each clap. Figure k is a little out of step. */
export function clapGap(p: number, k = 0): number {
  const C = CEREMONY;
  const t = clamp01((p - C.clapStart) / (C.clapEnd - C.clapStart));
  return 0.16 * Math.abs(Math.sin(t * CLAPS * Math.PI + k * 0.7));
}

export interface CeremonyFrame {
  recipient: Actor;
  official: Actor;
  audience: Actor[];
  /** The certificate's grip (the middle of its lower edge), on the stage. */
  certificate: Vec;
  /** 0 = the scene on stage, 1 = its dots fully gathered into the photograph. */
  gather: number;
  photo: number;
  stage: number;
}

export function ceremonyStageAt(p: number): number {
  const C = CEREMONY;
  if (p < C.walkEnd) return 0;
  if (p < C.take) return 1;
  if (p < C.gatherStart) return 2;
  if (p < C.photoStart) return 3;
  return 4;
}

export function ceremonyAt(p: number): CeremonyFrame {
  const C = CEREMONY;
  const P = CEREMONY_PLACES;

  // The honoree walks up, reaches for the certificate, takes it and holds it up.
  const s = stroll(p, 0, C.walkEnd, P.start, P.recipient);
  const rAt: Place = { x: s.x, y: 0, facing: 1, scale: 1 };
  let rPose: Pose = { ...walk(s.phi, s.amp), hipX: 0 };
  if (p >= C.walkEnd) rPose = { ...mix(walk(s.phi, 0), STAND, smooth(C.walkEnd, C.walkEnd + 0.03, p)), hipX: 0 };
  const rTarget = p < C.take ? HANDOFF : { x: lerp(HANDOFF.x, SHOW.x, smooth(C.take, C.take + 0.08, p)), y: lerp(HANDOFF.y, SHOW.y, smooth(C.take, C.take + 0.08, p)) };
  rPose = armTo(rPose, rAt, 1, rTarget, p < C.take ? smooth(C.offer, C.meet, p) : 1);

  // The official holds the certificate, offers it, lets go and lowers the arm.
  const oAt: Place = { x: P.official, y: 0, facing: -1, scale: 1 };
  const offer = smooth(C.walkEnd, C.offer, p);
  const oTarget = { x: lerp(OFFICIAL_HOLD.x, HANDOFF.x, offer), y: lerp(OFFICIAL_HOLD.y, HANDOFF.y, offer) };
  const oPose = armTo(STAND, oAt, 1, oTarget, 1 - smooth(C.take, C.take + 0.06, p));

  // The audience applauds once the certificate is handed over.
  const clapping = smooth(C.clapStart, C.clapStart + 0.03, p) * (1 - smooth(C.clapEnd - 0.03, C.clapEnd, p));
  const audience = P.audience.map((x, k) => {
    const at: Place = { x, y: P.audienceY, facing: x < 0 ? 1 : -1, scale: P.audienceScale };
    // Hands raised in front of the face, so the applause reads at a distance.
    const chest = toStage({ x: 0.15, y: 0.74 }, at);
    const gap = clapGap(p, k) * at.scale;
    let pose = armTo(STAND, at, 0, { x: chest.x - (at.facing * gap) / 2, y: chest.y }, clapping);
    pose = armTo(pose, at, 1, { x: chest.x + (at.facing * gap) / 2, y: chest.y }, clapping);
    return { joints: solve(pose), at };
  });

  const recipient = { joints: solve(rPose), at: rAt };
  const official = { joints: solve(oPose), at: oAt };
  // The certificate is in the official's hand until the honoree's hand closes on it.
  const holder = p < (C.meet + C.take) / 2 ? official : recipient;
  return {
    recipient,
    official,
    audience,
    certificate: hand(holder, 1),
    gather: smooth(C.gatherStart, C.gatherEnd, p),
    photo: smooth(C.photoStart, C.photoEnd, p),
    stage: ceremonyStageAt(p),
  };
}

// ---- Event 3: the judge ---------------------------------------------------------------------

export const JUDGING = {
  walk1End: 0.17,
  look1End: 0.29,
  walk2End: 0.43,
  look2End: 0.53,
  flash: 0.62,
  gatherStart: 0.68,
  gatherEnd: 0.86,
  photoStart: 0.82,
  photoEnd: 0.94,
} as const;

export const JUDGING_STAGES = ['Meet the teams', 'A closer look', 'The moment', 'The photograph'] as const;

/** Tables along the floor; a team member stands at each, typing, and the judge walks between them. */
export const FLOOR = {
  tables: [-1.05, 0.02, 1.09],
  tableTop: 0.45,
  tableFrom: -0.1,
  tableTo: 0.26,
  typerX: -0.18,
  typerScale: 0.86,
  keys: -0.03,
  start: -1.8,
  look1: -0.5,
  look2: 0.58,
} as const;

export interface JudgingFrame {
  judge: Actor;
  team: Actor[];
  /** 0..1: the white-out of the camera flash. */
  flash: number;
  /** 0 = the scene on stage, 1 = its dots fully gathered into the clipping. */
  gather: number;
  photo: number;
  stage: number;
}

export function judgingStageAt(p: number): number {
  const J = JUDGING;
  if (p < J.walk1End * 0.6) return 0;
  if (p < J.flash - 0.02) return 1;
  if (p < J.photoStart) return 2;
  return 3;
}

export function judgingAt(p: number): JudgingFrame {
  const J = JUDGING;
  const F = FLOOR;

  // The judge walks to the first gap, looks at the work, walks on to the next and looks again.
  const first = stroll(p, 0, J.walk1End, F.start, F.look1);
  const second = stroll(p, J.look1End, J.walk2End, F.look1, F.look2);
  const s = p < J.look1End ? first : { ...second, phi: first.phi + second.phi };
  const look = p < J.look1End ? smooth(J.walk1End, J.walk1End + 0.03, p) * (1 - smooth(J.look1End - 0.02, J.look1End, p)) : smooth(J.walk2End, J.walk2End + 0.03, p);
  const judge: Actor = { joints: solve({ ...mix(walk(s.phi, s.amp), NOTICE, look), hipX: 0 }), at: { x: s.x, y: 0, facing: 1, scale: 1 } };

  // Each team member types: the hands take turns on the keyboard.
  const team = F.tables.map((tx, k) => {
    const at: Place = { x: tx + F.typerX, y: 0, facing: 1, scale: F.typerScale };
    const beat = p * 90 + k * 1.3;
    const key = (o: number, phase: number) => ({ x: tx + F.keys + o, y: F.tableTop + 0.012 + 0.018 * Math.max(0, Math.sin(beat + phase)) });
    let pose: Pose = { ...STAND, spine: 0.12, head: 0.35 };
    pose = armTo(pose, at, 0, key(-0.045, Math.PI));
    pose = armTo(pose, at, 1, key(0, 0));
    return { joints: solve(pose), at };
  });

  const flash = smooth(J.flash - 0.015, J.flash, p) * (1 - smooth(J.flash, J.flash + 0.05, p));
  return {
    judge,
    team,
    flash,
    gather: smooth(J.gatherStart, J.gatherEnd, p),
    photo: smooth(J.photoStart, J.photoEnd, p),
    stage: judgingStageAt(p),
  };
}

// ---- Props ----------------------------------------------------------------------------------

/** The certificate's size; its grip is the middle of its lower edge. */
export const CERT = { w: 0.19, h: 0.13 };
