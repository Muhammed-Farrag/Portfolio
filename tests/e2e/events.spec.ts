import { expect, test } from './fixtures';

// Each scene is its own test: the page behind them (the hero's particle field) renders in software
// WebGL here, and on the 3x phone viewport one pass through a scene can take most of a minute.
for (const scene of ['victory', 'ceremony', 'judging']) {
  test(`the ${scene} story scrubs, reverses, and skips to its photograph`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/#events');
    const track = page.locator(`[data-event="${scene}"]`);
    const scrub = async (p: number) => {
      await track.evaluate((el, progress) => {
        window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top + (el.clientHeight - innerHeight) * progress);
      }, p);
      await expect.poll(async () => Number(await track.evaluate((el) => el.style.getPropertyValue('--p')))).toBeCloseTo(p, 2);
    };
    await scrub(0.65);
    await expect(track.locator('canvas')).toBeVisible();
    await expect(track.locator('h3')).toBeVisible();
    await scrub(0.2);
    await track.getByRole('link', { name: 'Skip to the photograph' }).click();
    await expect.poll(async () => Number(await track.evaluate((el) => el.style.getPropertyValue('--photo')))).toBe(1);
    await expect(track.locator('img')).toBeVisible();
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('reduced motion presents the three photographs without scroll tracks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#events');
  await expect(page.locator('.recog')).toHaveAttribute('data-mode', 'static');
  await expect(page.locator('.recog canvas')).toHaveCount(0);
  await expect(page.locator('.recog__scroll')).toHaveCount(0);
  await expect(page.locator('.recog__photo img')).toHaveCount(3);
  for (const image of await page.locator('.recog__photo img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
  }
});
