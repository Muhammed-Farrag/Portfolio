// Phase 2, milestone 1: application shell, navigation, layout and responsiveness.
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readdirSync } from 'node:fs';
import { expect, test } from './fixtures';
import { expectNoHorizontalOverflow, watch } from './helpers';

const SECTIONS = ['top', 'events', 'experience', 'growth', 'projects', 'certificates', 'contact'];
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
    for (const [label, id] of [['Events', 'events'], ['Experience', 'experience'], ['Education', 'growth'], ['Projects', 'projects'], ['Certificates', 'certificates'], ['Contact', 'contact']]) {
      if (isMobile(info.project.name)) await page.getByRole('button', { name: 'Menu' }).click();
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`).locator('h2, h3').first()).toBeInViewport();
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
    await expect(nav.getByRole('link', { name: 'Events' })).toBeFocused();
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

// Jade Pavilion (tokens.css): Deep #121c17, Mid #1c2a23, Raised #2f4438, the light ground #dde6d8.
const THEME_GROUNDS: [string, string][] = [
  ['top', 'rgb(18, 28, 23)'], // Deep
  ['events', 'rgb(28, 42, 35)'], // Mid
  ['experience', 'rgb(47, 68, 56)'], // Elevated
  ['growth', 'rgb(221, 230, 216)'], // Light
  ['projects', 'rgb(18, 28, 23)'], // Deep
  ['certificates', 'rgb(221, 230, 216)'], // Light
  ['contact', 'rgb(47, 68, 56)'], // Elevated
];

test.describe('section themes', () => {
  test('each section uses its approved theme ground', async ({ page }) => {
    await page.goto('/');
    for (const [id, ground] of THEME_GROUNDS) {
      expect(await page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).backgroundColor), id).toBe(ground);
    }
    expect(await page.locator('footer').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(18, 28, 23)');
  });

  test('dark sections that meet blend with a gradient; light sections keep a clean edge', async ({ page }) => {
    await page.goto('/');
    const image = (id: string) => page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).backgroundImage);
    expect(await image('events')).toContain('rgb(18, 28, 23)'); // from the Deep hero
    for (const id of ['experience', 'growth', 'projects', 'certificates', 'contact']) expect(await image(id), id).toBe('none');
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
          if (el.closest('.button--primary')) continue;
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

  test('the glass header takes the tone of the section under it, so its links stay readable', async ({ page }, info) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    await expect(header).toHaveAttribute('data-over', 'dark');
    // Put the top of the light Education & Internships section just under the bar.
    await page.evaluate(() => window.scrollTo({ top: document.getElementById('growth')!.getBoundingClientRect().top + scrollY + 20, behavior: 'instant' }));
    await expect(header).toHaveAttribute('data-over', 'light');
    if (!info.project.name.includes('mobile')) {
      const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true });
      await expect.poll(() => link.evaluate((e) => getComputedStyle(e).color)).toBe('rgb(18, 28, 23)'); // Deep on light glass
    } else {
      await page.getByRole('button', { name: 'Menu' }).click();
      const link = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true });
      expect(await link.evaluate((e) => getComputedStyle(e).color)).toBe('rgb(221, 230, 216)'); // the light tone on the dark menu panel
    }
  });

  test('controls inside light sections use the light focus ring and outlines', async ({ page }) => {
    await page.goto('/');
    const vars = await page.locator('#growth').evaluate((e) => {
      const cs = getComputedStyle(e);
      return ['--color-focus', '--color-control-edge', '--color-focal', '--color-on-focal'].map((v) => cs.getPropertyValue(v).trim());
    });
    // Deep focus ring, darkened-jade outlines, Deep primary fill with Parchment text.
    expect(vars).toEqual(['#121c17', '#4f6b5a', '#121c17', '#f3efe2']);
  });
});

test.describe('production build', () => {
  test('contains only the public site and never renders placeholders', async ({ browser }) => {
    expect(existsSync('dist/index.html'), 'run `npm run build` first').toBe(true);
    const files = readdirSync('dist', { recursive: true }).map(String);
    // No lab pages, source PNGs or certificate PDFs: the gallery ships rendered images only.
    expect(files.filter((f) => /dev[\\/]|legacy|lab|lifecycle|\.png$|\.pdf$/i.test(f))).toEqual([]);
    const context = await browser.newContext();
    const page = await context.newPage();
    const w = watch(page);
    await page.goto('http://127.0.0.1:4312/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.contact__photo'), 'no empty photo slot').toHaveCount(0);
    await expect(page.getByText('In progress')).toHaveCount(0);
    expect(w.errors).toEqual([]);
    await context.close();
  });
});
