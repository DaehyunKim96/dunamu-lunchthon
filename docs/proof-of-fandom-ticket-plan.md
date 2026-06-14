# Proof-of-Fandom Ticket 기획서

## 1. 프로젝트 요약

**Proof-of-Fandom Ticket**은 한국 프로야구 티켓을 GIWA Chain 위의 검증 가능한 디지털 티켓으로 발급하고, 검증된 팬끼리만 정가 이하로 안전하게 양도할 수 있게 하는 예매/양도 시스템이다.

핵심 가설은 단순하다.

- 티켓 구매자는 **Verified Address**여야 한다.
- 티켓은 경기, 좌석, 정가, 사용 상태가 붙은 온체인 티켓 NFT로 발급한다.
- 팬 자격/계정명은 **SBT 성격의 up.id**로 표현한다.
- 양도는 컨트랙트가 허용하는 조건에서만 가능하다.
- 입장 게이트는 현재 온체인 소유자에게만 짧은 수명의 QR/바코드를 발급한다.

이렇게 하면 기존 모바일티켓의 편의성은 유지하면서도, 봇 구매, 암표, 무단 재양도, 캡처 이미지 입장 같은 문제를 줄일 수 있다.

## 2. 리서치 요약

### KBO 예매 구조

KBO 공식 `티켓 안내` 페이지 기준, KBO 리그 티켓 예매는 중앙 단일 시스템이 아니라 구단/예매처별로 나뉜다.

| 예매처 | KBO 공식 페이지에 표시된 구단 |
|---|---|
| 티켓링크 | LG, 한화, 삼성, KT, KIA |
| 인터파크/NOL 티켓 | 두산, 키움 |
| 구단 자체예매 | SSG, 롯데, NC |

출처: [KBO 티켓 안내](https://www.koreabaseball.com/Kbo/League/Map.aspx)

인터파크 스포츠 페이지는 야구 카테고리에서 두산 베어스와 키움 히어로즈를 구단 선택/빠른예매 대상으로 노출한다. 출처: [NOL 티켓 스포츠 예매](https://ticket.interpark.com/Contents/Sports)

### 예매/수령/취소 방식에서 확인한 제약

키움 히어로즈 티켓 안내에는 다음 흐름이 명시되어 있다.

- 경기 7일 전 14시부터 경기 시작 4시간 전까지 예매/취소 가능
- 웹 예매 시 모바일 티켓 선택 불가, 현장 수령만 가능
- 모바일 예매는 인터파크 티켓 모바일 앱에서 진행
- 모바일 티켓은 당일 경기 시작 2시간 전부터 입장 가능
- 모바일 티켓 캡처 또는 이미지는 입장 불가
- 모바일 티켓 선물하기 기능을 사용한 경우, 선물받은 티켓이 반납되기 전에는 취소 불가
- 모바일 티켓은 종이 티켓으로 발권 불가

출처: [키움 히어로즈 일반티켓 안내](http://www.heroesbaseball.co.kr/ticket/normal/view.do)

티켓링크의 스마트티켓 안내도 유사한 방향이다. 스마트티켓은 앱에서 직접 발권한 바코드로 입장하며, 선물 완료 후 또는 입장 완료 후에는 예매취소가 제한된다. 출처: [티켓링크 프로야구](https://www.ticketlink.co.kr/sports/baseball)

### 현재 방식의 문제

1. **예매처가 분산되어 팬 경험이 끊긴다.**  
   티켓링크, 인터파크, 구단 자체예매가 섞여 있어 티켓 소유/양도/취소 경험이 표준화되지 않는다.

2. **본인 인증은 플랫폼 안에 갇힌다.**  
   특정 예매처에서 인증된 사용자라는 사실을 다른 구단, 다른 지갑, 다른 dApp이 신뢰하기 어렵다.

3. **양도 상태와 가격 규칙이 투명하지 않다.**  
   모바일 티켓 선물하기는 편하지만, 양도 이력, 실제 소유자, 가격 상한, 재양도 횟수 같은 정책을 공개적으로 검증하기 어렵다.

4. **입장권 캡처/이미지 대응이 운영사별로 다르다.**  
   움직이는 바코드나 앱 내 바코드를 요구하지만, 이 역시 중앙 서버 정책에 의존한다.

## 3. GIWA Chain을 써야 하는 이유

GIWA의 장점은 이 서비스와 직접 맞물린다.

| GIWA 기능 | 티켓 서비스에서의 활용 |
|---|---|
| Dojang | 오프체인 고객확인 정보를 온체인 attestation으로 연결 |
| Verified Address | 검증된 지갑만 티켓 구매/양도/수령 가능 |
| OnchainVerifier | 컨트랙트에서 `isVerified(address, attesterId)`로 검증 여부 확인 |
| Upbit Web3 Names | `username.up.id`로 팬과 양도 상대를 사람이 읽을 수 있게 표시 |
| SBT 구조 | 팬 ID/멤버십/티켓 자격을 양도 불가능한 형태로 표현 |
| Flashblocks | 예매/양도 트랜잭션 결과를 최대 200ms preconfirmation UX로 표시 |
| EVM 호환성 | Solidity ERC721/마켓플레이스 패턴을 빠르게 구현 |

출처:

- [GIWA Dojang](https://docs.giwa.io/giwa-ecosystem/dojang)
- [GIWA OnchainVerifiable](https://docs.giwa.io/get-started/smart-contract/onchainverifiable)
- [GIWA Upbit Web3 Names](https://docs.giwa.io/giwa-ecosystem/up-id)
- [GIWA Flashblocks](https://docs.giwa.io/network-information/flashblocks)

## 4. 제품 컨셉

### 이름

**Proof-of-Fandom Ticket**

### 대상 사용자

- 인기 경기 예매를 자주 하는 KBO 팬
- 티켓 양도를 안전하게 받고 싶은 팬
- 암표와 부정 입장을 줄이고 싶은 구단/운영사
- 티켓 소유권과 입장 상태를 검증해야 하는 경기장 운영팀

### 핵심 가치 제안

- 팬은 `username.up.id`만 보고 검증된 상대에게 안전하게 티켓을 양도받는다.
- 구단은 재판매 가격 상한, 양도 횟수, 양도 마감시간을 컨트랙트로 강제한다.
- 운영사는 현장 입장 시 현재 온체인 소유자만 유효 QR을 받을 수 있게 한다.
- GIWA의 Dojang/Verified Address가 있어 개인정보를 공개하지 않고도 신뢰 기반 티켓팅이 가능하다.

## 5. 핵심 기능

### 5.1 검증 팬 온보딩

1. 사용자가 GIWA Wallet 또는 EVM 지갑을 연결한다.
2. 앱이 Dojang `Verified Address` attestation을 확인한다.
3. `username.up.id`가 있으면 프로필에 표시한다.
4. 미검증 주소는 좌석 선택은 볼 수 있지만 예매/양도 수락은 불가능하다.

### 5.2 티켓 예매

1. 팬이 경기와 좌석을 선택한다.
2. 결제 전 컨트랙트가 구매자 주소의 검증 여부를 확인한다.
3. 예매 완료 시 `BaseballTicketNFT`가 발급된다.
4. NFT에는 `gameId`, `seatId`, `faceValue`, `section`, `row`, `seat`, `startTime`, `used`가 연결된다.
5. UI는 Flashblocks RPC를 활용해 예매 반영 상태를 즉시 보여준다.

### 5.3 티켓 양도

양도는 자유 전송이 아니라 공식 마켓 컨트랙트를 통해서만 가능하게 한다.

정책 예시:

- 수신자도 Verified Address여야 한다.
- 판매가는 정가 이하만 허용한다.
- 경기 시작 N시간 전 이후 양도 금지.
- 티켓당 양도 횟수 제한.
- 입장 완료 티켓은 양도 불가.
- 구단 정책에 따라 특정 좌석/회원 선예매 티켓은 양도 불가 설정 가능.

### 5.4 입장

1. 입장 시 앱이 현재 NFT 소유자를 확인한다.
2. 서버가 현재 소유자에게만 짧은 수명의 QR/바코드를 발급한다.
3. 게이트 스캐너는 QR 서명, tokenId, owner, expiry를 검증한다.
4. 입장 완료 시 `used = true`로 온체인 또는 운영사 서버에 기록한다.
5. 사용 완료 티켓은 기념 SBT 또는 POAP처럼 팬 컬렉션에 남길 수 있다.

## 6. 스마트컨트랙트 설계

### BaseballTicketNFT

- ERC721 기반
- `mintTicket(address to, TicketMeta meta)`
- `markUsed(uint256 tokenId)`
- `_update()` 훅에서 일반 전송 차단
- 공식 마켓 컨트랙트만 transfer 권한 부여
- 민트/양도 시 `OnchainVerifier.isVerified()` 호출

### TicketTransferMarket

- `list(tokenId, price)`
- `cancelListing(tokenId)`
- `buy(tokenId)`
- `price <= faceValue` 검사
- `block.timestamp < transferDeadline` 검사
- 구매자 Verified Address 검사
- 정산 후 `safeTransferFrom(seller, buyer, tokenId)`

### FanCredentialSBT

- 팬 레벨, 선예매 자격, 시즌권 멤버십 등을 표현
- 양도 불가
- 향후 `up.id`와 연결해 팬 평판/기록으로 확장

### GateVerifier

- 짧은 수명의 QR 검증용 서버/컨트랙트 혼합 구조
- 실시간 입장 속도를 위해 QR 발급/검증은 오프체인 서명 기반
- 입장 완료 상태는 온체인 또는 운영사 DB와 동기화

## 7. MVP 범위

해커톤 MVP는 실제 결제/구단 연동 없이 다음을 구현한다.

- GIWA Sepolia 네트워크 연결 정보 표시
- 모의 경기 목록과 좌석 선택
- Verified Address 상태 시뮬레이션
- 예매 시 온체인 티켓 발급 시나리오
- 양도 마켓에서 정가 이하 양도
- 미검증 주소 양도 차단
- 동적 QR/입장 상태 데모
- Flashblocks preconfirmation 느낌의 트랜잭션 타임라인

## 8. 데모 시나리오

1. 팬이 `minjun.up.id` 지갑으로 로그인한다.
2. LG vs 두산 경기를 선택한다.
3. 1루 내야석 좌석을 선택하고 예매한다.
4. 앱이 Verified Address 확인 후 티켓 NFT를 발급한다.
5. 사용자가 개인 사정으로 양도 마켓에 정가 이하로 등록한다.
6. `haeun.up.id` 사용자가 양도를 수락한다.
7. 미검증 주소로 전환하면 양도 수락이 차단된다.
8. 경기장 입장 탭에서 현재 소유자에게만 QR이 노출된다.

## 9. 해커톤 차별점

- 단순 NFT 티켓이 아니라 **검증된 주소만 구매/양도 가능한 티켓**이다.
- `up.id`를 통해 암호화폐 주소가 아닌 팬 ID 중심 UX를 만든다.
- 가격 상한, 양도 횟수, 입장 완료 후 양도 금지 같은 운영 정책을 코드로 강제한다.
- KBO의 분산된 예매처 구조를 통합하는 “신뢰/소유권 레이어”로 포지셔닝한다.
- GIWA의 Dojang, OnchainVerifier, Flashblocks를 모두 데모에 녹일 수 있다.

## 10. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 실제 구단/예매처 연동 필요 | MVP는 모의 인벤토리, PoC 이후 API/정산 연동 |
| 개인정보 규제 | 온체인에는 PII 저장 금지, Verified 여부만 사용 |
| 현장 입장 속도 | QR 검증은 오프체인 서명 기반, 온체인 상태는 비동기 동기화 |
| 지갑 사용성 | up.id, GIWA Wallet, 계정 추상화/가스 대납으로 단순화 |
| 환불/우천취소 | 티켓 상태 머신에 `refunded`, `postponed`, `voided` 추가 |

## 11. 다음 단계

1. Solidity 컨트랙트 MVP 작성
2. GIWA Sepolia 배포
3. 프론트엔드 지갑 연결
4. `OnchainVerifier` 실제 호출
5. QR 서명 서버 모의 구현
6. 구단 운영자용 좌석/정책 관리자 화면 추가

