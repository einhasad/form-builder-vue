import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const LOCAL_BASE_URL = `http://127.0.0.1:${PORT}`

// When PLAYWRIGHT_BASE_URL is set (e.g. the live GH Pages URL) we skip the
// local dev server entirely and run the same e2e suite against that origin.
const overrideBaseUrl = process.env['PLAYWRIGHT_BASE_URL']
const baseURL = overrideBaseUrl ?? LOCAL_BASE_URL

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/*external*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(overrideBaseUrl
    ? {}
    : {
        webServer: {
          command: `npm run demo:dev -- --host 127.0.0.1 --port ${PORT} --strictPort`,
          url: LOCAL_BASE_URL,
          reuseExistingServer: !process.env['CI'],
          stdout: 'ignore',
          stderr: 'pipe',
          timeout: 120_000,
        },
      }),
})
