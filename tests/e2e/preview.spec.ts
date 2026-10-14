// The generated single-file Portrait Lab must work when opened straight from disk, which the
// original source build could not do (tainted-canvas error on file://).
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { BASELINE_COUNTS, waitForParticles, watch } from './helpers';

const file = resolve('dist-preview/particle-portrait-preview.html');

test('portable preview renders WebGL from file:// with no external requests', async ({ page }) => {
  expect(existsSync(file), 'run `npm run build:preview` first').toBe(true);
  const w = watch(page);
  const external: string[] = [];
  page.on('request', (r) => !/^(file|data|blob):/.test(r.url()) && external.push(r.url()));
  await page.goto(pathToFileURL(file).href);
  await waitForParticles(page);
  await expect(page.locator('#count')).toHaveText(BASELINE_COUNTS['2']);
  expect(w.errors).toEqual([]);
  expect(external).toEqual([]);
  expect(statSync(file).size).toBeLessThan(3_500_000);
});
