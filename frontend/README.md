# 직관 (JIKGWAN) — Frontend

> 검증된 팬만, 정가 그대로. — GIWA 블록체인 기반 KBO 검증 티켓 웹앱 (React + Vite)

```bash
npm install
npm run dev
```

## 주요 화면

- **예매** — KBO 경기 리스트(구단 엠블럼·날짜·배지) → 좌석맵 → 검증 후 정가 예매
- **양도** — 정가 이하로만 거래되는 안심 양도 마켓
- **내 컬렉션** — 예매·양도받은 입장권이 **구단별 한정판 NFT 카드**로 발급
  - tokenId 기반으로 구단 컬러·등번호·선수명·포지션·레어도(COMMON~LEGENDARY)·시리얼이 결정적으로 생성
  - 상위 레어도는 홀로그램 포일 효과, 카드 뒤집기로 입장용 LIVE QR 표시

현재 UI는 로컬 state로 예매·양도·입장을 시뮬레이션하는 mock입니다. GIWA Sepolia 연동 시
`src/contracts/giwaSepolia.js`의 주소 환경변수를 채우고 `viem`/`wagmi` writeContract 호출로
기존 handler를 교체하면 됩니다.
