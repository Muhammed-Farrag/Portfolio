// Behaviour suite shared by the untouched legacy prototype and the maintained Portrait Lab.
// Tests that document a legacy defect are marked `test.fail` for the legacy projects only, so the
// suite stays green while proving the defect exists in the original and is fixed in the Lab.
import { expect, test } from '@playwright/test';
import {
  BASELINE_COUNTS,
  disableWebGL,
  expectNoHorizontalOverflow,
  expectStateSequence,
  isLegacy,
  recordStates,
  stateMark,
  waitForParticles,
  watch,
} from './helpers';

test.describe('initial render', () => {
  test('renders WebGL particles with the baseline count, without errors or broken requests', async ({ page }) => {
    const w = watch(page);
    await page.goto('./');
    await waitForParticles(page);
    await expect(page.locator('#count')).toHaveText(BASELINE_COUNTS['2']);
    await expect(page.locator('#state')).toHaveText('RESPONDING');
    await expect(page.locator('.stage')).not.toHaveClass(/photo/);
    await page.waitForLoadState('networkidle');
    expect(w.errors).toEqual([]);
    expect(w.failedRequests).toEqual([]);
    await expectNoHorizontalOverflow(page);
  });

  test('every detail level matches the baseline count', async ({ page }) => {
    await page.goto('./');
    await waitForParticles(page);
    for (const step of ['3', '4', '2'] as const) {
      await page.selectOption('#density', step);
      await expect(page.locator('#count')).toHaveText(BASELINE_COUNTS[step]);
    }
  });
});

test.describe('controls', () => {
  test.beforeEach(async ({ page }) => {
    await recordStates(page);
    await page.goto('./');
    await waitForParticles(page);
  });

  test('Scatter runs the full scatter → reform → respond cycle', async ({ page }) => {
    await expect(page.locator('#state')).toHaveText('RESPONDING');
    const mark = await stateMark(page);
    await page.click('#scatter');
    await expectStateSequence(page, mark, ['SCATTERING', 'REFORMING', 'RESPONDING']);
  });

  test('clicking the portrait scatters it', async ({ page }) => {
    await expect(page.locator('#state')).toHaveText('RESPONDING');
    const mark = await stateMark(page);
    await page.click('#stage');
    await expectStateSequence(page, mark, ['SCATTERING', 'REFORMING']);
  });

  test('Pause freezes motion and blocks scatter until resumed', async ({ page }) => {
    await page.click('#pause');
    await expect(page.locator('#pause')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#pause')).toHaveText('Resume motion');
    await expect(page.locator('#state')).toHaveText('PAUSED');
    await page.click('#scatter');
    await expect(page.locator('#state')).toHaveText('PAUSED — RESUME TO SCATTER');
    await page.click('#pause');
    await expect(page.locator('#state')).toHaveText('RESPONDING');
  });

  test('Source shows the static image and Particles brings the canvas back', async ({ page }) => {
    await page.click('#photo');
    await expect(page.locator('.stage')).toHaveClass(/photo/);
    await expect(page.locator('#state')).toHaveText('SOURCE IMAGE');
    await expect(page.locator('#photo')).toHaveAttribute('aria-pressed', 'true');
    await page.click('#particles');
    await expect(page.locator('.stage')).not.toHaveClass(/photo/);
    await expect(page.locator('#state')).toHaveText('RESPONDING');
  });

  test('tone and reaction controls update their labels', async ({ page }) => {
    await page.selectOption('#tone', '1');
    await expect(page.locator('.stage-label')).toHaveText('FIG. 001 / WARM IVORY');
    await page.locator('#force').fill('80');
    await expect(page.locator('#force-value')).toHaveText('80%');
  });

  test('Reset restores every default', async ({ page }) => {
    await page.selectOption('#density', '4');
    await page.selectOption('#tone', '2');
    await page.locator('#force').fill('10');
    await page.click('#photo');
    await page.click('#reset');
    await expect(page.locator('#density')).toHaveValue('2');
    await expect(page.locator('#tone')).toHaveValue('0');
    await expect(page.locator('#force-value')).toHaveText('55%');
    await expect(page.locator('.stage-label')).toHaveText('FIG. 001 / AMBER');
    await expect(page.locator('#count')).toHaveText(BASELINE_COUNTS['2']);
    await expect(page.locator('.stage')).not.toHaveClass(/photo/);
    await expect(page.locator('#state')).toHaveText('RESPONDING');
  });

  test('About opens and closes the dialog', async ({ page }) => {
    await page.click('#about');
    await expect(page.locator('#dialog')).toBeVisible();
    await page.click('#close');
    await expect(page.locator('#dialog')).toBeHidden();
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('starts paused and follows the system setting when it changes', async ({ page }) => {
    await page.goto('./');
    await waitForParticles(page);
    await expect(page.locator('#state')).toHaveText('PAUSED');
    await expect(page.locator('#pause')).toHaveText('Resume motion');
    await page.click('#scatter');
    await expect(page.locator('#state')).toHaveText('PAUSED — RESUME TO SCATTER');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('#state')).toHaveText('RESPONDING');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('#state')).toHaveText('PAUSED');
  });
});

test.describe('static fallback', () => {
  test('without WebGL the static portrait is shown and particle controls are disabled', async ({ page }) => {
    await disableWebGL(page);
    await page.goto('./');
    await expect(page.locator('#state')).toHaveText('STATIC FALLBACK');
    await expect(page.locator('#renderer')).toHaveText('IMAGE');
    await expect(page.locator('.stage')).toHaveClass(/photo/);
    await expect(page.locator('.source')).toBeVisible();
    for (const id of ['particles', 'density', 'force', 'tone', 'scatter', 'pause']) await expect(page.locator(`#${id}`)).toBeDisabled();
  });

  test('Reset can never hide the static fallback', async ({ page }, info) => {
    test.fail(isLegacy(info), 'Legacy defect: Reset calls mode(false) and removes the only visible image.');
    await disableWebGL(page);
    await page.goto('./');
    await expect(page.locator('#state')).toHaveText('STATIC FALLBACK');
    // Force a click even if the button is disabled, to prove the guard itself holds.
    await page.locator('#reset').evaluate((b: HTMLButtonElement) => {
      b.disabled = false;
      b.click();
    });
    await page.locator('#particles').evaluate((b: HTMLButtonElement) => {
      b.disabled = false;
      b.click();
    });
    await expect(page.locator('.stage')).toHaveClass(/photo/);
    await expect(page.locator('.source')).toHaveCSS('opacity', '1');
  });

  test('a missing portrait image falls back without breaking the page', async ({ page }) => {
    await page.route('**/portrait.png', (route) => route.abort());
    await page.goto('./');
    await expect(page.locator('#state')).toHaveText('IMAGE UNAVAILABLE');
    await expect(page.locator('#renderer')).toHaveText('IMAGE');
  });
});

test.describe('links', () => {
  test('there is no link to the missing source archive', async ({ page }, info) => {
    test.fail(isLegacy(info), 'Legacy defect: footer links ../particle-portrait-source.zip, which returns 404.');
    await page.goto('./');
    await expect(page.locator('a[href*="particle-portrait-source.zip"]')).toHaveCount(0);
  });

  test('every link on the page resolves', async ({ page, request }, info) => {
    test.fail(isLegacy(info), 'Legacy defect: the source archive link returns 404.');
    await page.goto('./');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBeLessThan(400);
  });
});
