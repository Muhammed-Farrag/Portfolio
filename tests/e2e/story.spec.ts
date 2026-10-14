// Phase C: the shared particle layer and the Hero-to-Approach transition.
import { PNG } from 'pngjs';
import { expect, test, type Page } from '@playwright/test';
import { disableWebGL, maxPendingFrames, pendingFrames, resetMaxFrames, trackAnimationFrames, watch } from './helpers';

const stage = (page: Page) => page.locator('.hero__stage');
const figure = (page: Page) => page.locator('#approach-figure');
const progress = async (page: Page) => Number(await stage(page).getAttribute('data-progress'));

async function ready(page: Page) {
  await expect(page.locator('.story')).toHaveAttribute('data-mode', 'live', { timeout: 15_000 });
}

/** Scroll position at which the Approach figure is centred, i.e. the end of the transition. */
const transitionEnd = (page: Page) =>
  page.evaluate(() => {
    const f = document.getElementById('approach-figure')!.getBoundingClientRect();
    return window.scrollY + f.top + f.height / 2 - window.innerHeight / 2;
  });

async function scrollToFraction(page: Page, fraction: number) {
  const end = await transitionEnd(page);
  await page.evaluate((y) => window.scrollTo(0, y), end * fraction);
  await expect.poll(() => progress(page), { timeout: 20_000 }).toBeCloseTo(fraction, 1);
}

/** Bright (Moonlight) pixels in an element's on-screen box. */
async function brightPixels(page: Page, selector: string) {
  const png = PNG.sync.read(await page.locator(selector).screenshot());
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) if (png.data[i]! + png.data[i + 1]! + png.data[i + 2]! > 540) n++;
  return n;
}

test.describe('hero to approach transition', () => {
  test('scroll carries the portrait into the four-layer diagram, and back again', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await ready(page);
    await expect(stage(page)).toHaveAttribute('data-progress', '0.000');
    // Measure the settled portrait: during the entrance scattered points cover more pixels.
    await expect(stage(page)).toHaveAttribute('data-state', 'responding', { timeout: 60_000 });
    await page.mouse.move(1, 1);
    const portrait = await brightPixels(page, '.hero__stage');
    expect(portrait, 'the portrait is drawn on its slot').toBeGreaterThan(500);

    // Forward: the transition ends with the diagram formed in the figure and its labels shown.
    await scrollToFraction(page, 1);
    await expect(figure(page)).toHaveAttribute('data-live', 'true');
    await expect.poll(() => figure(page).evaluate((e) => getComputedStyle(e.querySelector('li')!).opacity)).toBe('1');
    expect(await figure(page).locator('.approach-figure__still').evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
    await page.waitForTimeout(400);
    expect(await brightPixels(page, '#approach-figure'), 'the particles form the diagram').toBeGreaterThan(300);

    // Reverse: scrolling back up returns every particle to the portrait.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => progress(page), { timeout: 20_000 }).toBe(0);
    await page.waitForTimeout(400);
    expect(await brightPixels(page, '.hero__stage')).toBeGreaterThan(portrait * 0.8);
    expect(await figure(page).evaluate((e) => getComputedStyle(e.querySelector('li')!).opacity)).toBe('0');
    expect(w.errors).toEqual([]);
  });

  test('progress follows the scroll position exactly, in both directions', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    for (const f of [0.25, 0.5, 0.75, 1, 0.6, 0.3, 0]) await scrollToFraction(page, f);
    // Mid-transition the cloud dims so text it passes behind stays readable.
    await scrollToFraction(page, 0.5);
    expect(Number(await page.locator('.story__layer').evaluate((e) => getComputedStyle(e).opacity))).toBeLessThan(0.7);
  });

  test('survives rapid scrolling and section jumps', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await ready(page);
    const end = await transitionEnd(page);
    for (let k = 0; k < 30; k++) await page.mouse.wheel(0, k % 3 === 2 ? -end / 4 : end / 5);
    // Section jumps the way a visitor makes them: in-page links.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('link', { name: 'Explore the work' }).click();
    await expect(page).toHaveURL(/#work$/);
    await expect.poll(() => progress(page), { timeout: 20_000 }).toBe(1);
    await page.getByRole('banner').getByRole('link', { name: 'Muhammed Farrag' }).click();
    await expect(page).toHaveURL(/#top$/);
    // #top lands within a pixel of the page top (sticky header rounding).
    await expect.poll(() => progress(page), { timeout: 20_000 }).toBeLessThan(0.005);
    await page.evaluate((y) => window.scrollTo(0, y), end);
    await expect.poll(() => progress(page), { timeout: 20_000 }).toBe(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => progress(page), { timeout: 20_000 }).toBe(0);
    expect(w.errors).toEqual([]);
  });

  test('one render loop, stopped once the story has scrolled away and restarted on return', async ({ page }) => {
    await trackAnimationFrames(page);
    await page.goto('/');
    await ready(page);
    await expect(stage(page)).toHaveAttribute('data-state', 'responding', { timeout: 45_000 });
    await resetMaxFrames(page);
    await scrollToFraction(page, 0.5);
    await scrollToFraction(page, 1);
    // The render loop plus at most one pending scroll update: a leaked second loop would show here.
    expect(await maxPendingFrames(page)).toBeLessThanOrEqual(2);
    await page.locator('#journey').scrollIntoViewIfNeeded();
    await expect.poll(() => pendingFrames(page), { timeout: 20_000 }).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => pendingFrames(page), { timeout: 20_000 }).toBe(1);
    expect(await page.evaluate(() => document.querySelectorAll('canvas').length), 'a single WebGL canvas').toBe(1);
  });

  test('Pause motion keeps the portrait in place and shows the still diagram', async ({ page }) => {
    await trackAnimationFrames(page);
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: 'Pause motion' }).click();
    await expect(stage(page)).toHaveAttribute('data-state', 'paused');
    const end = await transitionEnd(page);
    await page.evaluate((y) => window.scrollTo(0, y), end);
    await page.waitForTimeout(500);
    await expect(stage(page)).toHaveAttribute('data-progress', '0.000');
    await expect(figure(page)).toHaveAttribute('data-live', 'false');
    expect(await figure(page).locator('.approach-figure__still').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    expect(await figure(page).evaluate((e) => getComputedStyle(e.querySelector('li')!).opacity)).toBe('1');
    expect(await pendingFrames(page)).toBe(0);
  });

  test('reduced motion shows the still diagram with no transition', async ({ browser }, info) => {
    const context = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(info.project.use.baseURL!);
    await ready(page);
    await page.evaluate(() => document.getElementById('approach-figure')!.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    await expect(stage(page)).toHaveAttribute('data-progress', '0.000');
    await expect(figure(page)).toHaveAttribute('data-live', 'false');
    await expect(figure(page).locator('.approach-figure__still')).toBeVisible();
    await context.close();
  });

  test('without WebGL the diagram is the still drawing and the layer is gone', async ({ page }) => {
    const w = watch(page);
    await disableWebGL(page);
    await page.goto('/');
    await expect(page.locator('.story')).toHaveAttribute('data-mode', 'static', { timeout: 15_000 });
    await expect(page.locator('.story__layer')).toBeHidden();
    await figure(page).scrollIntoViewIfNeeded();
    await expect(figure(page).locator('.approach-figure__still')).toBeVisible();
    expect(await figure(page).evaluate((e) => getComputedStyle(e.querySelector('li')!).opacity)).toBe('1');
    expect(w.errors).toEqual([]);
  });

  test('the diagram is real, readable content in the Approach section', async ({ page }) => {
    await page.goto('/');
    const list = page.locator('#approach').getByRole('list');
    await expect(list.getByRole('listitem')).toHaveText([/Intelligence/, /Orchestration/, /Product/, /Operations/]);
    const box = await figure(page).boundingBox();
    expect(Math.abs(box!.width - box!.height), 'the figure reserves its square').toBeLessThanOrEqual(1);
    // Every label fits inside the viewport at this width.
    const overflow = await figure(page).evaluate((e) =>
      [...e.querySelectorAll('li')].filter((li) => li.getBoundingClientRect().right > document.documentElement.clientWidth).length,
    );
    expect(overflow).toBe(0);
  });
});
