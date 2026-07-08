export default defineNuxtConfig({
  extends: ['@1001-digital/layers.evm'],

  css: ['~/assets/css/theme.css'],

  devtools: {
    enabled: true,
  },

  devServer: {
    host: process.env.NUXT_DEV_HOST ?? '127.0.0.1',
    port: Number(process.env.NUXT_DEV_PORT ?? 3010),
  },

  vite: {
    optimizeDeps: {
      include: ['viem'],
    },
  },

  app: {
    head: {
      title: 'BITS Collections',
      meta: [
        {
          name: 'description',
          content: 'Reusable mint and gallery frontend for BITS collections.',
        },
        { property: 'og:title', content: 'BITS Collections' },
        {
          property: 'og:description',
          content: 'Reusable mint and gallery frontend for BITS collections.',
        },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      bits: {
        indexerUrl:
          process.env.NUXT_PUBLIC_BITS_INDEXER_URL ?? 'http://localhost:42069',
        indexerChain: process.env.NUXT_PUBLIC_BITS_INDEXER_CHAIN ?? 'mainnet',
      },
      evm: {
        walletConnectProjectId:
          process.env.NUXT_PUBLIC_EVM_WALLET_CONNECT_PROJECT_ID ?? '',
        chains: {
          mainnet: {
            rpcs:
              process.env.NUXT_PUBLIC_EVM_CHAINS_MAINNET_RPCS ??
              'https://eth.drpc.org',
          },
        },
      },
    },
  },

  compatibilityDate: '2026-07-08',
})
