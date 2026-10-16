import { defineConfig, devices } from '@playwright/test';
import { LAB_URL, LEGACY_URL, SITE_URL } from './tests/e2e/urls';

// WebGL runs on SwiftShader so the suite is deterministic on machines and CI runners without a GPU.
const gpuArgs = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const desktop = { ...devices['Desktop Chrome'], channel: 'chromium', viewport: { width: 1440, height: 900 }, launchOptions: { args: gpuArgs } };
const mobile = {
  ...devices['Desktop Chrome'],
  channel: 'chromium',
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  launchOptions: { args: gpuArgs },
};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Software WebGL is CPU-bound: more workers than this starves each browser and causes timeouts.
  workers: 2,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  // No retries anywhere: a flaky test is a bug to find, not a result to hide.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Tracing snapshots the DOM on every action; against a page redrawing WebGL at 60 fps it starves
  // input handling and makes timing-sensitive tests fail. Failure screenshots are kept instead.
  use: { trace: 'off', screenshot: 'only-on-failure' },
  projects: [
    // The untouched original prototype: characterises its behaviour, known defects included.
    { name: 'legacy-desktop', testMatch: 'portrait-behaviour.spec.ts', use: { ...desktop, baseURL: LEGACY_URL } },
    { name: 'legacy-mobile', testMatch: 'portrait-behaviour.spec.ts', use: { ...mobile, baseURL: LEGACY_URL } },
    // The maintained engine in the development Portrait Lab: must pass everything.
    { name: 'lab-desktop', testMatch: /(portrait-behaviour|lab-lifecycle|parity|preview)\.spec\.ts/, use: { ...desktop, baseURL: LAB_URL } },
    { name: 'lab-mobile', testMatch: /(portrait-behaviour|parity)\.spec\.ts/, use: { ...mobile, baseURL: LAB_URL } },
    // The public site (Phase 2+). The production-build check runs against `vite preview` of dist/.
    { name: 'site-desktop', testMatch: 'site-shell.spec.ts', use: { ...desktop, baseURL: SITE_URL } },
    { name: 'site-mobile', testMatch: 'site-shell.spec.ts', use: { ...mobile, baseURL: SITE_URL } },
    // The full-viewport particle story renders continuously in software WebGL. Measured on 14 Oct
    // 2026 (hero + story specs, 108 runs each): 2 parallel workers took 12.4 min with 1 timeout;
    // 1 worker took 7.2 min with none. These projects therefore run one test at a time, while the
    // lighter projects above keep running in parallel. Their tests walk through several scroll
    // stages of a continuously rendering page (30-90 s each on a busy machine), so they get a
    // 120 s budget instead of 60 s. There are no retries: a hang or a wrong state still fails.
    { name: 'site-webgl-desktop', testMatch: /(hero|cinema)\.spec\.ts/, workers: 1, timeout: 120_000, use: { ...desktop, baseURL: SITE_URL } },
    { name: 'site-webgl-mobile', testMatch: /(hero|cinema)\.spec\.ts/, workers: 1, timeout: 120_000, use: { ...mobile, baseURL: SITE_URL } },
  ],
  webServer: [
    { command: 'node scripts/serve-static.mjs 4310', url: LEGACY_URL, reuseExistingServer: !process.env.CI },
    { command: 'npx vite', url: LAB_URL, reuseExistingServer: !process.env.CI },
    { command: 'npx vite preview', url: 'http://127.0.0.1:4312/', reuseExistingServer: !process.env.CI },
  ],
});
