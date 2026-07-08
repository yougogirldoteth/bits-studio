export default defineAppConfig({
  evm: {
    title: 'bits',
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
