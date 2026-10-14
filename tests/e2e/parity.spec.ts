// Visual and numeric parity between the untouched legacy prototype and the maintained engine.
// Both pages are rendered paused (reduced motion: uTime = 0, no pointer), which makes frames
// deterministic, then compared pixel by pixel.
import { expect, test, type Browser, type Page } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { waitForParticles } from './helpers';
import { LAB_URL, LEGACY_URL } from './urls';

test.use({ reducedMotion: 'reduce' });

async function open(browser: Browser, url: string, contextOptions: Parameters<Browser['newContext']>[0]): Promise<Page> {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.goto(url);
  await waitForParticles(page);
  await expect(page.locator('#state')).toHaveText('PAUSED');
  return page;
}

function diffRatio(a: Buffer, b: Buffer): number {
  const imgA = PNG.sync.read(a);
  const imgB = PNG.sync.read(b);
  expect([imgB.width, imgB.height]).toEqual([imgA.width, imgA.height]);
  const diff = pixelmatch(imgA.data, imgB.data, null, imgA.width, imgA.height, { threshold: 0.05 });
  return diff / (imgA.width * imgA.height);
}

test('paused frames and point counts match the original prototype for every tone and detail level', async ({ browser }, info) => {
  const { viewport, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const options = { viewport, deviceScaleFactor, isMobile, hasTouch, reducedMotion: 'reduce' as const };
  const legacy = await open(browser, LEGACY_URL, options);
  const lab = await open(browser, LAB_URL, options);

  for (const step of ['2', '3', '4']) {
    await legacy.selectOption('#density', step);
    await lab.selectOption('#density', step);
    await expect(lab.locator('#count')).toHaveText((await legacy.locator('#count').textContent()) ?? '');
  }
  await legacy.selectOption('#density', '2');
  await lab.selectOption('#density', '2');

  for (const tone of ['0', '1', '2']) {
    await legacy.selectOption('#tone', tone);
    await lab.selectOption('#tone', tone);
    const [a, b] = await Promise.all([legacy.locator('#canvas').screenshot(), lab.locator('#canvas').screenshot()]);
    const ratio = diffRatio(a, b);
    await info.attach(`tone-${tone}-legacy.png`, { body: a, contentType: 'image/png' });
    await info.attach(`tone-${tone}-lab.png`, { body: b, contentType: 'image/png' });
    info.annotations.push({ type: 'pixel-diff', description: `tone ${tone}: ${(ratio * 100).toFixed(4)}% of pixels differ` });
    expect(ratio, `tone ${tone} differs in ${(ratio * 100).toFixed(3)}% of pixels`).toBeLessThanOrEqual(0.001);
  }
  await legacy.context().close();
  await lab.context().close();
});

test('the Moonlight tone renders the same points in the Revision 3 palette', async ({ page }) => {
  await page.goto(LAB_URL);
  await waitForParticles(page);
  await page.selectOption('#tone', '3');
  await expect(page.locator('.stage-label')).toHaveText('FIG. 001 / MOONLIGHT (REVISION 3)');
  await expect(page.locator('#count')).toHaveText('10,203');
  // The palette must have reached the GPU: no amber pixels, and no red ones (the tie is now
  // a cool Frost Blue highlight), may remain in the frame.
  const png = PNG.sync.read(await page.locator('#canvas').screenshot());
  let amber = 0;
  let red = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = [png.data[i]!, png.data[i + 1]!, png.data[i + 2]!];
    if (r > 150 && g > 80 && g < r * 0.75 && b < g * 0.6) amber++;
    if (r > 90 && r > g + 50 && r > b + 50) red++;
  }
  expect(amber).toBe(0);
  expect(red).toBe(0);
});
