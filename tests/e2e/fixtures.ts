// The site plays its opening sequence once per tab. Tests that are not about the sequence start
// as a returning visitor in the same tab would: with the sequence already seen.
import { test as base } from '@playwright/test';

export { expect, type Page } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('portfolio:cinema', 'done');
      } catch {
        // about:blank and other opaque origins have no storage.
      }
    });
    await use(page);
  },
});
