# Proof-of-Fandom Ticket 스마트 컨트랙트 명세

> 본 문서는 PoF Ticket 서비스를 GIWA Chain (Sepolia 테스트넷 → 메인넷) 위에서 동작시키기 위한 **스마트 컨트랙트 설계서**다. 기능 단위 흐름은 [`feature-spec.md`](./feature-spec.md)를, 컨셉은 [`proof-of-fandom-ticket-plan.md`](./proof-of-fandom-ticket-plan.md)를 참고한다.

---

## 1. 개요

PoF Ticket 컨트랙트는 다섯 개의 핵심 컴포넌트로 구성된다.

| 컨트랙트 | 표준 / 역할 |
|---|---|
| `BaseballTicketNFT` | ERC-721 기반 티켓 본체. 전송 제약, 상태 전이, 메타데이터 |
| `PrimaryTicketSale` | 1차 발행(구단 → 팬) 판매 컨트랙트. 정가/재고/좌석 잠금 관리 |
| `TicketTransferMarket` | 2차 양도(팬 ↔ 팬) 마켓. 가격 상한·검증·양도 마감 강제 |
| `FanCredentialSBT` | 시즌권/팬클럽/선예매 자격 등 양도 불가 토큰 (옵션) |
| `GateVerifier` | 입장 게이트의 서명·`markUsed` 권한 라우터 |

이들은 모두 GIWA Dojang의 [`OnchainVerifier`](https://docs.giwa.io/get-started/smart-contract/onchainverifiable)를 **공통 의존성**으로 가진다.

---

## 2. 컨트랙트 구조

```
                        ┌────────────────────────────┐
                        │   OnchainVerifier (GIWA)   │
                        │   isVerified(addr, atst)   │
                        └─────────────┬──────────────┘
                                      │ 모든 핵심 호출이 의존
   ┌──────────────────────────────────┼─────────────────────────┐
   │                                  │                         │
   ▼                                  ▼                         ▼
┌───────────────┐  mint(to,meta)  ┌────────────────────┐   ┌─────────────────┐
│PrimaryTicket  ├────────────────▶│ BaseballTicketNFT  │◀──┤  GateVerifier   │
│   Sale        │                 │   (ERC-721 + 제약) │   │ markUsed via    │
│  purchase()   │                 │  _update() 차단    │   │ 게이트 신호     │
│  refund()     │                 │  markUsed()        │   └─────────────────┘
└───────────────┘                 │  markPostponed()   │
                                  │  markVoided()      │
                                  │  freeze()          │
                                  └──────┬─────────────┘
                                         │ safeTransferFrom (마켓만 허용)
                                         ▼
                                  ┌────────────────────┐
                                  │TicketTransferMarket│
                                  │ list / cancel / buy│
                                  │ price <= faceValue │
                                  └────────────────────┘

   ┌──────────────────┐
   │ FanCredentialSBT │  (선예매 자격 확인을 PrimaryTicketSale이 옵션으로 사용)
   └──────────────────┘
```

---

## 3. 컨트랙트별 상세 설계

### 3.1 `BaseballTicketNFT` (ERC-721)

티켓의 본체. NFT 1개 = 좌석 1자리.

#### 메타데이터 구조

```solidity
struct TicketMeta {
    bytes32 gameId;        // 경기 식별자 (해시)
    bytes32 seatId;        // 구역+열+번호 해시
    uint64  startTime;     // unix seconds
    uint64  transferDeadline; // 양도 마감 (예: startTime - 2h)
    uint32  faceValue;     // 정가 (원)
    uint16  zoneCode;      // 구역 코드 (1루 내야, 응원지정 등)
    uint8   row;
    uint8   seat;
    uint8   maxTransfers;  // 최대 양도 횟수
    bool    reentryAllowed;
}

enum TicketStatus { Issued, Used, Postponed, Voided, Frozen }
```

#### 핵심 함수

```solidity
function mint(address to, TicketMeta calldata meta)
    external onlyRole(MINTER_ROLE) returns (uint256 tokenId);

function markUsed(uint256 tokenId, bytes32 gateId)
    external onlyRole(GATE_ROLE);

function markPostponed(bytes32 gameId, uint64 newStartTime)
    external onlyRole(OPERATOR_ROLE);

function markVoided(bytes32 gameId, string calldata reason)
    external onlyRole(OPERATOR_ROLE);

function freeze(uint256 tokenId) external onlyRole(OPERATOR_ROLE);
function unfreeze(uint256 tokenId) external onlyRole(OPERATOR_ROLE);

function tokenMeta(uint256 tokenId) external view returns (TicketMeta memory);
function tokenStatus(uint256 tokenId) external view returns (TicketStatus);
function transferCount(uint256 tokenId) external view returns (uint8);
```

#### 전송 제약 (가장 중요)

OpenZeppelin v5의 `_update` 훅을 오버라이드해서 **공식 마켓 외 전송을 모두 차단**한다.

```solidity
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address from)
{
    from = super._update(to, tokenId, auth);

    // 민팅(from==0)과 소각(to==0)은 통과
    if (from == address(0) || to == address(0)) return from;

    // 그 외 전송은 마켓 컨트랙트만 호출 가능
    if (!hasRole(MARKET_ROLE, msg.sender)) revert TransferNotAllowed();

    // 양수자 Verified Address 검증
    if (!verifier.isVerified(to, UPBIT_KOREA)) revert NotVerified(to);

    // 상태/마감/횟수 검증
    TicketMeta memory m = _meta[tokenId];
    if (_status[tokenId] != TicketStatus.Issued) revert WrongStatus();
    if (block.timestamp > m.transferDeadline) revert TransferWindowClosed();
    if (_transferCount[tokenId] + 1 > m.maxTransfers) revert TooManyTransfers();

    _transferCount[tokenId] += 1;
}
```

#### 이벤트

- `TicketMinted(uint256 tokenId, address indexed to, bytes32 gameId, bytes32 seatId, uint32 faceValue)`
- `TicketUsed(uint256 tokenId, address indexed owner, bytes32 gateId)`
- `TicketStatusChanged(uint256 tokenId, TicketStatus from, TicketStatus to)`

---

### 3.2 `PrimaryTicketSale` (1차 발행)

구단/예매처가 발행한 티켓을 검증된 팬에게 판매한다.

#### 좌석 인벤토리

```solidity
struct SeatListing {
    bytes32 gameId;
    bytes32 seatId;
    uint32  price;       // 정가
    uint16  zoneCode;
    uint8   row;
    uint8   seat;
    uint8   maxPerWallet;
    bool    requireFanSBT;  // 선예매 자격 필요 여부
}

mapping(bytes32 => SeatListing) internal _seats;       // seatKey => listing
mapping(bytes32 => address)    internal _seatHolder;   // 판매 후 소유자
mapping(bytes32 => uint64)     internal _seatLockedAt; // 트랜잭션 동안 잠금
```

#### 함수

```solidity
function registerSeats(SeatListing[] calldata listings)
    external onlyRole(INVENTORY_ROLE);

function purchase(bytes32 seatKey)
    external payable returns (uint256 tokenId);

function refund(uint256 tokenId) external;

function lockSeat(bytes32 seatKey, uint32 ttlSeconds)
    external returns (bytes32 lockId);
```

#### `purchase` 의 핵심 검증

```solidity
function purchase(bytes32 seatKey) external payable returns (uint256) {
    SeatListing memory s = _seats[seatKey];
    if (s.price == 0) revert SeatNotForSale();
    if (_seatHolder[seatKey] != address(0)) revert SeatTaken();

    // 1) 결제 금액 검증 (실거래 단계에서는 fiat 게이트웨이로 대체)
    if (msg.value != s.price) revert WrongAmount();

    // 2) Verified Address 검증
    if (!verifier.isVerified(msg.sender, UPBIT_KOREA))
        revert NotVerified(msg.sender);

    // 3) 1인 N매 제한
    if (_walletCount[s.gameId][msg.sender] + 1 > s.maxPerWallet)
        revert OverWalletLimit();

    // 4) 선예매 자격 (옵션)
    if (s.requireFanSBT && fanSBT.balanceOf(msg.sender) == 0)
        revert NoFanCredential();

    // 5) 민팅
    _seatHolder[seatKey] = msg.sender;
    _walletCount[s.gameId][msg.sender] += 1;

    return ticket.mint(msg.sender, _toMeta(s));
}
```

#### 환불

- 환불 가능 시점: 경기 시작 4시간 전까지 (운영자가 조정 가능).
- 호출 시 좌석 재오픈, NFT 소각, ETH(또는 KRW 게이트웨이) 환급.

#### 이벤트

- `SeatRegistered(bytes32 seatKey, bytes32 gameId, uint32 price)`
- `SeatPurchased(bytes32 seatKey, address indexed buyer, uint256 tokenId, uint32 price)`
- `SeatRefunded(uint256 tokenId, address indexed buyer)`

---

### 3.3 `TicketTransferMarket` (2차 양도)

#### 등록 정보

```solidity
struct Listing {
    address seller;
    uint32  price;       // 등록가 (정가 이하)
    uint64  listedAt;
    bool    active;
}

mapping(uint256 => Listing) public listings;  // tokenId => listing
```

#### 함수

```solidity
function list(uint256 tokenId, uint32 price) external;
function cancelListing(uint256 tokenId) external;
function buy(uint256 tokenId) external payable;
function priceCeilingOf(uint256 tokenId) public view returns (uint32);
```

#### `list` / `buy` 의 검증

```solidity
function list(uint256 tokenId, uint32 price) external {
    if (ticket.ownerOf(tokenId) != msg.sender) revert NotOwner();
    if (ticket.tokenStatus(tokenId) != TicketStatus.Issued) revert WrongStatus();
    if (price == 0 || price > priceCeilingOf(tokenId)) revert PriceTooHigh();

    listings[tokenId] = Listing(msg.sender, price, uint64(block.timestamp), true);
    emit TicketListed(tokenId, msg.sender, price);
}

function buy(uint256 tokenId) external payable {
    Listing memory l = listings[tokenId];
    if (!l.active) revert NotListed();
    if (msg.value != l.price) revert WrongAmount();

    if (!verifier.isVerified(msg.sender, UPBIT_KOREA))
        revert NotVerified(msg.sender);

    delete listings[tokenId];

    // ticket의 _update가 양수자 Verified + 양도 마감 + 횟수 검증을 다시 한 번 수행
    ticket.safeTransferFrom(l.seller, msg.sender, tokenId);

    (bool ok, ) = l.seller.call{value: msg.value}("");
    if (!ok) revert PayoutFailed();

    emit TicketTransferred(tokenId, l.seller, msg.sender, l.price);
}
```

#### 가격 상한 규칙

```solidity
function priceCeilingOf(uint256 tokenId) public view returns (uint32) {
    TicketMeta memory m = ticket.tokenMeta(tokenId);
    return m.faceValue; // 정책상 더 엄격하게: faceValue * 80 / 100 등 가능
}
```

#### 이벤트

- `TicketListed(uint256 tokenId, address indexed seller, uint32 price)`
- `TicketUnlisted(uint256 tokenId, address indexed seller)`
- `TicketTransferred(uint256 tokenId, address indexed from, address indexed to, uint32 price)`

---

### 3.4 `FanCredentialSBT` (옵션)

선예매 자격, 시즌권, 팬클럽 등급 등을 표현하는 양도 불가 토큰. ERC-5192 (Minimal Soulbound) 또는 단순 ERC-721 + `_update` 차단으로 구현.

```solidity
enum Credential { SeasonPass, FanClubGold, FanClubSilver, PreSaleA, PreSaleB }

function issue(address to, Credential c, uint64 expiresAt)
    external onlyRole(ISSUER_ROLE);

function revoke(uint256 tokenId) external onlyRole(ISSUER_ROLE);

function hasActive(address holder, Credential c) external view returns (bool);
```

전송 시도는 모두 revert. `PrimaryTicketSale.requireFanSBT == true` 좌석은 `hasActive(buyer, ...)`로 검증한다.

---

### 3.5 `GateVerifier`

게이트 단말이 `markUsed`를 직접 호출하면 키 관리가 위험하므로, GateVerifier가 **서명 기반 라우터** 역할을 한다.

#### 흐름

1. 운영자(공식 게이트 서버)가 EIP-712 서명을 생성: `{tokenId, ownerAtSign, expiry, nonce, gateId}`.
2. 게이트 단말은 이 서명을 받아 사용자 QR로 표시할 수도 있고, `redeem` 트랜잭션에 그대로 전달할 수도 있다.
3. `GateVerifier.redeem(...)` 가 서명 검증 후 `BaseballTicketNFT.markUsed(tokenId)` 호출.

```solidity
struct GatePass {
    uint256 tokenId;
    address ownerAtSign;
    uint64  expiry;
    bytes32 nonce;
    bytes32 gateId;
}

function redeem(GatePass calldata pass, bytes calldata signature) external {
    if (block.timestamp > pass.expiry) revert PassExpired();
    if (_usedNonce[pass.nonce]) revert NonceUsed();

    address signer = _recover712(pass, signature);
    if (!hasRole(GATE_SIGNER_ROLE, signer)) revert BadSigner();

    if (ticket.ownerOf(pass.tokenId) != pass.ownerAtSign) revert OwnerChanged();

    _usedNonce[pass.nonce] = true;
    ticket.markUsed(pass.tokenId, pass.gateId);
}

function rotateSigner(address oldSigner, address newSigner)
    external onlyRole(DEFAULT_ADMIN_ROLE);
```

#### 보안 포인트

- 서명 키는 HSM/KMS에 보관, `rotateSigner` 로 정기 교체.
- `nonce` 재사용 차단으로 한 QR이 두 번 사용되는 것 방지.
- `ownerAtSign` 체크로 서명 발급 후 다른 사람에게 양도된 토큰의 입장 차단.
- `expiry` 는 30~60초로 짧게 유지.

---

## 4. 권한 모델 (Roles)

`AccessControl` 기반 역할:

| Role | 누가 보유 | 권한 |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | 운영 멀티시그 | 역할 부여/회수, 컨트랙트 업그레이드 |
| `MINTER_ROLE` | `PrimaryTicketSale` | `BaseballTicketNFT.mint` |
| `MARKET_ROLE` | `TicketTransferMarket` | 2차 양도용 `safeTransferFrom` 호출 |
| `GATE_ROLE` | `GateVerifier` | `markUsed` |
| `OPERATOR_ROLE` | 구단/운영팀 | 우천 연기, 경기 취소, freeze/unfreeze |
| `INVENTORY_ROLE` | 구단 백오피스 | 좌석 등록/가격 변경 |
| `ISSUER_ROLE` | 팬 자격 발급팀 | `FanCredentialSBT` issue/revoke |
| `GATE_SIGNER_ROLE` | 게이트 서명 서버 | EIP-712 서명 발행자 |

---

## 5. GIWA 의존성

PoF Ticket 모든 컨트랙트는 다음 한 줄을 공유한다.

```solidity
IVerifier public constant verifier = IVerifier(0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9);

DojangAttesterId public constant UPBIT_KOREA = DojangAttesterId.wrap(
    0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034
);
```

> 위 주소/attesterId는 **GIWA Sepolia 테스트넷** 기준이며, 메인넷 배포 시 GIWA 공식 안내에 따라 교체한다.
> 참고: <https://docs.giwa.io/get-started/smart-contract/onchainverifiable>

---

## 6. 가스 / 성능

- ERC-721 storage 최적화: 핵심 필드를 한 슬롯에 packing (`uint64 + uint64 + uint32 + uint32 + ...`).
- 좌석 등록은 `registerSeats(SeatListing[])` 배치 호출.
- `markUsed`는 게이트 트래픽 피크에 대비해 GateVerifier가 큐잉 후 N개 묶어 배치 호출(별도 `markUsedBatch`).
- Flashblocks RPC(`pending` 태그)를 사용해 200ms 안에 UI 반영. 정식 확정은 일반 RPC로 후속 확인.

---

## 7. 배포 계획 (GIWA Sepolia)

| 단계 | 내용 |
|---|---|
| 0 | Foundry/Hardhat 프로젝트 셋업, `forge install OpenZeppelin/openzeppelin-contracts@v5.0.0` |
| 1 | `BaseballTicketNFT` 배포 → admin 멀티시그 등록 |
| 2 | `FanCredentialSBT` 배포 (옵션) |
| 3 | `PrimaryTicketSale` 배포, `MINTER_ROLE` 부여 |
| 4 | `TicketTransferMarket` 배포, `MARKET_ROLE` 부여 |
| 5 | `GateVerifier` 배포, `GATE_ROLE` 부여, 최초 서명자 등록 |
| 6 | 데모용 좌석 인벤토리 등록 (LG·두산 등 3경기) |
| 7 | 프론트엔드(`viem`/`wagmi`)에 컨트랙트 ABI·주소 주입 |
| 8 | 시연 시나리오 리허설 |

---

## 8. 프론트엔드 연동

현재 React + Vite 앱(`src/App.jsx`)의 모의 함수들을 다음과 같이 매핑한다.

| 현재 함수 | 연동 후 |
|---|---|
| `buySelectedSeat()` | `wagmi.writeContract(primarySale, 'purchase', [seatKey], { value })` |
| `acceptListing(id)` | `writeContract(market, 'buy', [tokenId], { value: price })` |
| `listOwnedTicket(tokenId)` | `writeContract(market, 'list', [tokenId, price])` |
| `useTicket(tokenId)` | gate-api fetch → 서명 받음 → `writeContract(gate, 'redeem', [pass, sig])` |
| Wallet chip 토글 | `wagmi.useAccount()` + GraphQL/RPC로 `isVerified` 조회 |
| Chain log | wagmi `useWaitForTransaction` 상태 매핑 |

권장 라이브러리: `wagmi` v2 + `viem` + `@tanstack/react-query`. WalletConnect 또는 GIWA Wallet 커넥터를 사용한다.

---

## 9. 테스트 전략

1. **단위 테스트 (Foundry)**
    - 미검증 주소가 `purchase` 호출 시 revert.
    - 마켓을 거치지 않은 `transferFrom`이 revert.
    - `list` 가격이 `faceValue` 초과 시 revert.
    - 양도 마감 시간 이후 `buy` revert.
    - `markUsed` 후 `list`/`buy`/`markUsed` 모두 revert.
2. **통합 테스트**
    - 시나리오: 구매 → 양도 등록 → 양수자 매수 → 입장 처리 → 재사용 시도 차단.
    - GateVerifier 서명 만료 / 다른 서명자 / nonce 재사용 케이스.
3. **퍼지 / 인바리언트 테스트**
    - 한 토큰의 `transferCount`가 절대 `maxTransfers`를 넘지 않음.
    - 한번 `Used`가 된 토큰은 어떤 경로로도 다시 `Issued`로 못 돌아옴.

---

## 10. 보안 고려사항

- **재진입 방지**: `buy`에서 `safeTransferFrom` 호출 전에 listings를 삭제(checks-effects-interactions). 출금은 `call` 사용 + 실패 시 revert.
- **권한 관리**: 모든 관리자 역할은 멀티시그가 보유. 단일 EOA 운영 금지.
- **시간 의존성**: `block.timestamp` 사용 — 운영자가 N시간 단위 정책을 사용하므로 ±15초 오차는 무시할 수 있음.
- **메타데이터 무결성**: NFT URI는 IPFS + content hash 사용. 좌석 메타데이터는 컨트랙트 storage에 직접 저장 (오프체인 의존 최소화).
- **업그레이드**: 초기에는 비업그레이드. 향후 변경 필요 시 OpenZeppelin Proxy(Transparent)로 전환, 메인넷 전에 결정.
- **취약 패턴 점검**: ERC-721 enumerable 미사용(가스 절감), `tx.origin` 미사용, `delegatecall` 미사용.

---

## 11. 파일 구조 제안 (별도 레포 또는 `/contracts`)

```
contracts/
├── interfaces/
│   ├── IVerifier.sol
│   └── ITicketNFT.sol
├── ticket/
│   ├── BaseballTicketNFT.sol
│   └── FanCredentialSBT.sol
├── sale/
│   └── PrimaryTicketSale.sol
├── market/
│   └── TicketTransferMarket.sol
├── gate/
│   └── GateVerifier.sol
├── libs/
│   └── DojangIds.sol
└── test/
    ├── BaseballTicketNFT.t.sol
    ├── PrimaryTicketSale.t.sol
    ├── TicketTransferMarket.t.sol
    └── GateVerifier.t.sol
```

---

## 12. 참고 링크

- GIWA Dojang: <https://docs.giwa.io/giwa-ecosystem/dojang>
- GIWA OnchainVerifier: <https://docs.giwa.io/get-started/smart-contract/onchainverifiable>
- GIWA Upbit Web3 Names (`up.id`): <https://docs.giwa.io/giwa-ecosystem/up-id>
- GIWA Flashblocks: <https://docs.giwa.io/network-information/flashblocks>
- OpenZeppelin ERC-721 v5: <https://docs.openzeppelin.com/contracts/5.x/erc721>
- EIP-712 Typed Data: <https://eips.ethereum.org/EIPS/eip-712>
