# Proof-of-Fandom Ticket Contracts

GIWA Sepolia에서 한국 프로야구 티켓 예매, 정가 이하 양도, 입장 처리 흐름을 검증하기 위한 Solidity MVP입니다.

## 구성

- `BaseballTicketNFT`: 좌석 티켓 ERC-721. 마켓 외 전송 차단, Dojang 검증, 사용/동결 상태 관리.
- `PrimaryTicketSale`: 1차 좌석 판매. 구매자 Verified Address 확인 후 티켓 발급.
- `TicketTransferMarket`: 2차 양도. 정가 이하 가격과 Verified Address 수신자만 허용.
- `GateVerifier`: 짧은 수명의 EIP-712 게이트 패스를 검증하고 티켓을 사용 처리.
- `MockDojangVerifier`: GIWA Sepolia에서도 실제 KYC 없이 데모 트랜잭션을 만들기 위한 mock verifier.

## GIWA Sepolia 기본값

- Chain ID: `91342`
- RPC: `https://sepolia-rpc.giwa.io`
- Explorer: `https://sepolia-explorer.giwa.io`
- DojangScroll / OnchainVerifier: `0xd5077b67dcb56cac8b270c7788fc3e6ee03f17b9`
- UPBIT KOREA attester ID: `0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034`
- UPNameRegistry: `0x091d00004f21eb2fc30964a8a4995692d9b49628`

## 실행

```bash
cd contract
npm install
cp .env.example .env
npm run compile
npm test
```

Mock verifier로 GIWA Sepolia에 배포하면 실제 Dojang 인증 없이도 구매/양도/입장 트랜잭션을 확인할 수 있습니다.

```bash
USE_MOCK_VERIFIER=true npm run deploy:giwa
PRIMARY_SALE_ADDRESS=0x... npm run seed:giwa
```

실제 DojangScroll을 사용하려면 `USE_MOCK_VERIFIER=false`로 두고, 트랜잭션을 보내는 주소가 GIWA Sepolia에서 해당 attester의 Verified Address여야 합니다.

## 프론트엔드 연동 판단

현재 `frontend` 앱은 React state 기반 mock입니다. 이 contract MVP와 연결하려면 `viem` 또는 `wagmi`를 추가하고 다음 함수만 writeContract로 바꾸면 됩니다.

- `buySelectedSeat` -> `PrimaryTicketSale.purchase(seatKey, { value: priceWei })`
- `listOwnedTicket` -> `TicketTransferMarket.list(tokenId, priceWei)`
- `acceptListing` -> `TicketTransferMarket.buy(tokenId, { value: priceWei })`
- `useTicket` -> gate API가 서명한 `GatePass`를 받아 `GateVerifier.redeem(pass, signature)`

따라서 현재 구조에서 mock 시스템은 가능합니다. GIWA Sepolia 트랜잭션 확인도 가능하지만, 실제 Dojang 모드에서는 검증된 주소가 필요하고 mock verifier 모드에서는 배포자가 임의로 검증 상태를 부여할 수 있습니다.
