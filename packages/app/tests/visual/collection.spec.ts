import { expect, test } from '@playwright/test'

test('root renders the configured primary collection', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Drums Collection 2', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
})

test('collection open graph image supports crawler HEAD requests', async ({
  request,
}) => {
  const response = await request.head('/og/collections/drums-collection-2', {
    headers: { 'user-agent': 'Twitterbot/1.0' },
  })

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe('image/png')
})

test('live token HTML loads on demand', async ({ page }) => {
  await page.goto('/collections/drums-collection-2')

  await expect(page.locator('.bits-token iframe')).toHaveCount(0)
  await page.getByRole('button', { name: 'Live HTML' }).click()
  await expect(page.locator('.bits-token iframe')).toHaveCount(16)
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

test('inactive collection tokens stay visible and disabled', async ({
  page,
}) => {
  await page.goto('/collections/drums-collection-2')

  await expect(
    page.getByRole('heading', { name: 'Drums Collection 2', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.bits-token')).toHaveCount(16)
  const tokenButtons = page.locator('.bits-token__footer .bits-button')
  await expect(tokenButtons).toHaveCount(16)

  for (const button of await tokenButtons.all()) {
    await expect(button).toBeDisabled()
  }

  await expect(page.locator('.bits-button--mint-set')).toBeDisabled()
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

  const collectionsLink = page.getByRole('link', {
    name: 'Collections',
    exact: true,
  })
  const connectButton = page.getByRole('button', {
    name: 'Connect',
    exact: true,
  })
  const collectionsBox = await collectionsLink.boundingBox()
  const connectBox = await connectButton.boundingBox()
  const brandBox = await page.locator('.bits-brand').boundingBox()
  const walletBox = await page.locator('.bits-wallet').boundingBox()

  expect(collectionsBox).not.toBeNull()
  expect(connectBox).not.toBeNull()
  expect(brandBox).not.toBeNull()
  expect(walletBox).not.toBeNull()
  expect(collectionsBox!.y + collectionsBox!.height).toBeLessThanOrEqual(
    connectBox!.y,
  )
  expect(
    Math.abs(
      brandBox!.y +
        brandBox!.height / 2 -
        (walletBox!.y + walletBox!.height / 2),
    ),
  ).toBeLessThan(1)

  const mintFullSet = page.getByRole('button', {
    name: /Full sets sold out/i,
  })
  await expect(mintFullSet).toBeVisible()
  await expect(mintFullSet).toBeDisabled()
  await expect(page.getByRole('button', { name: /Refresh/i })).toHaveCount(0)
})
