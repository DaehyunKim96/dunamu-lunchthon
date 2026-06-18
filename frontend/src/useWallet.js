import { useCallback, useEffect, useRef, useState } from 'react'
import { giwaSepolia, GIWA_SEPOLIA_HEX, giwaAddChainParams, checkDojangVerified } from './contracts/giwaSepolia'

const CONNECT_TIMEOUT_MS = 30_000
export const METAMASK_INSTALL_URL = 'https://metamask.io/download/'

export function shortAddr(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const initialState = {
  status: 'disconnected', // disconnected | connecting | wrong-network | connected
  mode: null, // 'wallet'
  address: null,
  chainId: null,
  verified: null, // null = 미조회, true/false = 조회 결과
  verifying: false,
  handle: null, // up.id 등 사람이 읽는 이름 (없으면 null → 주소 표시)
  error: null,
}

// EIP-6963: 여러 지갑 확장(Coinbase Wallet, Brave Wallet, Phantom 등)이 같이 설치돼
// window.ethereum이 MetaMask가 아닌 다른 지갑을 가리키는 경우가 흔하다.
// 표준 announce 이벤트로 설치된 지갑 목록을 모아 MetaMask를 명시적으로 골라낸다.
function discoverProviders(waitMs = 250) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve([])
    const found = []
    const onAnnounce = (event) => {
      if (event.detail?.provider) found.push(event.detail)
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    window.setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      resolve(found)
    }, waitMs)
  })
}

function pickMetaMask(announced, legacyEth) {
  const byRdns = announced.find((p) => p.info?.rdns === 'io.metamask')
  if (byRdns) return byRdns.provider
  const byName = announced.find((p) => /metamask/i.test(p.info?.name || ''))
  if (byName) return byName.provider
  if (legacyEth?.providers?.length) {
    const legacy = legacyEth.providers.find((p) => p.isMetaMask)
    if (legacy) return legacy
  }
  if (legacyEth?.isMetaMask) return legacyEth
  return null
}

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' })), ms)
  })
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer))
}

export function useWallet() {
  const [state, setState] = useState(initialState)
  const [provider, setProvider] = useState(null)
  const patch = useCallback((next) => setState((prev) => ({ ...prev, ...next })), [])
  const mounted = useRef(true)
  // StrictMode(개발 모드)는 마운트 시 effect를 mount→cleanup→mount로 한 번 더 실행한다.
  // cleanup만 false로 두면 그 다음 진짜 마운트에서 true로 복구되지 않아
  // 이후의 모든 patch()가 영구히 무시되는 버그가 생긴다 (검증이 "확인 중"에 멈춤).
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const runVerification = useCallback(
    async (address) => {
      patch({ verifying: true, error: null })
      try {
        const ok = await checkDojangVerified(address)
        if (mounted.current) patch({ verified: Boolean(ok), verifying: false })
        return Boolean(ok)
      } catch (err) {
        if (mounted.current) patch({ verified: null, verifying: false, error: '검증 조회에 실패했어요. 네트워크를 확인해 주세요.' })
        return null
      }
    },
    [patch]
  )

  const isGiwa = (hexId) => String(hexId).toLowerCase() === GIWA_SEPOLIA_HEX

  // 네트워크 전환/추가는 연결과 분리해서 별도 버튼으로 처리한다 (블로킹 방지)
  const switchNetwork = useCallback(async () => {
    const eth = provider
    if (!eth) return
    try {
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: GIWA_SEPOLIA_HEX }] })
      } catch (switchErr) {
        const code = switchErr?.code ?? switchErr?.data?.originalError?.code
        if (code === 4902 || code === -32603) {
          await eth.request({ method: 'wallet_addEthereumChain', params: [giwaAddChainParams] })
        } else {
          throw switchErr
        }
      }
      const accounts = await eth.request({ method: 'eth_accounts' })
      const address = accounts?.[0]
      if (address) {
        patch({ status: 'connected', mode: 'wallet', address, chainId: giwaSepolia.id, error: null })
        runVerification(address)
      }
    } catch (err) {
      patch({ error: 'GIWA Sepolia 네트워크 전환을 승인해 주세요.' })
    }
  }, [provider, patch, runVerification])

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return
    patch({ status: 'connecting', mode: 'wallet', error: null })
    const announced = await discoverProviders()
    const eth = pickMetaMask(announced, window.ethereum)
    if (!eth) {
      patch({ status: 'disconnected', mode: null, error: 'MetaMask를 찾을 수 없어요. 설치 후 새로고침해 주세요.' })
      return
    }
    setProvider(eth)
    try {
      const accounts = await withTimeout(eth.request({ method: 'eth_requestAccounts' }), CONNECT_TIMEOUT_MS)
      const address = accounts?.[0]
      if (!address) throw new Error('NO_ACCOUNT')
      // 계정만 확보되면 바로 연결 완료로 전환 (네트워크 전환은 블로킹하지 않음)
      const chainHex = await eth.request({ method: 'eth_chainId' })
      if (isGiwa(chainHex)) {
        patch({ status: 'connected', mode: 'wallet', address, chainId: giwaSepolia.id, handle: null })
        runVerification(address)
      } else {
        patch({ status: 'wrong-network', mode: 'wallet', address, chainId: parseInt(chainHex, 16), handle: null, verified: null })
      }
    } catch (err) {
      if (err?.code === 4001) patch({ status: 'disconnected', error: 'MetaMask 연결을 취소했어요.' })
      else if (err?.code === -32002) patch({ status: 'disconnected', error: 'MetaMask 확장 아이콘을 눌러 대기 중인 연결 요청을 확인해 주세요.' })
      else if (err?.code === 'TIMEOUT') patch({ status: 'disconnected', error: 'MetaMask 응답이 없어요. 브라우저 툴바의 확장 아이콘을 눌러 팝업을 확인해 주세요.' })
      else patch({ status: 'disconnected', error: 'MetaMask 연결에 실패했어요.' })
    }
  }, [patch, runVerification])

  const disconnect = useCallback(() => {
    setProvider(null)
    setState(initialState)
  }, [])

  const recheck = useCallback(() => {
    if (state.mode === 'wallet' && state.address) runVerification(state.address)
  }, [state.mode, state.address, runVerification])

  // 계정/네트워크 변경 구독 (connect()에서 고른 provider 기준)
  useEffect(() => {
    if (!provider?.on) return undefined
    const onAccounts = (accounts) => {
      if (!accounts?.length) {
        setProvider(null)
        setState(initialState)
      } else if (state.mode === 'wallet') {
        patch({ address: accounts[0], verified: null })
        runVerification(accounts[0])
      }
    }
    const onChain = (hexId) => {
      if (state.mode !== 'wallet') return
      if (String(hexId).toLowerCase() === GIWA_SEPOLIA_HEX) {
        patch({ status: 'connected', chainId: parseInt(hexId, 16) })
        if (state.address) runVerification(state.address)
      } else {
        patch({ status: 'wrong-network', chainId: parseInt(hexId, 16), verified: null })
      }
    }
    provider.on('accountsChanged', onAccounts)
    provider.on('chainChanged', onChain)
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts)
      provider.removeListener?.('chainChanged', onChain)
    }
  }, [provider, state.mode, state.address, patch, runVerification])

  return {
    ...state,
    provider,
    connect,
    disconnect,
    recheck,
    switchNetwork,
    hasInjectedWallet: typeof window !== 'undefined' && Boolean(window.ethereum),
  }
}
