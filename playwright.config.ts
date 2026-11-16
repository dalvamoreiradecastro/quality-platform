import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: isCI ? [['blob'], ['github'], ['list']] : [['html', { open: 'never' }], ['list']],

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-test',
  },

  projects: [
    // ---------- API ----------
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: env.API_BASE_URL,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },

    // ---------- UI: autenticação reutilizada entre testes ----------
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.ts/,
      use: { baseURL: env.UI_BASE_URL },
    },
    {
      name: 'e2e-chromium',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], baseURL: env.UI_BASE_URL },
    },
    {
      name: 'e2e-firefox',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'], baseURL: env.UI_BASE_URL },
    },

    // ---------- Acessibilidade ----------
    {
      name: 'a11y',
      testDir: './tests/a11y',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], baseURL: env.UI_BASE_URL },
    },
  ],
});
