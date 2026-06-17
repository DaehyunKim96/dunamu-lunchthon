export const giwaSepolia = {
  id: 91342,
  name: 'GIWA Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rpc.giwa.io'],
    },
    flashblocks: {
      http: ['https://sepolia-rpc-flashblocks.giwa.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GIWA Sepolia Explorer',
      url: 'https://sepolia-explorer.giwa.io',
    },
  },
}

export const giwaDojang = {
  dojangScroll: '0xd5077b67dcb56cac8b270c7788fc3e6ee03f17b9',
  eas: '0x4200000000000000000000000000000000000021',
  upNameRegistry: '0x091d00004f21eb2fc30964a8a4995692d9b49628',
  attesters: {
    upbitKorea: '0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034',
    testnetFaucet: '0xaa92f8c143657dde575de430aecaea6ca91f2e6072339b16932d426895d8d678',
  },
}

export const pofTicketContracts = {
  ticket: import.meta.env.VITE_TICKET_ADDRESS || '',
  primarySale: import.meta.env.VITE_PRIMARY_SALE_ADDRESS || '',
  transferMarket: import.meta.env.VITE_TRANSFER_MARKET_ADDRESS || '',
  gateVerifier: import.meta.env.VITE_GATE_VERIFIER_ADDRESS || '',
  mockVerifier: import.meta.env.VITE_MOCK_VERIFIER_ADDRESS || '',
}
