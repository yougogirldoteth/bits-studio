import { expect, test } from '@playwright/test'

test('collections route renders the collection overview', async ({ page }) => {
  await page.goto('/collections')

  await expect(
    page.getByRole('heading', { name: 'Collections', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Drums Collection 1/i }),
  ).toBeVisible()
})

test('collections route supports the light theme', async ({ page }) => {
  await page.goto('/collections')

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark', {
    timeout: 15_000,
  })
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(
    page.getByRole('link', { name: /Drums Collection 1/i }),
  ).toBeVisible()
})

test('collection route renders the mint gallery shell', async ({ page }) => {
  await page.goto('/collections/drums-collection-1')

  await expect(
    page.getByRole('heading', { name: /Drums Collection 1/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /View BITS contract/i }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /Thumbnail/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Live HTML/i })).toBeVisible()
})

test('mobile collection route keeps controls visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/collections/drums-collection-1')

  const mintFullSet = page.getByRole('button', {
    name: /Full sets sold out/i,
  })
  await expect(mintFullSet).toBeVisible()
  await expect(mintFullSet).toBeDisabled()
  await expect(page.getByRole('button', { name: /Refresh/i })).toHaveCount(0)
})
