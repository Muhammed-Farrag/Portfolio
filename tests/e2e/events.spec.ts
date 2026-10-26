import { expect, test, type Page } from './fixtures';

// Important Events: a slideshow of three moments on one stage. Each scene plays by itself for 5 s,
// lands on its photograph, rests 4 s and moves on, until the visitor takes over with the tabs,
// the ‹ › buttons or a swipe.
const section = (page: Page) => page.locator('#events');
const photo = (page: Page) => section(page).evaluate((el) => Number((el as HTMLElement).style.getPropertyValue('--photo')));
const selected = (page: Page) => page.getByRole('tab', { selected: true });
const toStage = (page: Page) => page.locator('.recog__stage').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));

test('the first moment plays when the stage is on screen, lands on its photograph and moves on by itself', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await toStage(page);
  await expect(selected(page)).toContainText('Best Creativity Trophy');
  await expect(page.locator('.recog__canvas')).toBeVisible();
  await expect.poll(() => photo(page), { timeout: 9_000 }).toBe(1);
  await expect(page.locator('.recog__photo img')).toHaveAttribute('alt', /RoboRAVE/);
  // 4 s on the photograph, then the next moment, without any input.
  await expect(selected(page)).toContainText('Top Digital Pioneer', { timeout: 9_000 });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the tabs, the buttons and a swipe change the moment, and each plays from the start', async ({ page }) => {
  await page.goto('/');
  await toStage(page);
  await page.getByRole('button', { name: 'Next moment' }).click();
  await expect(selected(page)).toContainText('Top Digital Pioneer');
  await expect.poll(() => photo(page)).toBeLessThan(1);
  await page.getByRole('tab', { name: /Official Judge/ }).click();
  await expect(selected(page)).toContainText('Official Judge');
  await page.getByRole('button', { name: 'Previous moment' }).click();
  await expect(selected(page)).toContainText('Top Digital Pioneer');
  // A swipe to the left on the stage moves to the next moment.
  const box = (await page.locator('.recog__stage').boundingBox())!;
  const y = box.y + box.height * 0.3;
  await page.mouse.move(box.x + box.width * 0.6, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, y, { steps: 5 });
  await page.mouse.up();
  await expect(selected(page)).toContainText('Official Judge');
  // Arrow keys move between the tabs.
  await selected(page).focus();
  await page.keyboard.press('ArrowRight');
  await expect(selected(page)).toContainText('Best Creativity Trophy');
  await expect(selected(page)).toBeFocused();
});

test('reduced motion shows the photographs and words without scenes; the buttons still work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#events');
  await expect(section(page)).toHaveAttribute('data-mode', 'static');
  await expect(page.locator('.recog__canvas'), 'no scene; the star field still draws one still frame').toHaveCount(0);
  await expect(page.locator('.recog__photo img')).toBeVisible();
  await page.getByRole('button', { name: 'Next moment' }).click();
  await expect(selected(page)).toContainText('Top Digital Pioneer');
  await expect(page.locator('.recog__photo img')).toHaveAttribute('alt', /Digital Egypt Pioneers/);
});
