import { expect, type Page, type TestInfo } from '@playwright/test';

/** Point counts measured on the original prototype in Chromium (SwiftShader), 14 Oct 2026. */
export const BASELINE_COUNTS = { '2': '10,203', '3': '4,525', '4': '2,549' } as const;

export const isLegacy = (info: TestInfo) => info.project.name.startsWith('legacy');

export interface PageWatch {
  errors: string[];
  failedRequests: string[];
}

/** Collects console errors, page errors and failed or 4xx/5xx requests for a page. */
export function watch(page: Page): PageWatch {
  const w: PageWatch = { errors: [], failedRequests: [] };
  page.on('console', (m) => m.type() === 'error' && w.errors.push(m.text()));
  page.on('pageerror', (e) => w.errors.push(String(e)));
  page.on('requestfailed', (r) => w.failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && w.failedRequests.push(`${r.url()} ${r.status()}`));
  return w;
}

export async function waitForParticles(page: Page) {
  await expect(page.locator('#count')).not.toHaveText('LOADING', { timeout: 15_000 });
  await expect(page.locator('#renderer')).toHaveText('WEBGL');
}

/** Makes every WebGL context request fail, as on a device without WebGL. */
export async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
}

/**
 * Tracks requestAnimationFrame callbacks that are scheduled but have not yet run or been
 * cancelled. A single render loop keeps this at 0 or 1; duplicated loops push it higher.
 */
export async function trackAnimationFrames(page: Page) {
  await page.addInitScript(() => {
    const pending = new Set<number>();
    let max = 0;
    const raf = window.requestAnimationFrame.bind(window);
    const caf = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      const id = raf((t) => {
        pending.delete(id);
        cb(t);
      });
      pending.add(id);
      max = Math.max(max, pending.size);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      caf(id);
    };
    Object.assign(window, {
      __frames: {
        get pending() {
          return pending.size;
        },
        get max() {
          return max;
        },
        resetMax() {
          max = pending.size;
        },
      },
    });
  });
}

export const pendingFrames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: { pending: number } }).__frames.pending);
export const maxPendingFrames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: { max: number } }).__frames.max);
export const resetMaxFrames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: { resetMax(): void } }).__frames.resetMax());

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/**
 * Records every distinct value the #state readout takes, inside the page. Transient states
 * (SCATTERING lasts about 1.3 s) can be over before a slow click() call even returns, so tests
 * assert on the recorded sequence instead of polling for a state that may already have passed.
 */
export async function recordStates(page: Page) {
  await page.addInitScript(() => {
    const states: string[] = [];
    Object.assign(window, { __states: states });
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.getElementById('state');
      if (!el) return;
      const push = () => {
        const text = el.textContent ?? '';
        if (states[states.length - 1] !== text) states.push(text);
      };
      push();
      new MutationObserver(push).observe(el, { childList: true, characterData: true, subtree: true });
    });
  });
}

export const stateMark = (page: Page) => page.evaluate(() => (window as unknown as { __states: string[] }).__states.length);

/** Waits until the states recorded since `mark` contain `sequence` in order. */
export async function expectStateSequence(page: Page, mark: number, sequence: string[], timeout = 10_000) {
  await expect
    .poll(
      async () => {
        const seen = await page.evaluate((m) => (window as unknown as { __states: string[] }).__states.slice(m), mark);
        let i = 0;
        for (const s of seen) if (s === sequence[i]) i++;
        return i === sequence.length ? 'complete' : seen.join(' > ');
      },
      { timeout },
    )
    .toBe('complete');
}
