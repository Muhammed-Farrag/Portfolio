// The opening sequence: the page plays itself once per tab, then belongs to the visitor.
import { expect, test, type Page } from '@playwright/test';
import { watch } from './helpers';

const state = (page: Page) => page.evaluate(() => document.documentElement.dataset.cinema);
const label = (page: Page) => page.locator('.cinema__label');

test.describe('opening sequence', () => {
  test('plays on its own: the scenes advance with no input and the page moves down', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await expect.poll(() => state(page)).toBe('playing');
    await expect(label(page)).toContainText('Arrival', { timeout: 15_000 });
    await expect(label(page)).toContainText('Important events', { timeout: 40_000 });
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 20_000 }).toBeGreaterThan(300);
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible();
    expect(w.errors).toEqual([]);
  });

  test('Pause holds the scene, Play resumes it', async ({ page }) => {
    await page.goto('/');
    await expect(label(page)).toContainText('Arrival', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Pause' }).click();
    const y = await page.evaluate(() => scrollY);
    await page.waitForTimeout(8000);
    expect(await page.evaluate(() => scrollY)).toBe(y);
    await expect(label(page)).toContainText('Arrival');
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(label(page)).toContainText('Important events', { timeout: 40_000 });
  });

  test('Skip intro hands the page to the visitor, and a reload in the same tab does not replay it', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => state(page)).toBe('playing');
    await page.getByRole('button', { name: 'Skip intro' }).click();
    await expect.poll(() => state(page)).toBe('done');
    await expect(page.locator('.cinema')).toHaveCount(0);
    await page.reload();
    await expect.poll(() => state(page)).toBe('done');
    await expect(page.locator('.cinema')).toHaveCount(0);
  });

  test('scrolling, a key or a navigation click ends it', async ({ page }, info) => {
    for (const how of ['wheel', 'key', 'nav'] as const) {
      if (how === 'wheel' && info.project.name.includes('mobile')) continue;
      await page.goto('/');
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      await expect.poll(() => state(page)).toBe('playing');
      if (how === 'wheel') await page.mouse.wheel(0, 300);
      else if (how === 'key') await page.keyboard.press('ArrowDown');
      else {
        if (info.project.name.includes('mobile')) await page.getByRole('button', { name: 'Menu' }).click();
        await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
      }
      await expect.poll(() => state(page), { message: how }).toBe('done');
      if (how === 'nav') await expect(page).toHaveURL(/#projects$/);
    }
  });

  test('a link to a section opens there, without the sequence', async ({ page }) => {
    await page.goto('/#contact');
    await expect.poll(() => state(page)).toBe('done');
    await expect(page.locator('.cinema')).toHaveCount(0);
    await expect(page.locator('#contact h2')).toBeInViewport();
  });

  test('reduced motion skips it entirely', async ({ browser }, info) => {
    const context = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(info.project.use.baseURL!);
    await expect.poll(() => state(page)).toBe('done');
    await expect(page.locator('.cinema')).toHaveCount(0);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await context.close();
  });
});
