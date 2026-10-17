import { expect, test } from '@playwright/test'

test('login rejects an unknown email and password', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByText('For approved brand partners only.')).toBeVisible()
  await page.getByPlaceholder('you@brand.com').fill('not-a-partner@example.com')
  await page.getByPlaceholder('••••••••').fill('not-the-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await expect(page.getByText("That email and password don't match.")).toBeVisible({
    timeout: 20_000,
  })
})
