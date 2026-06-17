# Proof-of-Fandom Ticket

GIWA Chain 위에서 동작하는 한국 프로야구 검증 티켓 예매/양도 서비스 프로토타입입니다.

## 구조

- `frontend/` - React + Vite 기반 팬용 웹앱 mock
- `contract/` - GIWA Sepolia 배포를 목표로 한 Solidity/Hardhat contract MVP
- `docs/` - 기획서, 기능 명세, 스마트 컨트랙트 설계 문서

## Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

## Contract 실행

```bash
cd contract
npm install
cp .env.example .env
npm run compile
```

GIWA Sepolia 배포는 `contract/README.md`를 참고하세요.
