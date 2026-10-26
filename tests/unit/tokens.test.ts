import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PALETTE, PALETTES, type PaletteId } from '../../src/features/palette/palette';
import { PORTFOLIO_BACKGROUND, PORTFOLIO_PALETTE, type Rgb } from '../../src/features/particle-portrait';

// Parses the custom properties in tokens.css (resolving var() references) and checks every
// text/background pair the design allows, in every palette, against WCAG 2.2 (docs/DESIGN_SPEC.md §2.3).
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
const PALETTE_IDS = PALETTES.map((p) => p.id);
const SLOTS = [...raw.keys()].filter((name) => name.startsWith('p-'));
/** The slots a palette redefines under :root[data-palette]; the default palette is :root itself. */
const paletteBlock = (palette: PaletteId) => {
  if (palette === DEFAULT_PALETTE) return new Map<string, string>();
  const start = css.indexOf(`:root[data-palette='${palette}'] {`);
  if (start < 0) throw new Error(`palette ${palette} missing`);
  return declarations(css.slice(start, css.indexOf('}', start)));
};
/** Resolves a token as seen inside a section with `theme` (or at the root), in `palette`. */
const resolve = (name: string, theme?: Theme, palette: PaletteId = DEFAULT_PALETTE): string => {
  const value = (theme && themeBlock(theme).get(name)) ?? paletteBlock(palette).get(name) ?? raw.get(name);
  if (!value) throw new Error(`token --${name} missing`);
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  return ref ? resolve(ref[1]!, undefined, palette) : value;
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
const hex = ([r, g, b]: Rgb) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

describe('design tokens', () => {
  it('default to the owner-specified Desert Titanium palette exactly', () => {
    expect({
      ivory: resolve('p-paper'), titanium: resolve('p-accent'), sandstone: resolve('p-raised'),
      void: resolve('p-deep'),
    }).toEqual({ ivory: '#f4eee4', titanium: '#bfa48f', sandstone: '#3a3129', void: '#15120f' });
  });

  it('every other palette redefines exactly the eleven slots', () => {
    expect(SLOTS).toHaveLength(11);
    for (const palette of PALETTE_IDS.filter((p) => p !== DEFAULT_PALETTE)) {
      expect([...paletteBlock(palette).keys()].sort(), palette).toEqual([...SLOTS].sort());
    }
  });

  it("the switcher's swatches are each palette's ground, accent and light ground", () => {
    for (const p of PALETTES) {
      expect(p.swatches, p.id).toEqual([resolve('p-deep', undefined, p.id), resolve('p-accent', undefined, p.id), resolve('p-softer', undefined, p.id)]);
    }
  });

  it('the Moonlight & Storm blues are gone (Revision 5)', () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#02122f|#11223d|#23354d|#8ba3c5|oxford|midnight|moonlight|storm|frost/i);
  });

  it('use Void as the background, Umber as the surface and Ivory as text', () => {
    expect([resolve('color-bg'), resolve('color-surface'), resolve('color-text')]).toEqual(['#15120f', '#221d18', '#f4eee4']);
  });

  it('the four grounds: Void, Umber, Sandstone and Titanium Light', () => {
    expect(THEMES.map((t) => resolve('color-bg', t))).toEqual(['#15120f', '#221d18', '#3a3129', '#e8dccb']);
  });

  it('the root roles are the Deep theme', () => {
    for (const name of themeBlock('deep').keys()) expect(resolve(name), name).toBe(resolve(name, 'deep'));
  });

  it('every theme defines the same roles', () => {
    const roles = [...themeBlock('deep').keys()].sort();
    for (const theme of THEMES) expect([...themeBlock(theme).keys()].sort(), theme).toEqual(roles);
  });

  it('the light theme is genuinely light: Titanium Light ground and Void text', () => {
    expect([resolve('color-bg', 'light'), resolve('color-text', 'light')]).toEqual(['#e8dccb', '#15120f']);
    expect([resolve('color-surface', 'light'), resolve('color-surface-alt', 'light')]).toEqual(['#dccdb9', '#dccdb9']);
  });

  it('the nebula tints are never a text, link, focus or control colour', () => {
    for (const theme of THEMES) {
      for (const name of themeBlock(theme).keys()) {
        expect(themeBlock(theme).get(name), `${theme} --${name}`).not.toMatch(/nebula/);
      }
    }
  });

  const surfaces = ['color-bg', 'color-surface', 'color-surface-alt'];
  for (const palette of PALETTE_IDS) {
    for (const theme of THEMES) {
      describe(`${palette}: .theme-${theme}`, () => {
        const r = (name: string) => resolve(name, theme, palette);

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
  }

  // The photograph palettes are other hues on purpose; the default keeps the owner's colour family.
  it('the default contains only warm neutrals, the titanium-copper family and the one dust violet', () => {
    for (const value of root.match(/#[0-9a-f]{6}\b/gi) ?? []) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      if (d < 24 || d / max <= 0.2) continue; // near-neutral
      let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hue = (hue * 60 + 360) % 360;
      expect((hue >= 12 && hue <= 40) || (hue >= 255 && hue <= 280), `${value} hue ${hue.toFixed(0)}`).toBe(true);
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

  it('applies exactly the non-default palettes before the first paint', () => {
    const ids = html.match(/\/\^\(([\w|]+)\)\$\//)?.[1]?.split('|');
    expect(ids).toEqual(PALETTE_IDS.filter((p) => p !== DEFAULT_PALETTE));
  });
});

// The Hero reads the live palette's slots (portraitColors in HeroPortrait.tsx); these engine
// defaults are the same mapping in the default palette.
describe('Particle Portrait colours', () => {
  it('clear to Void', () => {
    expect(hex(PORTFOLIO_BACKGROUND)).toBe(resolve('color-bg'));
  });

  it('ramp from Bronze to Ivory, with a Bronze to Desert Titanium highlight', () => {
    expect({
      low: hex(PORTFOLIO_PALETTE.low), high: hex(PORTFOLIO_PALETTE.high),
      accentLow: hex(PORTFOLIO_PALETTE.accentLow), accentHigh: hex(PORTFOLIO_PALETTE.accentHigh),
    }).toEqual({ low: resolve('p-edge'), high: resolve('p-paper'), accentLow: resolve('p-edge'), accentHigh: resolve('p-accent') });
  });
});
