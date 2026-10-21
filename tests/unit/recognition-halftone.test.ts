import { describe, expect, it } from 'vitest';
import { TONE, pair, readMask, sampleDensity } from '../../src/features/recognition/halftone';

/** A cols × rows RGBA mask with a filled rectangle in one channel (0 red, 1 green, 2 blue). */
function mask(cols: number, rows: number, rects: [number, number, number, number, number][]) {
  const rgba = new Uint8ClampedArray(cols * rows * 4);
  for (const [x0, y0, x1, y1, ch] of rects) {
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) rgba[(j * cols + i) * 4 + ch] = 255;
  }
  return rgba;
}

describe('the halftone renderer', () => {
  it('puts one dot on every covered cell, near its centre, and none elsewhere', () => {
    const dots = readMask(mask(20, 10, [[4, 2, 9, 7, 1]]), 20, 10, 5);
    expect(dots.count).toBe(25);
    for (let k = 0; k < dots.count; k++) {
      expect(dots.x[k]).toBeGreaterThanOrEqual(4 * 5);
      expect(dots.x[k]).toBeLessThanOrEqual(9 * 5);
      expect(dots.y[k]).toBeGreaterThanOrEqual(2 * 5);
      expect(dots.y[k]).toBeLessThanOrEqual(7 * 5);
      expect(dots.tone[k]).toBe(TONE.front);
    }
  });

  it('is deterministic: the same mask gives the same dots, so nothing shimmers', () => {
    const m = mask(30, 20, [[3, 3, 12, 18, 1], [10, 5, 25, 9, 0]]);
    const a = readMask(m, 30, 20, 4);
    const b = readMask(m, 30, 20, 4);
    expect(Array.from(a.x.subarray(0, a.count))).toEqual(Array.from(b.x.subarray(0, b.count)));
    expect(Array.from(a.alpha.subarray(0, a.count))).toEqual(Array.from(b.alpha.subarray(0, b.count)));
  });

  it('a main figure in front of the audience takes the front tone; props keep theirs', () => {
    const dots = readMask(mask(10, 4, [[0, 0, 10, 4, 0], [0, 0, 5, 4, 1], [8, 0, 10, 2, 2]]), 10, 4, 4);
    const at = (i: number, j: number) => {
      for (let k = 0; k < dots.count; k++) if (Math.floor(dots.x[k]! / 4) === i && Math.floor(dots.y[k]! / 4) === j) return dots.tone[k];
      return -1;
    };
    expect(at(2, 2)).toBe(TONE.front);
    expect(at(6, 3)).toBe(TONE.back);
    expect(at(9, 0)).toBe(TONE.prop);
  });

  it('lights the edge facing the top-left more than the inside', () => {
    const dots = readMask(mask(12, 12, [[2, 2, 10, 10, 1]]), 12, 12, 4);
    const alphaAt = (i: number, j: number) => {
      for (let k = 0; k < dots.count; k++) if (Math.floor(dots.x[k]! / 4) === i && Math.floor(dots.y[k]! / 4) === j) return dots.alpha[k]!;
      return 0;
    };
    expect(alphaAt(2, 5)).toBeGreaterThan(alphaAt(6, 6));
  });

  it('samples the photograph where its density is, deterministically', () => {
    // A map that is bright only in its left half.
    const w = 20;
    const h = 10;
    const data = new Uint8Array(w * h).map((_, k) => (k % w < w / 2 ? 255 : 0));
    const pts = sampleDensity(2000, { data, w, h });
    expect(Array.from(pts)).toEqual(Array.from(sampleDensity(2000, { data, w, h })));
    let left = 0;
    for (let k = 0; k < 2000; k++) if (pts[k * 2]! < 0.5) left++;
    expect(left / 2000).toBeGreaterThan(0.97);
    // Without a map the points fill the box.
    const even = sampleDensity(500, null);
    expect(even.every((v) => v >= 0 && v <= 1)).toBe(true);
  });

  it('pairs every dot with a different target, keeping top with top and left with left', () => {
    const n = 400;
    const sx = Float32Array.from({ length: n }, (_, k) => (k % 20) * 3);
    const sy = Float32Array.from({ length: n }, (_, k) => Math.floor(k / 20) * 3);
    const tx = Float32Array.from({ length: n }, (_, k) => 500 + (k % 20));
    const ty = Float32Array.from({ length: n }, (_, k) => 100 + Math.floor(k / 20));
    const to = pair(sx, sy, tx, ty, n);
    expect(new Set(to).size).toBe(n);
    // The top-left dot lands top-left, the bottom-right dot bottom-right.
    expect(tx[to[0]!]).toBe(500);
    expect(ty[to[0]!]).toBe(100);
    expect(tx[to[n - 1]!]).toBe(519);
    expect(ty[to[n - 1]!]).toBe(119);
  });
});
