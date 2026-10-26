// The visitor's palette: the header switcher recolours every section, is remembered, works by
// keyboard, and keeps the page accessible in each palette.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './fixtures';
import { expectNoHorizontalOverflow, watch } from './helpers';

const PALETTES = { desert: 'rgb(21, 18, 15)', jade: 'rgb(18, 28, 23)', misty: 'rgb(22, 29, 37)', imperial: 'rgb(31, 21, 18)', lake: 'rgb(17, 29, 31)' };
const ground = (page: Page, id: string) => page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).backgroundColor);
const button = (page: Page) => page.getByRole('button', { name: /Colour palette/ });
/** The recoloured galaxy backdrop the palette hands to the CSS, or '' for the original file. */
const galaxy = (page: Page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--bd-galaxy').slice(0, 24));

test('choosing a palette recolours the sections, the theme colour and the portrait, and is remembered', async ({ page }) => {
  const w = watch(page);
  await page.goto('/');
  expect(await ground(page, 'top')).toBe(PALETTES.desert);
  await expect(button(page)).toHaveAccessibleName('Colour palette: Desert Titanium');
  await button(page).click();
  await page.getByRole('radio', { name: /Imperial Wall/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'imperial');
  expect(await ground(page, 'top')).toBe(PALETTES.imperial);
  expect(await ground(page, 'projects')).toBe(PALETTES.imperial);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1f1512');
  await expect(button(page)).toHaveAccessibleName('Colour palette: Imperial Wall');
  await expect.poll(() => galaxy(page)).toBe('url("data:image/svg+xml,');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'imperial');
  expect(await ground(page, 'top')).toBe(PALETTES.imperial);
  await expect(page.locator('.hero__portrait')).not.toHaveAttribute('data-mode', 'static');

  await button(page).click();
  await page.getByRole('radio', { name: /Desert Titanium/ }).check();
  await expect(page.locator('html')).not.toHaveAttribute('data-palette', /.*/);
  expect(await ground(page, 'top')).toBe(PALETTES.desert);
  expect(await galaxy(page)).toBe('');
  expect(w.errors).toEqual([]);
});

test('the switcher works by keyboard: arrows choose, Escape closes and returns focus', async ({ page }) => {
  await page.goto('/');
  await button(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('radio', { name: /Desert Titanium/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /Jade Pavilion/ })).toBeChecked();
  expect(await ground(page, 'top')).toBe(PALETTES.jade);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('radio', { name: /Jade Pavilion/ })).toBeHidden();
  await expect(button(page)).toBeFocused();
  await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
});

for (const palette of Object.keys(PALETTES).filter((p) => p !== 'desert')) {
  test(`${palette}: no serious accessibility violations and no horizontal overflow`, async ({ page }) => {
    // A full axe scan of the page beside the software-WebGL hero can take most of a minute.
    test.setTimeout(120_000);
    await page.addInitScript((p) => localStorage.setItem('portfolio:palette', p), palette);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await ground(page, 'top')).toBe(PALETTES[palette as keyof typeof PALETTES]);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    await expectNoHorizontalOverflow(page);
  });
}
