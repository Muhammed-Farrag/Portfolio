// Drawing the three event scenes on a 2D canvas. Each scene is a pure function of the scroll
// progress p; this module paints a frame as clean silhouettes into a small mask, reads the mask
// back as a fixed grid of halftone dots (halftone.ts), and at the reveal flies those dots into
// the photograph's own density map, over the place where the print lands.

import { CEREMONY, CERT, ceremonyAt, FLOOR, JUDGING, judgingAt, toStage, type Clap, type Place } from './actors';
import { clamp01, frameAt, lerp, PEDESTAL, STAGE, TIMELINE, TROPHY, type Joints, type Vec } from './figure';
import {
  cellHash,
  easeInOut,
  INK,
  makeDots,
  paintCertificate,
  paintPedestal,
  paintPerson,
  paintPersonFront,
  paintRobot,
  paintTable,
  paintTrophy,
  pair,
  readMask,
  sampleDensity,
  TONE,
  type Dots,
  type Pen,
} from './halftone';

/** Dot colours by tone: back (audience, back limbs: dimmed titanium), front (ivory), props (Desert Titanium). */
const COLORS = ['#a08a78', '#f4eee4', '#bfa48f'] as const;
const FLASH = '#f4eee4';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The canvas in CSS pixels, the stage centre and ground line, and the photograph's image box. */
export interface View {
  w: number;
  h: number;
  dpr: number;
  cx: number;
  ground: number;
  photo: Box;
}

/** A photograph's density map: w × h, row-major, 0..255 (brighter = more dots). */
export interface Density {
  data: ArrayLike<number>;
  w: number;
  h: number;
}

export interface SceneFrame {
  /** How far the photograph has appeared (0..1). */
  photo: number;
  /** How far the dots have gathered into the photograph (0..1). */
  gather: number;
  /** The current narrative stage. */
  stage: number;
}

export interface Scene {
  draw(ctx: CanvasRenderingContext2D, p: number, view: View): void;
  frame(p: number): SceneFrame;
  /** The photograph's density map, once it has loaded; until then the dots fill its box evenly. */
  setTarget(map: Density | null): void;
}

/**
 * Pixels per figure unit: the figure stands a little under half the stage high. On a phone the
 * stage fits `span` figure units across, so the wider scenes keep everyone in view.
 */
const unit = (v: View, span: number) => Math.min(v.h * 0.46, v.w < 768 ? v.w / span : v.w * 0.36);
/** Width, in figure units, of the scenes with several figures. */
const WIDE = 3.3;
/** Halftone cell, CSS pixels: about 90 cells to a figure's height, within readable limits. */
const cellFor = (v: View, span: number) => Math.min(5.2, Math.max(2.6, unit(v, span) / 90));

/** A soft round dot, pre-rendered once per colour. */
function sprite(color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, color);
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}

/** Draws into the mask: maps stage points to mask pixels. */
export interface Painter {
  /** A pen for a figure placed on the stage (or the stage itself), optionally narrowed about x = `about`. */
  pen(at?: Place, squash?: { about: number; k: number }): Pen;
  person(joints: Joints, at: Place, main: boolean, thumb?: number): void;
  /**
   * The main figure turning from profile (at `at`) to face the camera (`front`, stage
   * coordinates): the two silhouettes cross-fade while one narrows and the other widens, which
   * reads as the body rotating.
   */
  turning(profile: Joints, at: Place, front: Joints | null, turn: number): void;
  /** A prop held in front of a body: a small gap is cut around it first, so it stays a shape of its own. */
  onTop(centre: Vec, paint: (pen: Pen) => void): void;
  ink(color: string): void;
}

/** A walking figure, for its trail of dust. */
interface Walker {
  x: number;
  dir: 1 | -1;
  amount: number;
}

/** Drawing straight onto the canvas, over or under the halftone. */
export interface Brush {
  toPx(v: Vec): Vec;
  dot(tone: number, x: number, y: number, size: number, alpha: number): void;
  cell: number;
  scale: number;
}

interface Spec {
  span: number;
  frame: (p: number) => SceneFrame;
  /** The progress at which the dots leave the grid. */
  gatherStart: number;
  paint: (m: Painter, p: number) => void;
  walkers?: (p: number) => Walker[];
  overlay?: (ctx: CanvasRenderingContext2D, p: number, v: View, b: Brush) => void;
}

const STAGE_AT: Place = { x: 0, y: 0, facing: 1, scale: 1 };

function halftoneScene(spec: Spec): Scene {
  const mask = document.createElement('canvas');
  const mctx = mask.getContext('2d', { willReadFrequently: true })!;
  const sprites = COLORS.map(sprite);
  let target: Density | null = null;
  let key = '';
  let cell = 4;
  let cols = 0;
  let rows = 0;
  let scale = 1;
  let view: View | null = null;
  let live: Dots = makeDots(4096);
  // The dots at the moment they leave the grid, and where each one lands.
  let snap: { dots: Dots; tx: Float32Array; ty: Float32Array; size: number; delay: Float32Array } | null = null;

  const toMask = (s: Vec): Vec => ({ x: (view!.cx + s.x * scale) / cell, y: (view!.ground - s.y * scale) / cell });
  const painter: Painter = {
    pen: (at = STAGE_AT, squash) => ({
      ctx: mctx,
      map: (v) => {
        const st = toStage(v, at);
        return toMask(squash ? { x: squash.about + (st.x - squash.about) * squash.k, y: st.y } : st);
      },
      s: (scale * at.scale) / cell,
    }),
    person: (joints, at, main, thumb = 0) => paintPerson(painter.pen(at), joints, main ? INK.front : INK.back, INK.back, thumb),
    turning(profile, at, front, turn) {
      const about = toStage(profile.hip, at).x;
      if (turn < 1) {
        mctx.globalAlpha = 1 - turn;
        paintPerson(painter.pen(at, { about, k: 1 - 0.45 * turn }), profile, INK.front, INK.back);
      }
      if (front && turn > 0) {
        mctx.globalAlpha = turn;
        paintPersonFront(painter.pen(STAGE_AT, { about, k: 0.55 + 0.45 * turn }), front, INK.front);
      }
      mctx.globalAlpha = 1;
    },
    onTop(centre, paint) {
      const c = toMask(centre);
      mctx.save();
      mctx.globalCompositeOperation = 'destination-out';
      mctx.fillStyle = mctx.strokeStyle = '#000';
      const base = painter.pen();
      // The cut is the prop itself, grown by about one cell all round.
      const grow = (v: Vec) => {
        const q = base.map(v);
        const dx = q.x - c.x;
        const dy = q.y - c.y;
        const d = Math.hypot(dx, dy) || 1;
        return { x: q.x + (dx / d) * 1.2, y: q.y + (dy / d) * 1.2 };
      };
      paint({ ...base, map: grow });
      mctx.restore();
      painter.ink(INK.prop);
      paint(base);
    },
    ink: (color) => {
      mctx.fillStyle = color;
      mctx.strokeStyle = color;
    },
  };

  const layout = (v: View) => {
    const k = `${v.w}x${v.h}@${v.dpr}:${v.cx},${v.ground}:${v.photo.x},${v.photo.y},${v.photo.w},${v.photo.h}`;
    if (k === key) return;
    key = k;
    view = v;
    scale = unit(v, spec.span);
    cell = cellFor(v, spec.span);
    cols = Math.ceil(v.w / cell);
    rows = Math.ceil(v.h / cell);
    mask.width = cols;
    mask.height = rows;
    snap = null;
  };

  const render = (p: number, out?: Dots): Dots => {
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.globalCompositeOperation = 'source-over';
    mctx.clearRect(0, 0, cols, rows);
    mctx.globalCompositeOperation = 'lighter';
    spec.paint(painter, p);
    return readMask(mctx.getImageData(0, 0, cols, rows).data, cols, rows, cell, out);
  };

  const snapshot = (v: View) => {
    if (snap) return snap;
    const dots = render(spec.gatherStart);
    const n = dots.count;
    const uv = sampleDensity(n, target);
    const tx = new Float32Array(n);
    const ty = new Float32Array(n);
    let cover = 0;
    for (let k = 0; k < n; k++) {
      tx[k] = v.photo.x + uv[k * 2]! * v.photo.w;
      ty[k] = v.photo.y + uv[k * 2 + 1]! * v.photo.h;
    }
    if (target) {
      for (let k = 0; k < target.w * target.h; k++) cover += target.data[k]! / 255;
      cover /= target.w * target.h;
    } else cover = 1;
    const to = pair(dots.x, dots.y, tx, ty, n);
    const px = Float32Array.from(to, (t) => tx[t]!);
    const py = Float32Array.from(to, (t) => ty[t]!);
    // Dots set off in a sweep from the top of the photograph down, with a little randomness.
    const delay = new Float32Array(n);
    for (let k = 0; k < n; k++) delay[k] = 0.22 * dots.seed[k]! + 0.13 * clamp01((py[k]! - v.photo.y) / (v.photo.h || 1));
    const size = Math.min(cell * 1.15, Math.max(cell * 0.55, Math.sqrt((v.photo.w * v.photo.h * cover) / Math.max(1, n)) * 1.05));
    snap = { dots, tx: px, ty: py, size, delay };
    return snap;
  };

  const dot = (ctx: CanvasRenderingContext2D, tone: number, x: number, y: number, size: number, alpha: number, dpr: number) => {
    if (alpha <= 0.01) return;
    const back = tone === TONE.back;
    const s = size * (back ? 0.88 : 1) * 1.45 * dpr;
    ctx.globalAlpha = Math.min(1, alpha * (back ? 0.62 : 1));
    ctx.drawImage(sprites[tone]!, x * dpr - s / 2, y * dpr - s / 2, s, s);
  };

  const brush = (ctx: CanvasRenderingContext2D, v: View): Brush => ({
    toPx: (s) => ({ x: v.cx + s.x * scale, y: v.ground - s.y * scale }),
    dot: (tone, x, y, size, alpha) => dot(ctx, tone, x, y, size, alpha, v.dpr),
    cell,
    scale,
  });

  /** Loose dots drifting off behind a walking figure, thinning out with distance. Fixed per dot, so reversible. */
  const trail = (b: Brush, w: Walker) => {
    if (w.amount <= 0.01) return;
    const N = 34;
    for (let i = 0; i < N; i++) {
      const age = (i + 0.5) / N;
      const h = cellHash(i, 3, 17);
      const x = w.x - w.dir * (0.08 + age * 0.42 + (h - 0.5) * 0.08);
      const y = 0.06 + cellHash(i, 5, 17) * 0.82 * (1 - age * 0.45) + age * 0.04;
      const q = b.toPx({ x, y });
      b.dot(TONE.back, q.x, q.y, b.cell * (0.6 - age * 0.3), w.amount * (1 - age) * 0.7);
    }
  };

  const ground = (ctx: CanvasRenderingContext2D, v: View, alpha: number) => {
    if (alpha <= 0) return;
    const y = (Math.round(v.ground / cell) + 0.5) * cell;
    for (let i = 0; i < cols; i += 2) dot(ctx, TONE.back, (i + 0.5) * cell, y, cell * 0.42, 0.75 * alpha, v.dpr);
  };

  return {
    frame: spec.frame,
    setTarget(map) {
      target = map;
      snap = null;
    },
    draw(ctx, p, v) {
      layout(v);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, v.w * v.dpr, v.h * v.dpr);
      const f = spec.frame(p);
      ground(ctx, v, 1 - f.gather * 2);
      if (f.gather <= 0) {
        for (const w of spec.walkers?.(p) ?? []) trail(brush(ctx, v), w);
        live = render(p, live);
        for (let k = 0; k < live.count; k++) dot(ctx, live.tone[k]!, live.x[k]!, live.y[k]!, live.size[k]!, live.alpha[k]!, v.dpr);
      } else {
        const { dots, tx, ty, size, delay } = snapshot(v);
        const fade = 1 - f.photo;
        if (fade > 0.01) {
          for (let k = 0; k < dots.count; k++) {
            const e = easeInOut(clamp01((f.gather - delay[k]!) / 0.65));
            const sx = dots.x[k]!;
            const sy = dots.y[k]!;
            const dx = tx[k]! - sx;
            const dy = ty[k]! - sy;
            // A gentle arc, alternating sides, so the swarm doesn't fly in straight lines.
            const arc = Math.sin(Math.PI * e) * (dots.seed[k]! - 0.5) * 0.3;
            const tone = e > 0.6 ? TONE.front : dots.tone[k]!;
            dot(ctx, tone, sx + dx * e - dy * arc, sy + dy * e + dx * arc, lerp(dots.size[k]!, size, e), lerp(dots.alpha[k]!, 0.9, e) * fade, v.dpr);
          }
        }
      }
      ctx.globalAlpha = 1;
      spec.overlay?.(ctx, p, v, brush(ctx, v));
    },
  };
}

// ---- Event 1: the trophy --------------------------------------------------------------------

export function victoryScene(): Scene {
  return halftoneScene({
    span: 1.6,
    frame: (p) => frameAt(p),
    gatherStart: TIMELINE.gatherStart,
    paint(m, p) {
      const f = frameAt(p);
      m.ink(INK.back);
      paintPedestal(m.pen(), STAGE.trophyX, PEDESTAL.w, PEDESTAL.h);
      m.turning(f.joints, STAGE_AT, f.front, f.turn);
      m.onTop({ x: f.trophy.x, y: f.trophy.y + TROPHY.height / 2 }, (pen) => paintTrophy(pen, f.trophy));
    },
    walkers: (p) => {
      const f = frameAt(p);
      return [{ x: f.joints.hip.x, dir: 1, amount: f.walking }];
    },
  });
}

// ---- Event 2: the certificate ---------------------------------------------------------------

/** Three short dotted strokes springing up from hands that meet, so applause reads at a distance. */
function claps(b: Brush, list: Clap[]) {
  for (const c of list) {
    const o = b.toPx({ x: c.at.x, y: c.at.y + 0.03 });
    for (const a of [-0.5, 0, 0.5]) {
      for (let k = 0; k < 3; k++) {
        const r = (0.035 + k * 0.016) * b.scale;
        b.dot(TONE.prop, o.x + Math.sin(a) * r, o.y - Math.cos(a) * r, b.cell * 0.5, c.strength * (0.9 - k * 0.2));
      }
    }
  }
}

export function ceremonyScene(): Scene {
  return halftoneScene({
    span: WIDE,
    frame: (p) => ceremonyAt(p),
    gatherStart: CEREMONY.gatherStart,
    paint(m, p) {
      const f = ceremonyAt(p);
      for (const a of f.audience) m.person(a.joints, a.at, false);
      m.person(f.official.joints, f.official.at, true);
      m.turning(f.recipient.joints, f.recipient.at, f.recipientFront, f.turn);
      const grip = { x: f.certificate.x, y: f.certificate.y - CERT.h * 0.15 };
      m.onTop({ x: grip.x, y: grip.y + CERT.h / 2 }, (pen) => paintCertificate(pen, grip, CERT.w, CERT.h));
    },
    walkers: (p) => {
      const f = ceremonyAt(p);
      return [{ x: f.recipient.at.x, dir: 1, amount: f.walking }];
    },
    overlay: (_ctx, p, _v, b) => claps(b, ceremonyAt(p).claps),
  });
}

// ---- Event 3: the judge ---------------------------------------------------------------------

export function judgingScene(): Scene {
  return halftoneScene({
    span: WIDE,
    frame: (p) => judgingAt(p),
    gatherStart: JUDGING.gatherStart,
    paint(m, p) {
      const f = judgingAt(p);
      for (const a of f.team) m.person(a.joints, a.at, false);
      // The tables stay in the background tone; the robots on them are props.
      m.ink(INK.back);
      for (const x of FLOOR.tables) paintTable(m.pen(), x, FLOOR.tableTop, FLOOR.tableFrom, FLOOR.tableTo);
      for (const x of FLOOR.tables) m.onTop({ x: x + FLOOR.robot, y: FLOOR.tableTop + 0.06 }, (pen) => paintRobot(pen, x + FLOOR.robot, FLOOR.tableTop));
      m.person(f.judge.joints, f.judge.at, true, f.thumb);
    },
    walkers: (p) => {
      const f = judgingAt(p);
      return [{ x: f.judge.at.x, dir: 1, amount: f.walking }];
    },
    // The camera flash: a white-out from where the photographer stands, off stage at the front.
    overlay(ctx, p, v) {
      const { flash } = judgingAt(p);
      if (flash <= 0) return;
      const g = ctx.createRadialGradient(v.w * 0.5 * v.dpr, v.h * v.dpr, 0, v.w * 0.5 * v.dpr, v.h * v.dpr, Math.max(v.w, v.h) * v.dpr);
      g.addColorStop(0, FLASH);
      g.addColorStop(1, 'rgba(244, 238, 228, 0.6)');
      ctx.globalAlpha = 0.85 * flash;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, v.w * v.dpr, v.h * v.dpr);
      ctx.globalAlpha = 1;
    },
  });
}
