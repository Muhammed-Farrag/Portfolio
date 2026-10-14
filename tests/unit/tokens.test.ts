import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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

describe('design tokens', () => {
  it('match the owner-specified brand palette exactly', () => {
    expect({
      ivy: resolve('ivy'), moss: resolve('moss'), fern: resolve('fern'),
      plum: resolve('plum'), rose: resolve('rose'), crimson: resolve('crimson'),
    }).toEqual({ ivy: '#1d2b1e', moss: '#2f4a2e', fern: '#6a7f61', plum: '#3a2a35', rose: '#5b3a4a', crimson: '#7a0f1f' });
  });

  const surfaces = ['color-bg', 'color-surface', 'color-surface-alt', 'color-interactive-fill'];
  for (const text of ['color-text', 'color-text-secondary', 'color-text-tertiary', 'color-link']) {
    for (const surface of surfaces) {
      it(`--${text} on --${surface} meets 4.5:1`, () => {
        expect(contrast(resolve(text), resolve(surface))).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('--color-on-focal on --color-focal (primary button) meets 4.5:1', () => {
    expect(contrast(resolve('color-on-focal'), resolve('color-focal'))).toBeGreaterThanOrEqual(4.5);
  });

  for (const surface of surfaces) {
    it(`control outlines and the focus ring on --${surface} meet 3:1`, () => {
      expect(contrast(resolve('color-control-edge'), resolve(surface))).toBeGreaterThanOrEqual(3);
      expect(contrast(resolve('color-focus'), resolve(surface))).toBeGreaterThanOrEqual(3);
    });
  }

  it('contains no gold, amber, yellow or cyan colour', () => {
    for (const hex of css.match(/#[0-9a-f]{6}\b/gi) ?? []) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min < 24) continue; // near-neutral
      const d = max - min;
      let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hue = (hue * 60 + 360) % 360;
      const saturated = d / max > 0.35;
      expect(saturated && ((hue >= 30 && hue <= 70) || (hue >= 170 && hue <= 200)), `${hex} hue ${hue.toFixed(0)}`).toBe(false);
    }
  });
});
