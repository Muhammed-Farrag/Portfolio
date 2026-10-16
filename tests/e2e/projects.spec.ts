// Projects: four case studies, each with its repository; Lumina's orbits tilt from the keyboard too.
import { expect, test } from './fixtures';

test('lists the four projects, each with a repository link', async ({ page }) => {
  await page.goto('/#projects');
  for (const name of ['Self-Healing Automation Workflow', 'HELIOS', 'NovaCare', 'Lumina']) {
    const card = page.locator('article.case', { has: page.getByRole('heading', { level: 3, name }) });
    await expect(card).toHaveCount(1);
    await expect(card.getByRole('link', { name: /repository/i })).toHaveAttribute('href', /^https:\/\/github\.com\//);
  }
});

test('the Lumina view angle slider tilts the orbits from the keyboard', async ({ page }) => {
  await page.goto('/#case-lumina');
  const orbit = page.locator('.lumina__orbit').last();
  const before = Number(await orbit.getAttribute('ry'));
  const slider = page.getByRole('slider', { name: 'View angle' });
  await slider.focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => Number(await orbit.getAttribute('ry'))).toBeLessThan(before - 20);
});
