import { expect, test, type Page } from '@playwright/test'

export async function signIn(page: Page): Promise<void> {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  test.skip(
    !email || !password,
    'Set E2E_EMAIL and E2E_PASSWORD to run signed-in smoke.',
  )

  await page.goto('/login')
  await page.getByPlaceholder('you@brand.com').fill(email ?? '')
  await page.getByPlaceholder('••••••••').fill(password ?? '')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })
}
