// Phase 2, milestone 1: application shell, navigation, layout and responsiveness.
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, watch } from './helpers';

const SECTIONS = ['top', 'approach', 'work', 'under-the-hood', 'recognition', 'journey', 'contact'];
const isMobile = (name: string) => name.includes('mobile');

test.describe('site shell', () => {
  test('renders the page structure with self-hosted fonts and no errors', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await expect(page).toHaveTitle('Muhammed Farrag — Applied AI Engineer');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Muhammed\s*Farrag/i);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    for (const id of SECTIONS) await expect(page.locator(`#${id}`)).toHaveCount(1);
    expect(await page.locator('h2').count()).toBe(6);
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return ['800 20px "Archivo Variable"', '400 16px "Geist Variable"', '500 12px "JetBrains Mono Variable"'].map((f) => document.fonts.check(f));
    });
    expect(fonts).toEqual([true, true, true]);
    await page.waitForLoadState('networkidle');
    expect(w.errors).toEqual([]);
    expect(w.failedRequests).toEqual([]);
    const external = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((u) => !u.startsWith(location.origin) && !u.startsWith('data:')));
    expect(external).toEqual([]);
  });

  test('the skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/');
    // Under software WebGL the portrait's start-up is a busy moment for the main thread; the
    // first keypress is sent after it so the test checks focus order, not start-up timing.
    await expect(page.locator('.hero__portrait')).not.toHaveAttribute('data-mode', 'loading', { timeout: 15_000 });
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('has no horizontal overflow at 390, 768, 1280 and 1440 px', async ({ page }) => {
    for (const width of [390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expectNoHorizontalOverflow(page);
      const nameFits = await page.locator('#hero-name span').evaluateAll((spans) =>
        spans.every((s) => s.scrollWidth <= (s.parentElement!.parentElement as HTMLElement).clientWidth + 1),
      );
      expect(nameFits, `name fits its column at ${width}px`).toBe(true);
    }
  });

  test('reserves a square for the portrait so the layout cannot shift', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('.hero__stage').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.width - box!.height)).toBeLessThanOrEqual(1);
  });

  test('has no serious or critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('uses instant scrolling when reduced motion is requested', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(test.info().project.use.baseURL!);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    await context.close();
  });
});

test.describe('navigation', () => {
  test('every navigation link reaches its section', async ({ page }, info) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    for (const [label, id] of [['Approach', 'approach'], ['Work', 'work'], ['Recognition', 'recognition'], ['Journey', 'journey'], ['Contact', 'contact']]) {
      if (isMobile(info.project.name)) await page.getByRole('button', { name: 'Menu' }).click();
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id} h2`)).toBeInViewport();
      if (isMobile(info.project.name)) await expect(nav).toBeHidden();
    }
  });

  test('GitHub links point to the verified profile and open safely', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[href="https://github.com/Muhammed-Farrag"]');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('rel', /noopener/);
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });

  test('the mobile menu opens, closes with Escape and returns focus', async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), 'mobile layout only');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Menu' });
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(nav.getByRole('link', { name: 'Approach' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  });

  test('the desktop navigation is always visible without a menu button', async ({ page }, info) => {
    test.skip(isMobile(info.project.name), 'desktop layout only');
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
  });
});

const THEME_GROUNDS: [string, string][] = [
  ['top', 'rgb(2, 18, 47)'], // Deep: Oxford Blue
  ['approach', 'rgb(17, 34, 61)'], // Mid: Midnight
  ['work', 'rgb(240, 236, 221)'], // Light: Moonlight
  ['under-the-hood', 'rgb(35, 53, 77)'], // Elevated: Storm
  ['recognition', 'rgb(2, 18, 47)'], // Deep
  ['journey', 'rgb(240, 236, 221)'], // Light
  ['contact', 'rgb(35, 53, 77)'], // Elevated
];

test.describe('section themes', () => {
  test('each section uses its approved theme ground', async ({ page }) => {
    await page.goto('/');
    for (const [id, ground] of THEME_GROUNDS) {
      expect(await page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).backgroundColor), id).toBe(ground);
    }
    expect(await page.locator('footer').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(2, 18, 47)');
  });

  test('dark sections that meet blend with a gradient; light sections keep a clean edge', async ({ page }) => {
    await page.goto('/');
    const image = (id: string) => page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).backgroundImage);
    expect(await image('approach')).toContain('rgb(2, 18, 47)'); // from the Deep hero
    expect(await image('recognition')).toContain('rgb(35, 53, 77)'); // from the Elevated section above
    for (const id of ['work', 'under-the-hood', 'journey', 'contact']) expect(await image(id), id).toBe('none');
  });

  test('headings, body text and labels meet WCAG AA against their own section', async ({ page }) => {
    await page.goto('/');
    const failures = await page.evaluate(() => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = (c: string) => {
        const [r, g, b] = rgb(c).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number];
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a: string, b: string) => {
        const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
        return (x + 0.05) / (y + 0.05);
      };
      const out: string[] = [];
      for (const section of document.querySelectorAll<HTMLElement>('main > section')) {
        const ground = getComputedStyle(section).backgroundColor;
        for (const el of section.querySelectorAll<HTMLElement>('h1, h2, h3, p, li, a')) {
          if (el.closest('[data-pending], .hero__portrait, .button--primary')) continue;
          // Dark instruments inside a light section carry their own theme and ground.
          const panel = el.closest<HTMLElement>('[class*="theme-"]');
          const own = panel && panel !== section ? getComputedStyle(panel).backgroundColor : ground;
          const r = ratio(getComputedStyle(el).color, own);
          if (r < 4.5) out.push(`#${section.id} ${el.tagName} ${r.toFixed(2)}`);
        }
      }
      return out;
    });
    expect(failures).toEqual([]);
  });

  test('the header stays Oxford Blue and readable over light sections', async ({ page }, info) => {
    await page.goto('/');
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 200));
    const header = page.getByRole('banner');
    // Chrome reports color-mix() as color(srgb r g b / a) with 0-1 channels.
    const ground = await header.evaluate((e) => getComputedStyle(e).backgroundColor);
    const [r, g, bl, alpha] = (ground.match(/[\d.]+/g) ?? []).map(Number).map((v, i, all) => (all.length === 4 && i < 3 && ground.startsWith('color(') ? Math.round(v * 255) : v));
    expect([r, g, bl, alpha]).toEqual([2, 18, 47, 0.92]);
    if (!info.project.name.includes('mobile')) {
      const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Work', exact: true });
      expect(await link.evaluate((e) => getComputedStyle(e).color)).toBe('rgb(201, 211, 226)'); // Mist
    } else {
      await page.getByRole('button', { name: 'Menu' }).click();
      const nav = page.getByRole('navigation', { name: 'Primary' });
      expect(await nav.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(2, 18, 47)');
    }
  });

  test('controls inside light sections use the light focus ring and outlines', async ({ page }) => {
    await page.goto('/');
    const vars = await page.locator('#work').evaluate((e) => {
      const cs = getComputedStyle(e);
      return ['--color-focus', '--color-control-edge', '--color-focal', '--color-on-focal'].map((v) => cs.getPropertyValue(v).trim());
    });
    // Storm focus ring, Steel outlines, Oxford Blue primary fill with Moonlight text.
    expect(vars).toEqual(['#23354d', '#495b7d', '#02122f', '#f0ecdd']);
  });
});

test.describe('production build', () => {
  test('contains only the public site and never renders placeholders', async ({ browser }) => {
    expect(existsSync('dist/index.html'), 'run `npm run build` first').toBe(true);
    const files = readdirSync('dist', { recursive: true }).map(String);
    expect(files.filter((f) => /dev[\\/]|legacy|lab|lifecycle|\.png$/.test(f))).toEqual([]);
    const context = await browser.newContext();
    const page = await context.newPage();
    const w = watch(page);
    await page.goto('http://127.0.0.1:4312/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-pending]')).toHaveCount(0);
    await expect(page.locator('.contact__photo'), 'no empty photo slot').toHaveCount(0);
    await expect(page.getByText('In progress')).toHaveCount(0);
    expect(w.errors).toEqual([]);
    await context.close();
  });
});
