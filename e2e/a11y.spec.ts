import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'

test('login page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('For approved brand partners only.')).toBeVisible()
  await expectNoSeriousA11yViolations(page)
})

test('apply page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/apply')
  await expect(page.getByText('Already have access?').first()).toBeVisible()
  await expectNoSeriousA11yViolations(page)
})

test('password reset page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/auth/update-password')
  await expect(page.locator('.auth-shell__panel')).toBeVisible()
  await expectNoSeriousA11yViolations(page)
})
