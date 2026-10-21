// Drawing the three event scenes on a 2D canvas. Each scene is a pure function of the scroll
// progress p; this module paints a frame as clean silhouettes into a small mask, reads the mask
// back as a fixed grid of halftone dots (halftone.ts), and at the reveal flies those dots into
// the photograph's own density map, over the place where the print lands.

import { CEREMONY, CERT, ceremonyAt, FLOOR, JUDGING, judgingAt, toStage, type Place } from './actors';
import { clamp01, frameAt, lerp, TIMELINE, type Joints, type Vec } from './figure';
import { easeInOut, INK, makeDots, paintCertificate, paintDesk, paintPerson, paintTrophy, pair, readMask, sampleDensity, TONE, type Dots, type Pen } from './halftone';

/** Dot colours by tone: back (audience, back limbs), front (the main figures), props. */
const COLORS = ['#8ba3c5', '#f0ecdd', '#f0ecdd'] as const;
const FLASH = '#f0ecdd';

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
  /** A pen for a figure placed on the stage (or the stage itself). */
  pen(at?: Place): Pen;
  person(joints: Joints, at: Place, main: boolean): void;
  ink(color: string): void;
}

interface Spec {
  span: number;
  frame: (p: number) => SceneFrame;
  /** The progress at which the dots leave the grid. */
  gatherStart: number;
  paint: (m: Painter, p: number) => void;
  overlay?: (ctx: CanvasRenderingContext2D, p: number, v: View) => void;
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
    pen: (at = STAGE_AT) => ({ ctx: mctx, map: (v) => toMask(toStage(v, at)), s: (scale * at.scale) / cell }),
    person: (joints, at, main) => paintPerson(painter.pen(at), joints, main ? INK.front : INK.back, INK.back),
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
      spec.overlay?.(ctx, p, v);
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
      m.person(f.joints, STAGE_AT, true);
      m.ink(INK.prop);
      paintTrophy(m.pen(), f.trophy);
    },
  });
}

// ---- Event 2: the certificate ---------------------------------------------------------------

export function ceremonyScene(): Scene {
  return halftoneScene({
    span: WIDE,
    frame: (p) => ceremonyAt(p),
    gatherStart: CEREMONY.gatherStart,
    paint(m, p) {
      const f = ceremonyAt(p);
      for (const a of f.audience) m.person(a.joints, a.at, false);
      m.person(f.official.joints, f.official.at, true);
      m.person(f.recipient.joints, f.recipient.at, true);
      m.ink(INK.prop);
      paintCertificate(m.pen(), { x: f.certificate.x, y: f.certificate.y - CERT.h * 0.15 }, CERT.w, CERT.h);
    },
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
      // The desks stay in the background tone, so the judge is what the eye follows.
      m.ink(INK.back);
      for (const x of FLOOR.tables) paintDesk(m.pen(), x, FLOOR.tableTop, FLOOR.tableFrom, FLOOR.tableTo);
      m.person(f.judge.joints, f.judge.at, true);
    },
    // The camera flash: a white-out from where the photographer stands, off stage at the front.
    overlay(ctx, p, v) {
      const { flash } = judgingAt(p);
      if (flash <= 0) return;
      const g = ctx.createRadialGradient(v.w * 0.5 * v.dpr, v.h * v.dpr, 0, v.w * 0.5 * v.dpr, v.h * v.dpr, Math.max(v.w, v.h) * v.dpr);
      g.addColorStop(0, FLASH);
      g.addColorStop(1, 'rgba(240, 236, 221, 0.6)');
      ctx.globalAlpha = 0.85 * flash;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, v.w * v.dpr, v.h * v.dpr);
      ctx.globalAlpha = 1;
    },
  });
}
