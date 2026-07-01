import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration. Assumes the full stack is running at
 * http://localhost (docker compose up). Override via PLAYWRIGHT_BASE_URL.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
