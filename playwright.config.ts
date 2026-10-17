import { defineConfig, devices } from '@playwright/test'
import { VERCEL_BYPASS_STATE } from './e2e/vercelBypass'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const bypassPreview =
  !!process.env.PLAYWRIGHT_BASE_URL && !!process.env.VERCEL_AUTOMATION_BYPASS_SECRET

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/vercelBypass.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    storageState: bypassPreview ? VERCEL_BYPASS_STATE : undefined,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Preview runs pass PLAYWRIGHT_BASE_URL. Local runs serve the last
  // `npm run build`.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npx next start',
        url: `${baseURL}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
