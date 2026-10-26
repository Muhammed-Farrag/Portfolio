import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Parses the custom properties in tokens.css (resolving var() references) and checks every
// text/background pair the design allows against WCAG 2.2 (docs/DESIGN_SPEC.md §2.3).
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const declarations = (block: string) => new Map([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
const raw = declarations(root);
const THEMES = ['deep', 'mid', 'elevated', 'light'] as const;
type Theme = (typeof THEMES)[number];
const themeBlock = (theme: Theme) => {
  const start = css.indexOf(`.theme-${theme} {`);
  if (start < 0) throw new Error(`.theme-${theme} missing`);
  return declarations(css.slice(start, css.indexOf('}', start)));
};
/** Resolves a token as seen inside a section with `theme` (or at the root). */
const resolve = (name: string, theme?: Theme): string => {
  const value = (theme && themeBlock(theme).get(name)) ?? raw.get(name);
  if (!value) throw new Error(`token --${name} missing`);
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  return ref ? resolve(ref[1]!) : value;
};

const luminance = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('design tokens', () => {
  it('are the Jade Pavilion palette exactly (Revision 7)', () => {
    expect({
      deep: resolve('p-deep'), mid: resolve('p-mid'), raised: resolve('p-raised'), accent: resolve('p-accent'),
      soft: resolve('p-soft'), softer: resolve('p-softer'), paper: resolve('p-paper'), panel: resolve('p-panel'), edge: resolve('p-edge'),
    }).toEqual({
      deep: '#121c17', mid: '#1c2a23', raised: '#2f4438', accent: '#8fb09b',
      soft: '#b3cbb9', softer: '#dde6d8', paper: '#f3efe2', panel: '#cfdcce', edge: '#4f6b5a',
    });
  });

  it('there is one palette: no other palette blocks, no earlier palettes', () => {
    expect(css).not.toMatch(/data-palette/);
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#15120f|#bfa48f|#23354d|#8ba3c5|nebula/i);
  });

  it('use Forest as the background, Mid as the surface and Parchment as text', () => {
    expect([resolve('color-bg'), resolve('color-surface'), resolve('color-text')]).toEqual(['#121c17', '#1c2a23', '#f3efe2']);
  });

  it('the four grounds: Deep, Mid, Raised and the light ground', () => {
    expect(THEMES.map((t) => resolve('color-bg', t))).toEqual(['#121c17', '#1c2a23', '#2f4438', '#dde6d8']);
  });

  it('the root roles are the Deep theme', () => {
    for (const name of themeBlock('deep').keys()) expect(resolve(name), name).toBe(resolve(name, 'deep'));
  });

  it('every theme defines the same roles', () => {
    const roles = [...themeBlock('deep').keys()].sort();
    for (const theme of THEMES) expect([...themeBlock(theme).keys()].sort(), theme).toEqual(roles);
  });

  it('the light theme is genuinely light: a pale ground and Forest text', () => {
    expect([resolve('color-bg', 'light'), resolve('color-text', 'light')]).toEqual(['#dde6d8', '#121c17']);
    expect([resolve('color-surface', 'light'), resolve('color-surface-alt', 'light')]).toEqual(['#cfdcce', '#cfdcce']);
  });

  const surfaces = ['color-bg', 'color-surface', 'color-surface-alt'];
  for (const theme of THEMES) {
    describe(`.theme-${theme}`, () => {
      const r = (name: string) => resolve(name, theme);

      for (const text of ['color-text', 'color-text-secondary', 'color-text-tertiary', 'color-link']) {
        for (const surface of surfaces) {
          it(`--${text} on --${surface} meets 4.5:1`, () => {
            expect(contrast(r(text), r(surface))).toBeGreaterThanOrEqual(4.5);
          });
        }
      }

      it('--color-text on --color-interactive-fill (hovered buttons) meets 4.5:1', () => {
        expect(contrast(r('color-text'), r('color-interactive-fill'))).toBeGreaterThanOrEqual(4.5);
      });

      it('--color-on-focal on the primary button, at rest and hovered, meets 4.5:1', () => {
        expect(contrast(r('color-on-focal'), r('color-focal'))).toBeGreaterThanOrEqual(4.5);
        expect(contrast(r('color-on-focal'), r('color-focal-hover'))).toBeGreaterThanOrEqual(4.5);
      });

      it('control outlines and the focus ring meet 3:1 on every surface and on hover fills', () => {
        for (const surface of [...surfaces, 'color-interactive-fill']) {
          if (surface !== 'color-interactive-fill') {
            expect(contrast(r('color-control-edge'), r(surface)), surface).toBeGreaterThanOrEqual(3);
          }
          expect(contrast(r('color-focus'), r(surface)), surface).toBeGreaterThanOrEqual(3);
        }
      });

      it('the primary button stands out from the section ground (3:1)', () => {
        expect(contrast(r('color-focal'), r('color-bg'))).toBeGreaterThanOrEqual(3);
      });
    });
  }

  it('contains only near-neutrals and the jade-green band', () => {
    for (const value of css.match(/#[0-9a-f]{6}\b/gi) ?? []) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      if (d < 24 || d / max <= 0.2) continue; // near-neutral
      let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hue = (hue * 60 + 360) % 360;
      expect(hue >= 120 && hue <= 170, `${value} hue ${hue.toFixed(0)}`).toBe(true);
    }
  });
});

describe('index.html', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  it('uses only token colours (theme-color and the no-JavaScript fallback)', () => {
    expect(html).toMatch(new RegExp(`name="theme-color" content="${resolve('color-bg')}"`, 'i'));
    const tokens = new Set([resolve('color-bg'), resolve('color-text'), resolve('color-link')]);
    for (const value of html.match(/#[0-9a-f]{6}\b/gi) ?? []) expect(tokens.has(value.toLowerCase()), value).toBe(true);
  });
});
