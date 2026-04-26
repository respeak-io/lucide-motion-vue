import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright covers a deliberately small surface: the consumer-facing
 * interaction patterns that unit tests can't realistically exercise (real
 * browser hover/pointer event sequencing, real DOM event delegation through
 * Vue's renderer). Visual regression is intentionally NOT in scope — for
 * animated SVG paths it produces flaky baselines without commensurate value.
 *
 * Run with `pnpm test:e2e`. The webServer block boots a Vite instance against
 * the `tests/e2e/fixture/` page using the same source aliases the unit
 * tests do, so we don't need a `pnpm build` first.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm exec vite --config tests/e2e/vite.config.ts',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
