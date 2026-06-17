import { useCallback, useEffect, useRef, useState } from 'react'
import { giwaSepolia, GIWA_SEPOLIA_HEX, giwaAddChainParams, checkDojangVerified } from './contracts/giwaSepolia'

const DEMO_ADDRESS = '0x7a91c0f3b2e84d6a1f5c9b7e0d3a2c14b8e64c21'

export function shortAddr(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const initialState = {
  status: 'disconnected', // disconnected | connecting | wrong-network | connected
  mode: null, // 'wallet' | 'demo'
  address: null,
  chainId: null,
  verified: null, // null = 미조회, true/false = 조회 결과
  verifying: false,
  handle: null, // up.id 등 사람이 읽는 이름 (없으면 null → 주소 표시)
  error: null,
}

export function useWallet() {
  const [state, setState] = useState(initialState)
  const patch = useCallback((next) => setState((prev) => ({ ...prev, ...next })), [])
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])

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
    const eth = typeof window !== 'undefined' ? window.ethereum : undefined
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
  }, [patch, runVerification])

  const connect = useCallback(async () => {
    const eth = typeof window !== 'undefined' ? window.ethereum : undefined
    if (!eth) {
      // 지갑이 없는 환경(리뷰/데모)에서는 데모 모드로 진입
      patch({ status: 'connected', mode: 'demo', address: DEMO_ADDRESS, chainId: giwaSepolia.id, verified: true, handle: 'minjun.up.id', error: null })
      return
    }
    patch({ status: 'connecting', mode: 'wallet', error: null })
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' })
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
      if (err?.code === 4001) patch({ status: 'disconnected', error: '지갑 연결을 취소했어요.' })
      else if (err?.code === -32002) patch({ status: 'disconnected', error: '지갑에서 이전 연결 요청을 확인해 주세요.' })
      else patch({ status: 'disconnected', error: '지갑 연결에 실패했어요.' })
    }
  }, [patch, runVerification])

  const enterDemo = useCallback(() => {
    patch({ status: 'connected', mode: 'demo', address: DEMO_ADDRESS, chainId: giwaSepolia.id, verified: true, handle: 'minjun.up.id', error: null })
  }, [patch])

  const disconnect = useCallback(() => setState(initialState), [])

  const recheck = useCallback(() => {
    if (state.mode === 'wallet' && state.address) runVerification(state.address)
  }, [state.mode, state.address, runVerification])

  // 계정/네트워크 변경 구독
  useEffect(() => {
    const eth = typeof window !== 'undefined' ? window.ethereum : undefined
    if (!eth?.on) return undefined
    const onAccounts = (accounts) => {
      if (!accounts?.length) {
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
    eth.on('accountsChanged', onAccounts)
    eth.on('chainChanged', onChain)
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts)
      eth.removeListener?.('chainChanged', onChain)
    }
  }, [state.mode, state.address, patch, runVerification])

  return { ...state, connect, disconnect, enterDemo, recheck, switchNetwork, hasInjectedWallet: typeof window !== 'undefined' && Boolean(window.ethereum) }
}
