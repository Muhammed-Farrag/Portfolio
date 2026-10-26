// Certificates: a drifting gallery of the 37 certificates, each opening in a dialog.
import { expect, test } from './fixtures';

const cards = (page: import('@playwright/test').Page) => page.locator('.cert:not([aria-hidden])');

test('shows every certificate once to assistive tech; the looping copies are hidden', async ({ page }) => {
  await page.goto('/#certificates');
  await expect(cards(page)).toHaveCount(37);
  const copies = page.locator('.cert[aria-hidden="true"]');
  await expect(copies).toHaveCount(37);
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

test('an internship or education entry opens its own certificates in the lightbox', async ({ page }) => {
  await page.goto('/#growth');
  const iti = page.getByRole('list', { name: /Certificates for Software Engineer Intern/ });
  await expect(iti.getByRole('button')).toHaveCount(2);
  await iti.getByRole('button').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { level: 3 })).toHaveText(/Object-Oriented Programming/);
  await expect(dialog).toContainText('1 / 2');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await expect(dialog.getByRole('heading', { level: 3 })).toHaveText(/JDBC/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  // One certificate: no Previous or Next.
  await page.getByRole('list', { name: /Certificates for GCI World 2026/ }).getByRole('button').click();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 3 })).toHaveText(/GCI World 2026/);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Next' })).toHaveCount(0);
});

test('education and internships share one timeline, oldest first; on desktop the cards alternate around the line', async ({ page }, info) => {
  await page.goto('/#growth');
  const items = page.locator('.timeline__item');
  await expect(items).toHaveCount(5);
  await expect(items.locator('.timeline__title')).toHaveText([
    'B.Sc. in Artificial Intelligence Science',
    'Data Science Intern',
    'Software Engineer Intern',
    'Generative AI Professional Trainee',
    'GCI World 2026',
  ]);
  await expect(items.first().locator('.timeline__tag')).toHaveText('Education');
  await expect(items.nth(1).locator('.timeline__tag')).toHaveText('Internship');
  if (info.project.name.includes('mobile')) return;
  const line = (await items.first().locator('.timeline__line').boundingBox())!;
  for (let i = 0; i < 5; i++) {
    const card = (await items.nth(i).locator('.timeline__card').boundingBox())!;
    if (i % 2) expect(card.y, `card ${i} below the line`).toBeGreaterThan(line.y);
    else expect(card.y + card.height, `card ${i} above the line`).toBeLessThan(line.y);
  }
});
