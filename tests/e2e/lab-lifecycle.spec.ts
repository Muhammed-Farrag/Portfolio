// Lifecycle guarantees of the maintained engine. Lab and lifecycle harness only.
import { expect, test } from '@playwright/test';
import { BASELINE_COUNTS, maxPendingFrames, pendingFrames, resetMaxFrames, trackAnimationFrames, waitForParticles } from './helpers';
import { LIFECYCLE_URL } from './urls';

test.describe('render loop', () => {
  test.beforeEach(async ({ page }) => {
    await trackAnimationFrames(page);
    await page.goto('./');
    await waitForParticles(page);
    await expect(page.locator('#state')).toHaveText('RESPONDING');
  });

  test('runs exactly one animation loop, even after repeated interactions', async ({ page }) => {
    await resetMaxFrames(page);
    for (let i = 0; i < 5; i++) {
      await page.click('#scatter');
      await page.click('#photo');
      await page.click('#particles');
      await page.click('#pause');
      await page.click('#pause');
      await page.selectOption('#density', i % 2 ? '3' : '2');
    }
    await page.waitForTimeout(500);
    expect(await maxPendingFrames(page)).toBeLessThanOrEqual(1);
  });

  test('stops rendering while the portrait is off-screen and resumes when it returns', async ({ page }) => {
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.id = 'spacer';
      spacer.style.height = '4000px';
      document.body.prepend(spacer);
    });
    await expect.poll(() => pendingFrames(page)).toBe(0);
    await page.waitForTimeout(300);
    expect(await pendingFrames(page)).toBe(0);
    await page.evaluate(() => document.getElementById('spacer')!.remove());
    await expect.poll(() => pendingFrames(page)).toBe(1);
  });

  test('stops rendering while the tab is hidden', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => pendingFrames(page)).toBe(0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => pendingFrames(page)).toBe(1);
  });

  test('recovers from a lost WebGL context', async ({ page }) => {
    await page.evaluate(() => {
      const ext = (document.getElementById('canvas') as HTMLCanvasElement).getContext('webgl')!.getExtension('WEBGL_lose_context')!;
      Object.assign(window, { __loseContext: ext });
      ext.loseContext();
    });
    await expect(page.locator('#state')).toHaveText('CONTEXT LOST');
    await expect(page.locator('.stage')).toHaveClass(/photo/);
    await expect(page.locator('#scatter')).toBeDisabled();
    await page.evaluate(() => (window as unknown as { __loseContext: WEBGL_lose_context }).__loseContext.restoreContext());
    await expect(page.locator('#state')).toHaveText('RESPONDING');
    await expect(page.locator('#renderer')).toHaveText('WEBGL');
    await expect(page.locator('.stage')).not.toHaveClass(/photo/);
    await expect(page.locator('#count')).toHaveText(BASELINE_COUNTS['2']);
    await expect(page.locator('#scatter')).toBeEnabled();
  });
});

test.describe('dialog', () => {
  test('has an accessible name', async ({ page }) => {
    await page.goto('./');
    await page.click('#about');
    await expect(page.getByRole('dialog', { name: 'From your photo, into light.' })).toBeVisible();
  });
});

test.describe('create and dispose', () => {
  test('repeated mount/unmount on one canvas leaks no listeners, loops or GL errors', async ({ page }) => {
    await trackAnimationFrames(page);
    // Count live listeners on window, document and the canvas container, including those
    // removed through an AbortSignal.
    await page.addInitScript(() => {
      const live = new Map<EventTarget, number>();
      const add = EventTarget.prototype.addEventListener;
      const remove = EventTarget.prototype.removeEventListener;
      const bump = (t: EventTarget, n: number) => live.set(t, (live.get(t) ?? 0) + n);
      EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (listener) {
          bump(this, 1);
          const signal = typeof options === 'object' ? options?.signal : undefined;
          signal?.addEventListener('abort', () => bump(this, -1), { once: true } as AddEventListenerOptions);
        }
        return add.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function (type, listener, options) {
        if (listener) bump(this, -1);
        return remove.call(this, type, listener, options);
      };
      Object.assign(window, {
        __listeners: () => ({
          window: live.get(window) ?? 0,
          document: live.get(document) ?? 0,
          stage: live.get(document.getElementById('stage')!) ?? 0,
          canvas: live.get(document.getElementById('canvas')!) ?? 0,
        }),
      });
    });
    await page.goto(LIFECYCLE_URL);
    await expect(page.locator('#status')).toHaveText('ready');
    type L = { window: number; document: number; stage: number; canvas: number };
    const listeners = () => page.evaluate(() => (window as unknown as { __listeners: () => L }).__listeners());
    const once = await listeners();

    await page.evaluate(() => (window as unknown as { __lifecycle: { unmount(): void } }).__lifecycle.unmount());
    const none = await listeners();
    expect(await pendingFrames(page)).toBe(0);

    for (let i = 0; i < 20; i++) await page.evaluate(() => (window as unknown as { __lifecycle: { mount(): number } }).__lifecycle.mount());
    expect(await listeners()).toEqual(once);
    await resetMaxFrames(page);
    await page.waitForTimeout(400);
    expect(await maxPendingFrames(page)).toBeLessThanOrEqual(1);
    const state = await page.evaluate(() => {
      const h = (window as unknown as { __lifecycle: { running: boolean; pointCount: number; glError: number } }).__lifecycle;
      return { running: h.running, points: h.pointCount, glError: h.glError };
    });
    expect(state).toEqual({ running: true, points: 10203, glError: 0 });

    await page.evaluate(() => (window as unknown as { __lifecycle: { unmount(): void } }).__lifecycle.unmount());
    expect(await listeners()).toEqual(none);
    await page.waitForTimeout(100);
    expect(await pendingFrames(page)).toBe(0);
  });
});
