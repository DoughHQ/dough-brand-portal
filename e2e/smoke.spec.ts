import { expect, test } from '@playwright/test'
import { signIn } from './signIn'

test.beforeEach(async ({ page }) => {
  await signIn(page)
})

test('brand home loads', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(
    page
      .getByRole('heading', { name: 'Open studies' })
      .or(page.getByRole('heading', { name: 'Platform home' })),
  ).toBeVisible()
})

test('product facets editor opens', async ({ page }) => {
  await page.goto('/products')
  const facetLink = page.locator('a[href*="tab=facets"]').first()
  test.skip((await facetLink.count()) === 0, 'This account has no product to open.')
  await facetLink.click()
  await expect(page.getByRole('heading', { name: 'Facets' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'You can add' })).toBeVisible()
})

test('new concept study opens without publishing', async ({ page }) => {
  await page.goto('/studies/new')
  await expect(page.getByRole('heading', { name: 'New study' })).toBeVisible()
  await page.getByRole('link', { name: /Concept test/ }).click()
  await expect(page).toHaveURL(/\/studies\/concept\/new/)
  await expect(page.getByRole('heading', { name: 'Concept study' })).toBeVisible()
})

test('admin compare group editor opens without saving', async ({ page }) => {
  await page.goto('/admin/compare-groups')
  test.skip(page.url().includes('/dashboard'), 'Signed-in user is not a dough admin.')
  await expect(page.getByRole('heading', { name: 'Compare Groups' })).toBeVisible()

  const groupLink = page.locator('a[href^="/admin/compare-groups/"]').first()
  test.skip((await groupLink.count()) === 0, 'No compare group to open.')
  await groupLink.click()
  await page.getByRole('button', { name: 'Edit details' }).click()
  await expect(page.getByRole('heading', { name: 'Edit details' })).toBeVisible()
})
