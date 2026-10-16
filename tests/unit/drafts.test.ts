import { describe, expect, it } from 'vitest';
import { drafts } from '../../src/content/drafts';

describe('draft content', () => {
  it('lists every draft the owner still has to confirm', () => {
    const list = drafts();
    // Printed on every run, so the open drafts stay visible.
    console.info(`Drafts to confirm (${list.length}):\n${list.map((d) => `  · ${d.where}: ${d.note}`).join('\n')}`);
    expect(list.length).toBeGreaterThan(0);
    for (const d of list) expect(d.note.trim().length, d.where).toBeGreaterThan(10);
  });
});
