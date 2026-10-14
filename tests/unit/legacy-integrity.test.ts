import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// MD5 of the files in D:\particle-portrait at import time (commit d03e93c). The reference copy
// must never change; defects are fixed in the maintained module instead.
const EXPECTED: Record<string, string> = {
  'index.html': '035c2fb325ee5eb0522a99f8b2c0b7d2',
  'portrait.js': 'dcf816b3d917391110801a7612e8252f',
  'portrait.png': 'e1c9d63ab914824fd4f239f7ea03f058',
  'README.md': '638c80049a21fc1c9b59b06d754c42a8',
};

describe('legacy reference prototype', () => {
  for (const [file, md5] of Object.entries(EXPECTED)) {
    it(`${file} is byte-identical to the original`, () => {
      const data = readFileSync(new URL(`../../legacy/particle-portrait/${file}`, import.meta.url));
      expect(createHash('md5').update(data).digest('hex')).toBe(md5);
    });
  }
});
