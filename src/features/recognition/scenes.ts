// Drawing the three event scenes on a 2D canvas. Each scene is a pure function of the scroll
// progress p; this module only turns a frame into dots.

import { CERT, ceremonyAt, certificatePoints, deskPoints, FLOOR, judgingAt, pagePoints, toStage, type Actor } from './actors';
import { createParticles, frameAt, mulberry32, placeParticles, type Frame, type Particles } from './figure';

const COLORS = { back: '#8ba3c5', front: '#f0ecdd', dim: '#b3c4dc', ground: '#495b7d', flash: '#f0ecdd' } as const;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The canvas in CSS pixels, the stage centre and ground line, and where the photograph sits. */
export interface View {
  w: number;
  h: number;
  dpr: number;
  cx: number;
  ground: number;
  photo: Box;
}

export interface Scene {
  draw(ctx: CanvasRenderingContext2D, p: number, view: View): void;
  /** How far the photograph has appeared (0..1), and the current narrative stage. */
  frame(p: number): { photo: number; stage: number };
}

/**
 * Pixels per figure unit: the figure stands a little under half the stage high. On a phone the
 * stage fits `span` figure units across, so the wider scenes keep everyone in view.
 */
const unit = (v: View, span = 1.6) => Math.min(v.h * 0.46, v.w < 768 ? v.w / span : v.w * 0.36);
/** Width, in figure units, of the scenes with several figures. */
const WIDE = 3.3;
const dotSize = (v: View, span?: number) => Math.max(1.6, unit(v, span) / 190) * v.dpr;

function clear(ctx: CanvasRenderingContext2D, v: View) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, v.w * v.dpr, v.h * v.dpr);
}

/** The ground: a dotted line that fades with the figures. */
function ground(ctx: CanvasRenderingContext2D, v: View, alpha: number, span?: number) {
  if (alpha <= 0) return;
  const size = dotSize(v, span);
  const y = v.ground;
  ctx.globalAlpha = 0.7 * alpha;
  ctx.fillStyle = COLORS.ground;
  for (let x = 0; x < v.w; x += 6) ctx.fillRect(x * v.dpr, y * v.dpr, size * 0.8, size * 0.8);
}

// ---- Event 1: the trophy --------------------------------------------------------------------

export function victoryScene(small: boolean): Scene {
  const ps = createParticles(small ? 1300 : 2400);
  const buf = new Float32Array(ps.count * 2);
  return {
    frame: (p) => frameAt(p),
    draw(ctx, p, v) {
      const f = frameAt(p);
      const scale = unit(v);
      const size = dotSize(v);
      clear(ctx, v);
      ground(ctx, v, 1 - f.disperse);
      placeParticles(ps, f, buf);
      const alpha = 1 - f.disperse ** 1.6;
      if (alpha <= 0.002) return;
      for (let i = 0; i < ps.count; i++) {
        const part = ps.part[i]!;
        const s = ps.seed[i]!;
        ctx.fillStyle = part === 'trophy' ? (s > 0.35 ? COLORS.front : COLORS.dim) : part.endsWith('0') ? COLORS.back : s > 0.82 ? COLORS.back : COLORS.front;
        ctx.globalAlpha = alpha * (part.endsWith('0') ? 0.7 : 0.75 + s * 0.25);
        const x = (v.cx + buf[i * 2]! * scale) * v.dpr;
        const y = (v.ground - buf[i * 2 + 1]! * scale) * v.dpr;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    },
  };
}

// ---- Shared: a stage of several figures and props -------------------------------------------

type Tone = 0 | 1 | 2; // 0 back (dim figures), 1 front (the main figures), 2 prop

/**
 * A pool of dots on the stage. Each frame the scene writes every dot's stage position in order;
 * the pool adds the dispersal and the gathering into the page, and draws.
 */
class Crowd {
  readonly pos: Float32Array;
  readonly tone: Uint8Array;
  readonly seed: Float32Array;
  readonly dir: Float32Array;
  private n = 0;
  private readonly tmp = new Float32Array(4096);

  constructor(readonly count: number, tones: Tone[]) {
    const rnd = mulberry32(5);
    this.pos = new Float32Array(count * 2);
    this.tone = Uint8Array.from(tones);
    this.seed = new Float32Array(count).map(() => rnd());
    this.dir = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const speed = 0.4 + rnd() * 1.1;
      this.dir[i * 2] = Math.cos(a) * speed;
      this.dir[i * 2 + 1] = Math.sin(a) * speed + 0.35;
    }
  }

  begin() {
    this.n = 0;
  }

  body(ps: Particles, a: Actor) {
    placeParticles(ps, { joints: a.joints, trophy: { x: 0, y: 0 }, disperse: 0 } as Frame, this.tmp);
    for (let i = 0; i < ps.count; i++) {
      const s = toStage({ x: this.tmp[i * 2]!, y: this.tmp[i * 2 + 1]! }, a.at);
      this.pos[this.n * 2] = s.x;
      this.pos[this.n * 2 + 1] = s.y;
      this.n++;
    }
  }

  points(pts: Float32Array, ox: number, oy: number) {
    for (let i = 0; i < pts.length; i += 2) {
      this.pos[this.n * 2] = ox + pts[i]!;
      this.pos[this.n * 2 + 1] = oy + pts[i + 1]!;
      this.n++;
    }
  }

  /** Draws the pool. `page` gathers every dot into `target` (page coordinates) over the photograph's box. */
  draw(ctx: CanvasRenderingContext2D, v: View, disperse: number, page = 0, target?: Float32Array) {
    const scale = unit(v, WIDE);
    const size = dotSize(v, WIDE);
    const spread = disperse * disperse * 1.8;
    const alpha = 1 - disperse ** 1.6;
    if (alpha <= 0.002) return;
    const fill = [COLORS.back, COLORS.front, COLORS.dim];
    for (let i = 0; i < this.count; i++) {
      const tone = this.tone[i]!;
      const s = this.seed[i]!;
      let x = v.cx + (this.pos[i * 2]! + this.dir[i * 2]! * spread) * scale;
      let y = v.ground - (this.pos[i * 2 + 1]! + this.dir[i * 2 + 1]! * spread) * scale;
      if (page > 0 && target) {
        x += (v.photo.x + target[i * 2]! * v.photo.w - x) * page;
        y += (v.photo.y + target[i * 2 + 1]! * v.photo.h - y) * page;
      }
      ctx.fillStyle = page > 0.5 ? (s > 0.3 ? COLORS.front : COLORS.dim) : tone === 1 && s > 0.82 ? COLORS.back : fill[tone]!;
      ctx.globalAlpha = alpha * (tone === 0 ? 0.55 + s * 0.2 : 0.75 + s * 0.25);
      ctx.fillRect(x * v.dpr - size / 2, y * v.dpr - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }
}

const tones = (parts: [number, Tone][]) => parts.flatMap(([n, t]) => Array<Tone>(n).fill(t));

// ---- Event 2: the certificate ---------------------------------------------------------------

export function ceremonyScene(small: boolean): Scene {
  const k = small ? 0.55 : 1;
  const recipient = createParticles(Math.round(900 * k), 12, false);
  const official = createParticles(Math.round(820 * k), 13, false);
  const audience = Array.from({ length: 6 }, (_, i) => createParticles(Math.round(240 * k), 40 + i, false));
  const cert = certificatePoints(Math.round(300 * k));
  const crowd = new Crowd(
    recipient.count + official.count + audience.reduce((n, a) => n + a.count, 0) + cert.length / 2,
    tones([[audience.reduce((n, a) => n + a.count, 0), 0], [official.count, 1], [recipient.count, 1], [cert.length / 2, 2]]),
  );
  return {
    frame: (p) => ceremonyAt(p),
    draw(ctx, p, v) {
      const f = ceremonyAt(p);
      clear(ctx, v);
      ground(ctx, v, 1 - f.disperse, WIDE);
      crowd.begin();
      f.audience.forEach((a, i) => crowd.body(audience[i]!, a));
      crowd.body(official, f.official);
      crowd.body(recipient, f.recipient);
      crowd.points(cert, f.certificate.x, f.certificate.y - CERT.h * 0.15);
      crowd.draw(ctx, v, f.disperse);
    },
  };
}

// ---- Event 3: the judge ---------------------------------------------------------------------

export function judgingScene(small: boolean): Scene {
  const k = small ? 0.55 : 1;
  const judge = createParticles(Math.round(950 * k), 14, false);
  const team = FLOOR.tables.map((_, i) => createParticles(Math.round(520 * k), 50 + i, false));
  const desks = FLOOR.tables.map((_, i) => deskPoints(Math.round(300 * k), 60 + i));
  const teamCount = team.reduce((n, t) => n + t.count, 0);
  const deskCount = desks.reduce((n, d) => n + d.length / 2, 0);
  const crowd = new Crowd(teamCount + deskCount + judge.count, tones([[teamCount, 0], [deskCount, 2], [judge.count, 1]]));
  const page = pagePoints(crowd.count);
  return {
    frame: (p) => judgingAt(p),
    draw(ctx, p, v) {
      const f = judgingAt(p);
      clear(ctx, v);
      ground(ctx, v, 1 - f.page, WIDE);
      crowd.begin();
      f.team.forEach((a, i) => crowd.body(team[i]!, a));
      desks.forEach((d, i) => crowd.points(d, FLOOR.tables[i]!, 0));
      crowd.body(judge, f.judge);
      crowd.draw(ctx, v, f.disperse, f.page, page);
      // The camera flash: a white-out from where the photographer stands, off stage at the front.
      if (f.flash > 0) {
        const g = ctx.createRadialGradient(v.w * 0.5 * v.dpr, v.h * v.dpr, 0, v.w * 0.5 * v.dpr, v.h * v.dpr, Math.max(v.w, v.h) * v.dpr);
        g.addColorStop(0, COLORS.flash);
        g.addColorStop(1, 'rgba(240, 236, 221, 0.6)');
        ctx.globalAlpha = 0.85 * f.flash;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, v.w * v.dpr, v.h * v.dpr);
        ctx.globalAlpha = 1;
      }
    },
  };
}
