import { expect, test } from '@playwright/test'

test('root renders the configured primary collection', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Drums Collection 2', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
})

test('collections route renders the collection overview', async ({ page }) => {
  await page.goto('/collections')

  await expect(
    page.getByRole('heading', { name: 'Collections', exact: true }),
  ).toBeVisible()
  const collectionCard = page.getByRole('link', {
    name: /Drums Collection 1/i,
  })
  const secondCollectionCard = page.getByRole('link', {
    name: /Drums Collection 2/i,
  })
  await expect(collectionCard).toBeVisible()
  await expect(secondCollectionCard).toBeVisible()
  await expect(collectionCard).toHaveAttribute(
    'href',
    '/collections/drums-collection-1',
  )
  await expect(secondCollectionCard).toHaveAttribute(
    'href',
    '/collections/drums-collection-2',
  )
  await expect(page.getByText('View collection')).toHaveCount(0)
  await expect(
    page.getByText('Minting is live on Ethereum mainnet.'),
  ).toHaveCount(0)
  await collectionCard.click()
  await expect(page).toHaveURL(/\/collections\/drums-collection-1$/)
})

test('pending renderer tokens stay visible and disabled', async ({ page }) => {
  await page.goto('/collections/drums-collection-2')

  await expect(
    page.getByRole('heading', { name: 'Drums Collection 2', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.bits-token')).toHaveCount(16)
  await expect(page.locator('.bits-token[data-created="false"]')).toHaveCount(
    15,
  )
  await expect(
    page.getByRole('button', { name: 'Not created yet', exact: true }),
  ).toHaveCount(15)
  await expect(
    page.getByRole('button', { name: 'Not created yet', exact: true }).first(),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Tokens not created yet', exact: true }),
  ).toBeDisabled()
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
