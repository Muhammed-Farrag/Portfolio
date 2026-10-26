// The site's tests import `test` and `expect` from here, so a shared setup has one place to live.
// (Until v3 this skipped the opening film; the site no longer has one.)
export { expect, test, type Page } from '@playwright/test';
