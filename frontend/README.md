# Proof-of-Fandom Ticket Frontend

React + Vite 기반 팬용 웹앱 mock입니다.

```bash
npm install
npm run dev
```

현재 UI는 로컬 state로 예매, 양도, 입장 처리를 시뮬레이션합니다. GIWA Sepolia 연동 시 `src/contracts/giwaSepolia.js`의 주소 환경변수를 채우고 `viem` 또는 `wagmi` writeContract 호출로 기존 handler를 교체하면 됩니다.
