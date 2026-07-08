import type {
  BitsActivityResponse,
  BitsCollectionResponse,
  BitsCollectionsResponse,
  BitsTokenResponse,
  BitsTokensResponse,
} from '@bits-collection/shared'

const TIMEOUT_MS = 8_000
const RETRIES = 2
const BACKOFF_MS = 400

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useBitsIndexer() {
  const config = useRuntimeConfig()
  const base = computed(() =>
    String(config.public.bits.indexerUrl).replace(/\/+$/, ''),
  )

  async function request(path: string) {
    let lastError: unknown

    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      if (attempt) await wait(BACKOFF_MS * attempt)

      const controller = new AbortController()
      const timer = globalThis.setTimeout(() => controller.abort(), TIMEOUT_MS)

      try {
        const response = await fetch(`${base.value}${path}`, {
          signal: controller.signal,
        })
        globalThis.clearTimeout(timer)

        if (response.status >= 500 && attempt < RETRIES) {
          lastError = new Error(`indexer ${path} -> ${response.status}`)
          continue
        }

        return response
      } catch (error) {
        globalThis.clearTimeout(timer)
        lastError = error
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`indexer ${path} unreachable`)
  }

  async function getJson<T>(path: string) {
    const response = await request(path)
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Indexer ${path} returned ${response.status}`,
      })
    }

    return (await response.json()) as T
  }

  return {
    listCollections: () => getJson<BitsCollectionsResponse>('/collections'),
    getCollection: (slug: string) =>
      getJson<BitsCollectionResponse>(
        `/collections/${encodeURIComponent(slug)}`,
      ),
    listTokens: (slug: string) =>
      getJson<BitsTokensResponse>(
        `/collections/${encodeURIComponent(slug)}/tokens`,
      ),
    getToken: (slug: string, tokenId: number) =>
      getJson<BitsTokenResponse>(
        `/collections/${encodeURIComponent(slug)}/tokens/${tokenId}`,
      ),
    getActivity: (slug: string, offset = 0, limit = 50) =>
      getJson<BitsActivityResponse>(
        `/collections/${encodeURIComponent(slug)}/activity?offset=${offset}&limit=${limit}`,
      ),
  }
}
