# 직관 (JIKGWAN) — Frontend

> 검증된 팬만, 정가 그대로. — GIWA 블록체인 기반 KBO 검증 티켓 웹앱 (React + Vite)

```bash
npm install
npm run dev
```

## 탭 구조

| 탭 | 설명 |
|----|------|
| **예매** | 구단 공식 발행 1차 티켓. 행의 `예매하기` → 좌석 선택 모달 → 온체인 결제 팝업(`PrimaryTicketSale.purchase()`)으로 NFT 발급 |
| **거래소** | 정가 이하 2차 양도(티켓베이 스타일). 필터 사이드바 + 매물 리스트 + 상세/구매 모달. `TicketTransferMarket` 에스크로로 온체인 정산 |
| **내 티켓** | 보유 입장권을 구단별 한정판 **NFT 카드**로 보관. 레어도 홀로그램, 카드 플립 LIVE QR |

## 지갑 연결 & Dojang 검증

- `window.ethereum`(EIP-1193)으로 실제 지갑을 연결하고, GIWA Sepolia(`chainId 91342`)로 자동 전환/추가합니다.
- GIWA Dojang `OnchainVerifier.isVerified(addr, UPBIT_KOREA)` 를 viem으로 **온체인 조회**해 검증 여부를 판단하고, 통과 시 `인증` 마크를 표시합니다.
- 검증·발권·양도 경로는 `src/contracts/giwaSepolia.js`(verifier 주소/attester/ABI), 연결 로직은 `src/useWallet.js` 참고.
- 지갑이 없는 리뷰 환경에서는 `?demo` 로 데모 계정 자동 진입, `?tab=market` 등으로 탭 딥링크가 가능합니다.

현재 매매·양도·결제는 로컬 state로 온체인 트랜잭션을 시뮬레이션하는 mock입니다. 컨트랙트 배포 후
`src/contracts/giwaSepolia.js` 주소를 채우고 `viem`/`wagmi` writeContract 호출로 교체하면 됩니다.
