import { describe, expect, it } from 'vitest';
import { DEFAULT_THRESHOLD, SAMPLE_SIZE, samplePortrait } from '../../src/features/particle-portrait/sampling';

// Verbatim body of `sample()` from legacy/particle-portrait/portrait.js (line 10), minus the DOM
// and GL calls. It is the oracle the maintained implementation must reproduce bit for bit.
function legacySample(data: Uint8ClampedArray, step: number): Float32Array {
  const arr: number[] = [];
  for (let y = 0; y < 600; y += step)
    for (let x = 0; x < 600; x += step) {
      const i = (y * 600 + x) * 4,
        r = data[i]!,
        g = data[i + 1]!,
        b = data[i + 2]!;
      if (r * 0.2126 + g * 0.7152 + b * 0.0722 < 33) continue;
      arr.push((x - 300) / 600, (300 - y) / 600, r / 255, g / 255, b / 255);
    }
  return new Float32Array(arr);
}

// Deterministic pseudo-random RGBA image (mulberry32), with dark regions so the threshold matters.
function syntheticImage(seed: number): Uint8ClampedArray {
  let a = seed;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const px = new Uint8ClampedArray(SAMPLE_SIZE * SAMPLE_SIZE * 4);
  for (let i = 0; i < px.length; i += 4) {
    const dark = rand() < 0.4;
    px[i] = dark ? rand() * 40 : rand() * 255;
    px[i + 1] = dark ? rand() * 40 : rand() * 255;
    px[i + 2] = dark ? rand() * 40 : rand() * 255;
    px[i + 3] = 255;
  }
  return px;
}

const bytes = (f: Float32Array) => Buffer.from(f.buffer, f.byteOffset, f.byteLength);

describe('samplePortrait', () => {
  it('uses the legacy constants', () => {
    expect(SAMPLE_SIZE).toBe(600);
    expect(DEFAULT_THRESHOLD).toBe(33);
  });

  for (const seed of [1, 7, 42]) {
    for (const step of [2, 3, 4]) {
      it(`is byte-identical to the legacy loop (seed ${seed}, step ${step})`, () => {
        const img = syntheticImage(seed);
        const expected = legacySample(img, step);
        const actual = samplePortrait(img, SAMPLE_SIZE, step);
        expect(actual.length).toBe(expected.length);
        expect(bytes(actual).equals(bytes(expected))).toBe(true);
      });
    }
  }

  it('discards pixels exactly below the luminance threshold', () => {
    const img = new Uint8ClampedArray(SAMPLE_SIZE * SAMPLE_SIZE * 4);
    img.set([34, 34, 34, 255], 0); // luminance 34: kept
    img.set([32, 32, 32, 255], 8); // luminance 32: discarded
    const points = samplePortrait(img, SAMPLE_SIZE, 2);
    expect(points.length / 5).toBe(1);
    expect(Array.from(points.slice(0, 2))).toEqual([-0.5, 0.5]);
  });

  it('maps the image centre to the origin with y pointing up', () => {
    const img = new Uint8ClampedArray(SAMPLE_SIZE * SAMPLE_SIZE * 4);
    const set = (x: number, y: number) => img.set([255, 255, 255, 255], (y * SAMPLE_SIZE + x) * 4);
    set(300, 300);
    set(300, 0);
    const points = Array.from(samplePortrait(img, SAMPLE_SIZE, 2));
    expect(points.slice(0, 2)).toEqual([0, 0.5]); // top row comes first
    expect(points.slice(5, 7)).toEqual([0, 0]);
  });
});
