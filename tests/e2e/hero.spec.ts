// Hero (v3): a still photograph of him centred on a tree-lined avenue, his name split around him.
import { expect, test } from './fixtures';
import { watch } from './helpers';

const isMobile = (name: string) => name.includes('mobile');

test.describe('hero', () => {
  test('shows the photograph, the name and the headline in the first viewport, with no errors', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    const img = page.locator('.hero__photo img');
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
    await expect(img).toHaveAttribute('alt', /Muhammed Farrag/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Muhammed\s*Farrag/i);
    await expect(page.getByText('Engineering intelligence into real-world systems.')).toBeInViewport();
    await expect(page.locator('#hero-name .hero__first')).toBeInViewport();
    await expect(page.locator('#hero-name .hero__last')).toBeInViewport();
    // No particles, stars or canvases in the hero any more.
    await expect(page.locator('.hero canvas')).toHaveCount(0);
    expect(w.errors).toEqual([]);
    expect(w.failedRequests).toEqual([]);
  });

  test('on desktop the name stands on both sides of him, clear of the middle of the photo', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'desktop layout');
    await page.goto('/');
    const width = page.viewportSize()!.width;
    const first = (await page.locator('#hero-name .hero__first').boundingBox())!;
    const last = (await page.locator('#hero-name .hero__last').boundingBox())!;
    // His face is at about 41-51% of the width: the first name ends before it, the last name starts well after it.
    expect(first.x + first.width).toBeLessThanOrEqual(width * 0.4);
    expect(last.x).toBeGreaterThanOrEqual(width * 0.65);
    expect(Math.abs(first.y - last.y)).toBeLessThanOrEqual(4);
  });

  test('on phones the photograph comes first, centred on him, then the name and headline below it', async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), 'phone layout');
    await page.goto('/');
    const photo = (await page.locator('.hero__photo').boundingBox())!;
    const headline = (await page.locator('.hero__headline').boundingBox())!;
    expect(headline.y).toBeGreaterThan(photo.y + photo.height * 0.8);
    expect(await page.locator('.hero__photo img').evaluate((e: HTMLImageElement) => e.currentSrc)).toMatch(/avenue-portrait/);
  });
});
