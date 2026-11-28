import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: '../.venv/bin/python ../scripts/local_api.py',
          url: 'http://127.0.0.1:8787/v1/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      ],
});
