import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BOTANICAL_BRANCH,
  BOTANICAL_UNIFORMS,
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

  it('changes nothing but the two colour insertions', () => {
    expect(VERTEX.replace(BOTANICAL_UNIFORMS, '').replace(BOTANICAL_BRANCH, '')).toBe(LEGACY_VERTEX);
    expect(FRAGMENT).toBe(LEGACY_FRAGMENT);
  });

  it('leaves the physics and point-size code untouched', () => {
    const physics = LEGACY_VERTEX.slice(LEGACY_VERTEX.indexOf('void main(){'), LEGACY_VERTEX.indexOf('float lum='));
    expect(VERTEX).toContain(physics);
  });

  it('avoids smoothstep with reversed edges (undefined in GLSL ES)', () => {
    for (const [, a, b] of BOTANICAL_BRANCH.matchAll(/smoothstep\(([\d.]+),([\d.]+),/g)) {
      expect(Number(a)).toBeLessThan(Number(b));
    }
  });
});
