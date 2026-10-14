import { defineConfig, devices } from '@playwright/test';
import { LAB_URL, LEGACY_URL } from './tests/e2e/urls';

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
  retries: process.env.CI ? 1 : 0,
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
  ],
  webServer: [
    { command: 'node scripts/serve-static.mjs 4310', url: LEGACY_URL, reuseExistingServer: !process.env.CI },
    { command: 'npx vite', url: LAB_URL, reuseExistingServer: !process.env.CI },
  ],
});
