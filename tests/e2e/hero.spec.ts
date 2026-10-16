// Phase 2, Hero milestone: the Particle Portrait in the public site.
import { PNG } from 'pngjs';
import { expect, test, type Page } from '@playwright/test';
import { disableWebGL, expectNoHorizontalOverflow, pendingFrames, trackAnimationFrames, watch } from './helpers';

const isMobile = (name: string) => name.includes('mobile');
const stage = (page: Page) => page.locator('.hero__stage');

/** Records every value the stage's data-state takes, from the first render. */
async function recordHeroStates(page: Page) {
  await page.addInitScript(() => {
    const states: string[] = [];
    Object.assign(window, { __heroStates: states });
    new MutationObserver((records) => {
      for (const r of records) {
        const value = (r.target as HTMLElement).dataset.state;
        if (value && states[states.length - 1] !== value) states.push(value);
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
  });
}
const heroStates = (page: Page) => page.evaluate(() => (window as unknown as { __heroStates: string[] }).__heroStates);

async function waitForPortrait(page: Page) {
  await expect(page.locator('.hero__portrait')).toHaveAttribute('data-mode', 'live', { timeout: 15_000 });
}

/** Share of pixels in a screenshot region whose colour changed by more than `tolerance`. */
function changed(a: Buffer, b: Buffer, tolerance = 40) {
  const [x, y] = [PNG.sync.read(a), PNG.sync.read(b)];
  let n = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    if (Math.abs(x.data[i]! - y.data[i]!) + Math.abs(x.data[i + 1]! - y.data[i + 1]!) + Math.abs(x.data[i + 2]! - y.data[i + 2]!) > tolerance) n++;
  }
  return n / (x.data.length / 4);
}

test.describe('hero portrait', () => {
  test('replaces the placeholder with the live particle portrait, with no errors', async ({ page }, info) => {
    const w = watch(page);
    await recordHeroStates(page);
    await page.goto('/');
    await waitForPortrait(page);
    await expect(page.locator('.hero [data-pending]')).toHaveCount(0);
    await expect(page.locator('.hero').getByText('In progress')).toHaveCount(0);
    await expect(stage(page)).toHaveAttribute('role', 'img');
    await expect(stage(page)).toHaveAttribute('aria-label', /Muhammed Farrag/);
    // Same sampling as the prototype: Ultra on capable desktops, Fine on small screens.
    const points = await stage(page).getAttribute('data-points');
    if (isMobile(info.project.name)) expect(points).toBe('4525');
    else expect(['10203', '4525']).toContain(points);

    // The entrance reforms the portrait, then hands over to the responsive loop. Each frame
    // advances the animation by at most 40 ms (legacy), so on a starved software-GL runner the
    // 1.3 s entrance can take far longer in wall-clock time.
    await expect.poll(() => heroStates(page), { timeout: 10_000 }).toContain('reforming');
    await expect(stage(page)).toHaveAttribute('data-state', 'responding', { timeout: 45_000 });
    const states = await heroStates(page);
    expect(states.indexOf('reforming')).toBeLessThan(states.lastIndexOf('responding'));

    // Moonlight particles on Storm: bright pixels exist, none are amber or red, and the
    // stage has no frame or border of its own.
    const png = PNG.sync.read(await stage(page).screenshot());
    let bright = 0;
    let warm = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      const [r, g, b] = [png.data[i]!, png.data[i + 1]!, png.data[i + 2]!];
      if (r + g + b > 500) bright++;
      if (r > 90 && r > b + 50 && g < r * 0.8) warm++;
    }
    expect(bright).toBeGreaterThan(500);
    expect(warm).toBe(0);
    for (const el of ['.hero__portrait', '.hero__stage']) {
      expect(await page.locator(el).evaluate((e) => getComputedStyle(e).borderStyle)).toBe('none');
    }
    await expectNoHorizontalOverflow(page);
    expect(w.errors).toEqual([]);
    expect(w.failedRequests).toEqual([]);
  });

  test('keeps the portrait square and the layout stable while it loads', async ({ page }) => {
    await page.addInitScript(() => {
      Object.assign(window, { __cls: 0 });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/');
    await waitForPortrait(page);
    await page.waitForTimeout(1500);
    const box = await stage(page).boundingBox();
    expect(Math.abs(box!.width - box!.height)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThanOrEqual(0.05);
  });

  test('shows part of the portrait and the name in the first viewport', async ({ page }) => {
    await page.goto('/');
    await waitForPortrait(page);
    const viewport = page.viewportSize()!;
    const box = (await stage(page).boundingBox())!;
    expect(box.y).toBeLessThan(viewport.height * 0.5);
    expect(box.y + box.height * 0.4).toBeLessThan(viewport.height); // the head and shoulders
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  });

  test('particles move away from the pointer', async ({ page }) => {
    await page.goto('/');
    await waitForPortrait(page);
    await expect(stage(page)).toHaveAttribute('data-state', 'responding', { timeout: 45_000 });
    const box = (await stage(page).boundingBox())!;
    const face = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.3 };
    const near = { x: face.x - 60, y: face.y - 60, width: 120, height: 120 };
    const far = { x: box.x + box.width * 0.5 - 60, y: box.y + box.height * 0.62, width: 120, height: 120 };
    await page.mouse.move(5, 5);
    await page.waitForTimeout(400);
    const [nearBefore, farBefore] = [await page.screenshot({ clip: near }), await page.screenshot({ clip: far })];
    // A hovering pen: a resting mouse would develop the photograph instead (tested below).
    await stage(page).evaluate((e, p) => {
      for (let k = 1; k <= 4; k++) {
        e.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'pen', clientX: p.x - 40 + k * 10, clientY: p.y }));
      }
    }, face);
    await page.waitForTimeout(600);
    await expect(stage(page)).toHaveAttribute('data-photo', 'off');
    const [nearAfter, farAfter] = [await page.screenshot({ clip: near }), await page.screenshot({ clip: far })];
    const local = changed(nearBefore, nearAfter);
    const elsewhere = changed(farBefore, farAfter);
    test.info().annotations.push({ type: 'pointer', description: `changed near ${(local * 100).toFixed(1)}%, far ${(elsewhere * 100).toFixed(1)}%` });
    expect(local).toBeGreaterThan(0.08);
    expect(local).toBeGreaterThan(elsewhere * 2);
  });

  test('respects reduced motion: a still portrait with no intro, loop or scroll effect', async ({ browser }, info) => {
    const context = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const w = watch(page);
    await trackAnimationFrames(page);
    await recordHeroStates(page);
    await page.goto(info.project.use.baseURL!);
    await waitForPortrait(page);
    await expect(stage(page)).toHaveAttribute('data-state', 'paused');
    expect(await page.locator('.story__canvas').evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s');
    await page.waitForTimeout(500);
    expect(await pendingFrames(page)).toBe(0);
    expect(await heroStates(page)).not.toContain('reforming');
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    await expect(stage(page)).toHaveAttribute('data-progress', '0.000');
    expect(w.errors).toEqual([]);
    await context.close();
  });

  test('falls back to a still Moonlight frame without WebGL', async ({ page }) => {
    const w = watch(page);
    const requested: string[] = [];
    page.on('request', (r) => r.resourceType() === 'image' && requested.push(r.url()));
    await disableWebGL(page);
    await page.goto('/');
    await expect(page.locator('.hero__portrait')).toHaveAttribute('data-mode', 'static', { timeout: 15_000 });
    const img = page.locator('.hero__fallback');
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth)).toBe(1000);
    await expect(page.locator('.story__layer')).toBeHidden();
    await expect(page.locator('.hero__motion'), 'nothing to pause on a still frame').toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(requested.filter((u) => u.includes('source-600')), 'the particle source is not downloaded').toEqual([]);
    expect(w.errors).toEqual([]);
    expect(w.failedRequests).toEqual([]);
  });
});

test.describe('photograph reveal', () => {
  const photo = (page: Page) => page.locator('.hero__photo');
  const photoOpacity = (page: Page) => photo(page).evaluate((e) => Number(getComputedStyle(e).opacity));

  test('a resting mouse develops the photograph, and leaving restores the particles', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'mouse hover');
    const w = watch(page);
    await page.goto('/');
    await waitForPortrait(page);
    expect(await photoOpacity(page)).toBe(0);
    const box = (await stage(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3, { steps: 3 });
    await expect(stage(page)).toHaveAttribute('data-photo', 'on');
    await expect(stage(page)).toHaveAttribute('aria-label', 'Photograph of Muhammed Farrag');
    await expect.poll(() => photoOpacity(page), { timeout: 10_000 }).toBe(1);
    // The particles fade while the photograph is shown.
    await expect.poll(() => page.locator('.story__layer').evaluate((e) => Number(getComputedStyle(e).opacity))).toBe(0);
    await page.mouse.move(2, box.y + box.height / 2);
    await expect(stage(page)).toHaveAttribute('data-photo', 'off');
    await expect.poll(() => photoOpacity(page), { timeout: 10_000 }).toBe(0);
    await expect.poll(() => page.locator('.story__layer').evaluate((e) => Number(getComputedStyle(e).opacity))).toBe(1);
    expect(w.errors).toEqual([]);
  });

  test('keyboard focus on the portrait shows it, and leaving restores the particles (no toggle button)', async ({ page }) => {
    await page.goto('/');
    await waitForPortrait(page);
    await expect(page.getByRole('button', { name: /photograph/i })).toHaveCount(0);
    for (let i = 0; i < 20 && !(await stage(page).evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(stage(page)).toBeFocused();
    await expect(stage(page)).toHaveAttribute('data-photo', 'on');
    await expect.poll(() => photoOpacity(page), { timeout: 10_000 }).toBe(1);
    await page.keyboard.press('Tab');
    await expect(stage(page)).toHaveAttribute('data-photo', 'off');
    await expect.poll(() => photoOpacity(page), { timeout: 10_000 }).toBe(0);
    // The photograph is a prepared, background-free cut-out, not a crop of the page.
    const natural = await photo(page).evaluate((e: HTMLImageElement) => [e.naturalWidth, e.naturalHeight]);
    expect(natural).toEqual([738, 738]);
  });

  test('a tap toggles it on touch screens', async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), 'touch');
    await page.goto('/');
    await waitForPortrait(page);
    const box = (await stage(page).boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.3);
    await expect(stage(page)).toHaveAttribute('data-photo', 'on');
    await expect.poll(() => photoOpacity(page), { timeout: 10_000 }).toBe(1);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.3);
    await expect(stage(page)).toHaveAttribute('data-photo', 'off');
  });

  test('works on the still frame without WebGL', async ({ page }) => {
    await disableWebGL(page);
    await page.goto('/');
    await expect(page.locator('.hero__portrait')).toHaveAttribute('data-mode', 'static', { timeout: 15_000 });
    await stage(page).focus();
    await expect.poll(() => photoOpacity(page), { timeout: 10_000 }).toBe(1);
    await expect.poll(() => page.locator('.hero__fallback').evaluate((e) => Number(getComputedStyle(e).opacity))).toBe(0);
  });
});

test.describe('hero animation loops', () => {
  test('there are no control buttons, and the portrait and star loops stop once the hero is scrolled away', async ({ page }) => {
    await trackAnimationFrames(page);
    await page.goto('/');
    await waitForPortrait(page);
    await expect(page.locator('.hero__portrait').getByRole('button')).toHaveCount(0);
    await expect.poll(() => pendingFrames(page), { timeout: 20_000 }).toBe(2);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect.poll(() => pendingFrames(page), { timeout: 20_000 }).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => pendingFrames(page), { timeout: 20_000 }).toBe(2);
  });
});
