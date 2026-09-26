import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests for the public site. The API is mocked (e2e/mock-api.ts), so they run
 * without the backend or database — locally and in CI:   npm run e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4310',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npx ng serve --port 4310',
    url: 'http://localhost:4310',
    reuseExistingServer: !process.env['CI'],
    timeout: 240_000,
  },
});
