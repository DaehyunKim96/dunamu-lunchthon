import { createPublicClient, createWalletClient, custom, decodeEventLog, http, keccak256, stringToHex } from 'viem'

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

// 지갑에 GIWA Sepolia 네트워크를 추가/전환할 때 쓰는 EIP-3085 파라미터
export const GIWA_SEPOLIA_HEX = '0x164ce' // 91342
export const giwaAddChainParams = {
  chainId: GIWA_SEPOLIA_HEX,
  chainName: giwaSepolia.name,
  nativeCurrency: giwaSepolia.nativeCurrency,
  rpcUrls: giwaSepolia.rpcUrls.default.http,
  blockExplorerUrls: [giwaSepolia.blockExplorers.default.url],
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

/* ── Dojang 온체인 검증 (OnchainVerifier) ─────────────────────────
 * GIWA Dojang의 OnchainVerifier(=Dojang Scroll) 컨트랙트에서
 * isVerified(addr, attesterId) 를 읽어 "검증된 팬" 여부를 판단한다.
 * 배포 설정(contract/scripts/deploy.cjs)과 동일한 주소/attester를 사용.
 * docs: https://docs.giwa.io/get-started/smart-contract/onchainverifiable
 */
export const dojangVerifier = import.meta.env.VITE_VERIFIER_ADDRESS || giwaDojang.dojangScroll
export const upbitKoreaAttester = giwaDojang.attesters.upbitKorea
export const testnetFaucetAttester = giwaDojang.attesters.testnetFaucet

export const verifierAbi = [
  {
    type: 'function',
    name: 'isVerified',
    stateMutability: 'view',
    inputs: [
      { name: 'addr', type: 'address' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
  },
]

export const publicClient = createPublicClient({
  chain: giwaSepolia,
  transport: http(undefined, { timeout: 12_000, retryCount: 1 }),
})

// 실서비스 기준 attester는 Upbit Korea지만, GIWA Sepolia 테스트넷에서는
// GIWA Playground의 testnet faucet 플로우로 Dojang을 발급받는 경우가 많아
// 두 attester 중 하나라도 통과하면 "검증된 팬"으로 인정한다.
export async function checkDojangVerified(address) {
  const results = await Promise.all(
    [upbitKoreaAttester, testnetFaucetAttester].map((attesterId) =>
      publicClient
        .readContract({
          address: dojangVerifier,
          abi: verifierAbi,
          functionName: 'isVerified',
          args: [address, attesterId],
        })
        .catch(() => false)
    )
  )
  return results.some(Boolean)
}

/* ── 온체인 예매/양도 (실제 트랜잭션) ──────────────────────────
 * contract/scripts/register-demo-seats.cjs 가 등록한 좌석과 동일한 규칙으로
 * gameId/seatId/가격(원→wei)을 계산해 PrimaryTicketSale/TicketTransferMarket를
 * 직접 호출한다. 가격 환산은 1원 = 1e9 wei.
 */
export const KRW_TO_WEI = 1_000_000_000n
export const krwToWei = (krw) => BigInt(krw) * KRW_TO_WEI
export const idHash = (value) => keccak256(stringToHex(value))

export function getWalletClient(provider, account) {
  return createWalletClient({
    chain: giwaSepolia,
    transport: custom(provider),
    account,
  })
}

export function findEvent(abi, logs, eventName) {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics })
      if (decoded.eventName === eventName) return decoded
    } catch {
      // log belongs to a different event/contract; skip
    }
  }
  return null
}

export const primarySaleAbi = [
  {
    type: 'function',
    name: 'seatKeyOf',
    stateMutability: 'pure',
    inputs: [
      { name: 'gameId', type: 'bytes32' },
      { name: 'seatId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'purchase',
    stateMutability: 'payable',
    inputs: [{ name: 'seatKey', type: 'bytes32' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'SeatPurchased',
    inputs: [
      { name: 'seatKey', type: 'bytes32', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'priceWei', type: 'uint256', indexed: false },
    ],
  },
]

export const transferMarketAbi = [
  {
    type: 'function',
    name: 'list',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'priceWei', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'buy',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'TicketTransferred',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'priceWei', type: 'uint256', indexed: false },
    ],
  },
]
