import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Slot {
  slot: string;
  required: boolean;
  file: string | null;
  alt?: string;
  credit?: string;
  consent?: string;
  placeholder?: string;
}
interface Story {
  id: string;
  claimStatus: 'verified' | 'cv-reported' | 'pending' | 'excluded';
  renderInRelease: boolean;
  sources: string[];
  slots: Slot[];
}

const base = new URL('../../content-source/recognition/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', base), 'utf8')) as { stories: Story[] };

describe('recognition manifest', () => {
  it('only allows approved claims to render in release', () => {
    for (const story of manifest.stories.filter((s) => s.renderInRelease)) {
      expect(['verified', 'cv-reported'], story.id).toContain(story.claimStatus);
      expect(story.sources.length, story.id).toBeGreaterThan(0);
    }
  });

  it('never renders pending stories such as the unverified press coverage', () => {
    for (const story of manifest.stories.filter((s) => s.claimStatus === 'pending')) {
      expect(story.renderInRelease, story.id).toBe(false);
    }
  });

  it('points every supplied image at a real owner-supplied file with alt text and credit', () => {
    for (const story of manifest.stories) {
      for (const slot of story.slots.filter((s) => s.file)) {
        expect(existsSync(new URL(slot.file!, base)), slot.file!).toBe(true);
        expect(slot.alt?.length, slot.file!).toBeGreaterThan(20);
        expect(slot.credit, slot.file!).toBeTruthy();
        expect(slot.consent, slot.file!).toBe('owner-supplied');
      }
    }
  });

  it('describes every missing image so placeholders are explicit in development', () => {
    for (const story of manifest.stories) {
      for (const slot of story.slots.filter((s) => !s.file)) expect(slot.placeholder, `${story.id}/${slot.slot}`).toBeTruthy();
    }
  });
});
