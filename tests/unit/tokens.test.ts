import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PORTFOLIO_BACKGROUND, PORTFOLIO_PALETTE, type Rgb } from '../../src/features/particle-portrait';

// Parses the custom properties in tokens.css (resolving var() references) and checks every
// text/background pair the design allows against WCAG 2.2 (docs/DESIGN_SPEC.md §2.3).
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const raw = new Map([...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
const resolve = (name: string): string => {
  const value = raw.get(name);
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
const hex = ([r, g, b]: Rgb) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

describe('design tokens', () => {
  it('match the owner-specified brand palette exactly', () => {
    expect({
      moonlight: resolve('moonlight'), frost: resolve('frost-blue'), steel: resolve('steel'),
      storm: resolve('storm'), oxford: resolve('oxford-blue'),
    }).toEqual({ moonlight: '#f0ecdd', frost: '#8ba3c5', steel: '#495b7d', storm: '#23354d', oxford: '#02122f' });
  });

  it('use Oxford Blue as the background, Storm as the secondary surface and Moonlight as text', () => {
    expect([resolve('color-bg'), resolve('color-surface'), resolve('color-text')]).toEqual(['#02122f', '#23354d', '#f0ecdd']);
  });

  const surfaces = ['color-bg', 'color-surface', 'color-surface-alt'];
  for (const text of ['color-text', 'color-text-secondary', 'color-text-tertiary', 'color-link']) {
    for (const surface of surfaces) {
      it(`--${text} on --${surface} meets 4.5:1`, () => {
        expect(contrast(resolve(text), resolve(surface))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('--color-text on --color-interactive-fill (hovered buttons) meets 4.5:1', () => {
    expect(contrast(resolve('color-text'), resolve('color-interactive-fill'))).toBeGreaterThanOrEqual(4.5);
  });

  it('--color-on-focal on the primary button, at rest and hovered, meets 4.5:1', () => {
    expect(contrast(resolve('color-on-focal'), resolve('color-focal'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(resolve('color-on-focal'), resolve('color-focal-hover'))).toBeGreaterThanOrEqual(4.5);
  });

  for (const surface of surfaces) {
    it(`control outlines and the focus ring on --${surface} meet 3:1`, () => {
      expect(contrast(resolve('color-control-edge'), resolve(surface))).toBeGreaterThanOrEqual(3);
      expect(contrast(resolve('color-focus'), resolve(surface))).toBeGreaterThanOrEqual(3);
    });
  }

  it('the focus ring on --color-interactive-fill meets 3:1', () => {
    expect(contrast(resolve('color-focus'), resolve('color-interactive-fill'))).toBeGreaterThanOrEqual(3);
  });

  it('contains only near-neutral or cool blue colours (no botanical, gold, amber, crimson or cyan)', () => {
    for (const value of css.match(/#[0-9a-f]{6}\b/gi) ?? []) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      if (d < 24 || d / max <= 0.2) continue; // near-neutral
      let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hue = (hue * 60 + 360) % 360;
      expect(hue >= 205 && hue <= 235, `${value} hue ${hue.toFixed(0)}`).toBe(true);
    }
  });
});

describe('index.html', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  it('uses only token colours (theme-color and the no-JavaScript fallback)', () => {
    expect(html).toMatch(new RegExp(`name="theme-color" content="${resolve('color-bg')}"`, 'i'));
    const tokens = new Set([resolve('color-bg'), resolve('color-text')]);
    for (const value of html.match(/#[0-9a-f]{6}/gi) ?? []) expect(tokens.has(value.toLowerCase()), value).toBe(true);
  });
});

describe('Particle Portrait colours', () => {
  it('clear to Oxford Blue', () => {
    expect(hex(PORTFOLIO_BACKGROUND)).toBe(resolve('color-bg'));
  });

  it('ramp from Steel to Moonlight, with a Steel to Frost Blue highlight', () => {
    expect({
      low: hex(PORTFOLIO_PALETTE.low), high: hex(PORTFOLIO_PALETTE.high),
      accentLow: hex(PORTFOLIO_PALETTE.accentLow), accentHigh: hex(PORTFOLIO_PALETTE.accentHigh),
    }).toEqual({ low: resolve('steel'), high: resolve('moonlight'), accentLow: resolve('steel'), accentHigh: resolve('frost-blue') });
  });
});
