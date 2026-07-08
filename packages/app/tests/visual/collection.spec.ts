import { expect, test } from '@playwright/test'

test('collection route renders the mint gallery shell', async ({ page }) => {
  await page.goto('/collections/drums-collection-1')

  await expect(page.getByRole('heading', { name: /Drums Collection 1/i }))
    .toBeVisible()
  await expect(page.getByRole('button', { name: /Thumbnail/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Live HTML/i })).toBeVisible()
})

test('mobile collection route keeps controls visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/collections/drums-collection-1')

  await expect(page.getByRole('button', { name: /Mint full set/i }))
    .toBeVisible()
  await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible()
})
