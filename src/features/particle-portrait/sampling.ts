// Point sampling, ported from legacy/particle-portrait/portrait.js `sample()` without
// behavioural change. tests/unit/sampling.test.ts checks it against a verbatim copy of the
// legacy loop, and the e2e parity tests compare point counts with the running prototype.

/** The legacy engine always rasterises the portrait into a 600×600 offscreen canvas. */
export const SAMPLE_SIZE = 600;
/** Pixels whose Rec. 709 luminance (0-255) is below this are discarded. */
export const DEFAULT_THRESHOLD = 33;
/** Floats per point: x, y, r, g, b. */
export const POINT_STRIDE = 5;

export type SampleStep = 2 | 3 | 4;

/**
 * Converts RGBA pixels (row-major, size×size) into interleaved [x, y, r, g, b] points.
 * Coordinates are centred and normalised by `size`, with y pointing up, exactly as in the legacy
 * engine: x = (px - 300) / 600, y = (300 - py) / 600 for size 600.
 */
export function samplePortrait(
  pixels: ArrayLike<number>,
  size: number,
  step: number,
  threshold: number = DEFAULT_THRESHOLD,
): Float32Array {
  const half = size / 2;
  const out: number[] = [];
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const i = (y * size + x) * 4;
      const r = pixels[i] as number;
      const g = pixels[i + 1] as number;
      const b = pixels[i + 2] as number;
      if (r * 0.2126 + g * 0.7152 + b * 0.0722 < threshold) continue;
      out.push((x - half) / size, (half - y) / size, r / 255, g / 255, b / 255);
    }
  }
  return new Float32Array(out);
}

/**
 * Rasterises an image into a SAMPLE_SIZE square and returns its RGBA pixels. Throws a
 * SecurityError when the image taints the canvas (for example a file:// page loading a sibling
 * PNG), which the renderer reports as the 'tainted-image' fallback.
 */
export function rasterise(image: CanvasImageSource, size: number = SAMPLE_SIZE): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  ctx.drawImage(image, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size).data;
}
