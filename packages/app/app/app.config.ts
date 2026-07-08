export default defineAppConfig({
  evm: {
    title: 'BITS Collections',
    defaultChain: 'mainnet',
    ens: {
      mode: 'chain',
    },
    chains: {
      mainnet: {
        id: 1,
        blockExplorer: 'https://evm.now',
      },
    },
  },
})
