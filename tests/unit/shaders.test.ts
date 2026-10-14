import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MORPH_INSERT,
  OFFSET_INSERT,
  PALETTE_BRANCH,
  PALETTE_UNIFORMS,
  STORY_DECLARATIONS,
  FRAGMENT,
  LEGACY_FRAGMENT,
  LEGACY_VERTEX,
  VERTEX,
} from '../../src/features/particle-portrait/shaders';

const legacyJs = readFileSync(new URL('../../legacy/particle-portrait/portrait.js', import.meta.url), 'utf8');
const extract = (name: string) => {
  const match = legacyJs.match(new RegExp(`const ${name}=\`([^\`]*)\``)) ?? legacyJs.match(new RegExp(`${name}=\`([^\`]*)\``));
  if (!match) throw new Error(`${name} shader not found in legacy portrait.js`);
  return match[1];
};

describe('shaders', () => {
  it('keeps verbatim copies of the legacy shaders', () => {
    expect(LEGACY_VERTEX).toBe(extract('vertex'));
    expect(LEGACY_FRAGMENT).toBe(extract('fragment'));
  });

  const withoutInsertions = () =>
    [PALETTE_UNIFORMS, STORY_DECLARATIONS, MORPH_INSERT, OFFSET_INSERT, PALETTE_BRANCH].reduce((s, part) => s.replace(part, ''), VERTEX);

  it('changes nothing but the documented insertions', () => {
    expect(withoutInsertions()).toBe(LEGACY_VERTEX);
    expect(FRAGMENT).toBe(LEGACY_FRAGMENT);
  });

  it('leaves the physics and point-size code untouched', () => {
    const physics = LEGACY_VERTEX.slice(LEGACY_VERTEX.indexOf('void main(){'), LEGACY_VERTEX.indexOf('float lum='));
    expect(withoutInsertions()).toContain(physics);
  });

  it('takes the per-point seed from the original position, before the morph', () => {
    expect(VERTEX).toContain('float seed=rnd(p);p=mix(p,aTarget,uMorph);');
  });

  it('applies the framing offset after scaling and before projection', () => {
    expect(VERTEX).toContain('vec2 pixel=p*uScale;pixel+=uOffset;gl_Position=');
  });

  it('avoids smoothstep with reversed edges (undefined in GLSL ES)', () => {
    for (const [, a, b] of PALETTE_BRANCH.matchAll(/smoothstep\(([\d.]+),([\d.]+),/g)) {
      expect(Number(a)).toBeLessThan(Number(b));
    }
  });
});
