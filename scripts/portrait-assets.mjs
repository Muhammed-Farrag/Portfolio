// Regenerates the Hero's portrait assets from the untouched legacy PNG. Run with the dev server
// up (`npm run dev`): `node scripts/portrait-assets.mjs`.
//
//   src/assets/portrait/source-600.webp   The 600×600 rasterisation the engine samples, stored
//                                         losslessly. Pixels darker than DEFAULT_THRESHOLD, which
//                                         the sampler always discards, are set to black so the
//                                         file compresses better. The script fails unless every
//                                         density samples exactly the same points as the PNG.
//   src/assets/portrait/fallback.webp     A paused frame of the engine in the Moonlight tone on
//                                         Oxford Blue, shown when WebGL is unavailable.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.DEV_URL ?? 'http://127.0.0.1:4311';
const OUT = new URL('../src/assets/portrait/', import.meta.url);
const FALLBACK_SIZE = 1000;

const browser = await chromium.launch({ channel: 'chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto(`${BASE}/dev/`);
const result = await page.evaluate(async (size) => {
  const load = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
  const { rasterise, samplePortrait, DEFAULT_THRESHOLD } = await import('/src/features/particle-portrait/sampling.ts');
  const { createParticleRenderer, PORTFOLIO_BACKGROUND } = await import('/src/features/particle-portrait/index.ts');
  const png = await load('/legacy/particle-portrait/portrait.png');
  const original = rasterise(png);
  const trimmed = new Uint8ClampedArray(original);
  for (let i = 0; i < trimmed.length; i += 4) {
    if (trimmed[i] * 0.2126 + trimmed[i + 1] * 0.7152 + trimmed[i + 2] * 0.0722 < DEFAULT_THRESHOLD) trimmed[i] = trimmed[i + 1] = trimmed[i + 2] = 0;
  }

  const square = document.createElement('canvas');
  square.width = square.height = 600;
  square.getContext('2d').putImageData(new ImageData(trimmed, 600, 600), 0, 0);
  const source = square.toDataURL('image/webp', 1);
  const decoded = rasterise(await load(source));
  let differing = 0;
  for (let i = 0; i < trimmed.length; i++) if (trimmed[i] !== decoded[i]) differing++;
  for (const step of [2, 3, 4]) {
    const a = samplePortrait(original, 600, step);
    const b = samplePortrait(decoded, 600, step);
    if (a.length !== b.length || a.some((v, i) => v !== b[i])) differing += 1e6;
  }

  const stage = document.createElement('div');
  stage.style.cssText = `position:fixed;left:0;top:0;width:${size}px;height:${size}px`;
  const canvas = document.createElement('canvas');
  stage.append(canvas);
  document.body.append(stage);
  Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
  const renderer = createParticleRenderer(canvas, png, { sizeTarget: stage, paused: true, settings: { tone: 'moonlight', background: PORTFOLIO_BACKGROUND } });
  if ('fallback' in renderer) throw new Error(renderer.fallback);
  renderer.redraw();
  const fallback = canvas.toDataURL('image/webp', 0.86);
  return { source, fallback, differing, points: renderer.pointCount };
}, FALLBACK_SIZE);
await browser.close();

if (result.differing !== 0) throw new Error(`source-600.webp does not reproduce the sampled points (${result.differing})`);
mkdirSync(OUT, { recursive: true });
for (const [name, url] of [['source-600.webp', result.source], ['fallback.webp', result.fallback]]) {
  const bytes = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(name, OUT), bytes);
  console.log(`${name}: ${(bytes.length / 1024).toFixed(1)} KB`);
}
console.log(`lossless: yes; fallback points: ${result.points}`);
