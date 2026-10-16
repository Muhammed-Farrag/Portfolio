// Certificates: a drifting gallery of the 28 certificates, each opening in a dialog.
import { expect, test } from './fixtures';

const cards = (page: import('@playwright/test').Page) => page.locator('.cert:not([aria-hidden])');

test('shows every certificate once to assistive tech; the looping copies are hidden', async ({ page }) => {
  await page.goto('/#certificates');
  await expect(cards(page)).toHaveCount(28);
  const copies = page.locator('.cert[aria-hidden="true"]');
  await expect(copies).toHaveCount(28);
  await expect(copies.first().locator('button')).toHaveAttribute('tabindex', '-1');
  await expect(page.getByRole('button', { name: /Neural Networks and Deep Learning, DeepLearning\.AI, \w{3} \d{4}/ })).toHaveCount(1);
});

test('keyboard focus stops a row, and a card opens the certificate with previous and next', async ({ page }) => {
  await page.goto('/#certificates');
  const first = cards(page).first().locator('button');
  await first.focus();
  await expect(page.locator('.certs__track').first()).toHaveCSS('animation-play-state', 'paused');
  const title = (await first.getAttribute('aria-label'))!.split(',')[0]!;
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { level: 3 })).toHaveText(title);
  await expect(dialog.getByRole('img')).toHaveAttribute('src', /\.webp/);
  await dialog.getByRole('button', { name: 'Next' }).click();
  await expect(dialog.getByRole('heading', { level: 3 })).not.toHaveText(title);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('with reduced motion the rows stand still and scroll sideways', async ({ browser }, info) => {
  const context = await browser.newContext({ ...info.project.use, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${info.project.use.baseURL}/#certificates`);
  await expect(page.locator('.cert[aria-hidden="true"]')).toHaveCount(0);
  await expect(page.locator('.certs__track').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.certs__row').first()).toHaveCSS('overflow-x', 'auto');
  await context.close();
});
