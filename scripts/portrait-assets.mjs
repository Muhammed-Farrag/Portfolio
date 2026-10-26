// Regenerates the Hero's no-WebGL still from the particle source. Run with the dev server up
// (`npm run dev`): `node scripts/portrait-assets.mjs`.
//
//   src/assets/portrait/source-600.webp   Input, written by scripts/portrait-photo.py particles:
//                                         the 600×600 image the engine samples, stored losslessly.
//   src/assets/portrait/fallback.webp     A paused frame of the engine in the Moonlight tone on
//                                         a transparent ground (it sits on any palette), shown when
//                                         WebGL is unavailable.
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
  const { createParticleRenderer } = await import('/src/features/particle-portrait/index.ts');
  const source = await load('/src/assets/portrait/source-600.webp');
  if (source.naturalWidth !== 600 || source.naturalHeight !== 600) throw new Error(`source-600.webp is ${source.naturalWidth}×${source.naturalHeight}`);

  const stage = document.createElement('div');
  stage.style.cssText = `position:fixed;left:0;top:0;width:${size}px;height:${size}px`;
  const canvas = document.createElement('canvas');
  stage.append(canvas);
  document.body.append(stage);
  Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
  const renderer = createParticleRenderer(canvas, source, { sizeTarget: stage, paused: true, transparent: true, settings: { tone: 'moonlight' } });
  if ('fallback' in renderer) throw new Error(renderer.fallback);
  renderer.redraw();
  const fallback = canvas.toDataURL('image/webp', 0.86);
  return { fallback, points: renderer.pointCount };
}, FALLBACK_SIZE);
await browser.close();

mkdirSync(OUT, { recursive: true });
for (const [name, url] of [['fallback.webp', result.fallback]]) {
  const bytes = Buffer.from(url.split(',')[1], 'base64');
  writeFileSync(new URL(name, OUT), bytes);
  console.log(`${name}: ${(bytes.length / 1024).toFixed(1)} KB`);
}
console.log(`fallback points: ${result.points}`);
