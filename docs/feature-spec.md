# Proof-of-Fandom Ticket 기능 명세서

> 본 문서는 [`proof-of-fandom-ticket-plan.md`](./proof-of-fandom-ticket-plan.md)에서 정의한 컨셉을 실제로 동작하는 서비스로 만들기 위한 **기능 단위 명세**다.
> 스마트 컨트랙트 상세 설계는 [`smart-contract.md`](./smart-contract.md)에 분리되어 있다.

---

## 1. 서비스 개요

**Proof-of-Fandom Ticket(이하 PoF Ticket)** 은 두 종류의 거래를 한 곳에서 제공한다.

| 거래 채널 | 누가 판매 | 누가 구매 | 가격 정책 |
|---|---|---|---|
| **1차 시장 (Primary)** | 구단 / 공식 예매처가 발행한 신규 티켓 | 검증된 팬(`Verified Address`) | 구단이 정한 정가 |
| **2차 시장 (Secondary)** | 티켓을 보유한 팬 | 검증된 팬(`Verified Address`) | 정가 이하 + 운영 정책 통과 |

두 채널 모두 **같은 티켓 NFT 표준**을 사용하므로, 1차에서 산 티켓을 2차에 등록하고, 2차에서 받은 티켓도 다시 게이트에서 사용할 수 있다. 즉 사용자는 "구단 티켓을 사는 화면"과 "팬한테 양도받는 화면"을 한 앱 안에서 자연스럽게 오갈 수 있다.

> 핵심 한 줄 요약 — *구단이 발행한 티켓을 검증된 팬만 사고, 정가 이하로만 팬 간 양도가 가능한 통합 KBO 티켓 플랫폼.*

---

## 2. 사용자 페르소나

| 페르소나 | 핵심 니즈 | PoF Ticket이 제공하는 것 |
|---|---|---|
| 일반 팬 (Minjun) | 인기 경기 정가 예매, 위험 없는 양도 수령 | 검증 채널 단일화, 정가 보장 |
| 시즌권 팬 (Hyejin) | 못 가는 날 안전하게 양도 | 정가 이하 등록, 양도 이력 투명 |
| 구단 운영팀 | 봇 차단, 암표 단속, 입장 통제 | Verified 게이트, 양도 정책 강제, 입장 상태 동기화 |
| 경기장 입구 인력 | 한 자리에 한 사람만 입장 | 짧은 수명 QR, 캡처 무효화 |
| 데이터 운영자 | 부정 거래 추적 | 온체인 이벤트, 양도 그래프 |

---

## 3. 기능 영역

### 3.1 신원 인증 / 지갑 온보딩

- GIWA Wallet 또는 EVM 지갑(WalletConnect)을 연결한다.
- 백엔드는 연결된 주소를 GIWA `OnchainVerifier.isVerified(address, UPBIT_KOREA)` 로 조회한다.
- 검증되지 않은 주소는 **둘러보기 모드**로만 동작하고, 구매/양도 수락 버튼은 비활성화된다.
- `username.up.id`가 등록된 주소는 프로필에 인간 친화적 이름으로 노출한다.
- 미보유 사용자에게는 "지갑에서 Verified Address 받기 → up.id 발급" 가이드 링크를 제공한다.

### 3.2 1차 시장 — 구단 발행 티켓 구매

흐름:

1. 사용자가 날짜/구단/구장으로 경기 필터링.
2. 좌석맵(블록 → 열 → 좌석 단위)에서 좌석 선택.
3. 사이드 패널에 **예매 요약**과 적용된 정책(검증 필요, 양도 규칙, 입장 시간)이 표시된다.
4. `검증 후 예매` 버튼 클릭 시 `PrimaryTicketSale.purchase(gameId, seatId)` 트랜잭션을 발송.
5. 컨트랙트는 (a) 구매자가 Verified Address인지 (b) 좌석이 미판매 상태인지 확인 후 `BaseballTicketNFT.mint()`.
6. Flashblocks RPC로 받은 200ms preconfirm을 통해 UI에 즉시 "예매 완료" 상태 표시.
7. 내 티켓 탭에 SBT-Gated Ticket 카드가 발급되어 표시.

운영 옵션:

- **선예매(Pre-sale)**: 시즌권/팬클럽 SBT 보유자만 통과 가능한 구간을 컨트랙트 파라미터로 설정.
- **1인 N매 제한**: 같은 경기 한 주소가 보유할 수 있는 티켓 수 제한.
- **좌석 잠금(Lock)**: 결제 트랜잭션 동안 좌석을 일시적으로 잠금. 실패 시 자동 해제.

### 3.3 2차 시장 — 팬 간 양도

흐름:

1. 보유 티켓 카드에서 `정가 이하 양도 등록`을 누르면 등록 가격을 입력하는 시트가 뜬다.
   (MVP 데모에서는 정가 - 2,000원으로 자동 등록)
2. `TicketTransferMarket.list(tokenId, price)` 호출. 컨트랙트는 `price <= faceValue` 강제.
3. 등록된 티켓은 양도 마켓 페이지에 노출된다. (판매자, 좌석, 정가, 양도가, 양도 마감 시점)
4. 양수자가 `양도받기`를 눌러 `TicketTransferMarket.buy(tokenId)` 트랜잭션 실행.
5. 컨트랙트가 양수자가 Verified Address인지, 양도 마감 시간 안에 있는지, 양도 횟수가 남았는지 확인.
6. 정산 후 `BaseballTicketNFT`가 양수자로 `safeTransferFrom`. 이벤트로 양도 이력 기록.
7. 양수자 지갑에 새 티켓이 즉시 표시되고, 양도인의 보유 목록에서는 제거된다.

운영 옵션:

- **양도 마감 시간**: 경기 시작 N시간 전(예: 2시간 전) 이후 양도 차단.
- **양도 횟수 제한**: 티켓당 최대 양도 횟수(예: 2회).
- **양도 불가 좌석**: 특정 구역(VIP/콤프) 또는 SBT 게이트 좌석은 양도 자체를 막을 수 있다.
- **분쟁 시 환불**: 운영자가 `voided` 상태로 강제 전이할 수 있는 역할 분리 (스마트 컨트랙트 명세 참조).

### 3.4 내 티켓 / 지갑

- 보유 티켓 카드: 경기, 좌석, Token ID, 사용 상태, 동적 QR 영역.
- 액션: `정가 이하 양도 등록`, `입장 처리`.
- 상태 라벨: `입장 가능` / `입장 완료` / `양도 마감` / `우천 취소`.
- 사용 완료 티켓은 자동으로 **기념 SBT 모드**로 전환되어 더 이상 양도/사용 액션을 노출하지 않는다.

### 3.5 입장 (게이트)

상세 흐름은 [§6 입장권 형태 및 게이트 검증](#6-입장권-형태-및-게이트-검증)에서 다룬다.

### 3.6 환불 · 취소 · 우천 처리

| 사건 | 처리 |
|---|---|
| 구매자 단순 취소 | 경기 7일 전 ~ 4시간 전까지 가능. `PrimaryTicketSale.refund(tokenId)` 호출 → 좌석 재오픈 |
| 우천 연기 | 운영자가 `BaseballTicketNFT.markPostponed(gameId, newStartTime)` 호출. 입장 가능 시간이 새 일정으로 변경되고 양도 마감은 새 기준으로 재계산 |
| 경기 취소 | 운영자가 `markVoided(gameId)` 호출 → 모든 티켓 환불 가능 상태로 전환 |
| 부정 거래 발견 | 운영자 권한으로 특정 토큰 `freeze` → 양도/입장 차단 |

---

## 4. GIWA 기반 신원 인증 흐름

GIWA의 [Dojang](https://docs.giwa.io/giwa-ecosystem/dojang) 서비스는 **오프체인 신원 정보를 GIWA 위의 on-chain attestation으로 변환**한다. PoF Ticket은 이 attestation을 가지고 "구매·양도·입장 가능 여부"를 판단한다.

### 4.1 한 번 거치는 단계 (사용자 입장)

1. **거래소 KYC (오프체인)** — 사용자가 업비트(현재 Dojang의 attester)에서 이미 본인확인을 마친 상태여야 한다.
2. **Verified Address 발급** — GIWA 월렛에서 본인 지갑 주소에 대해 "Verified Address" attestation을 발급받는다. 이 단계는 EAS(Ethereum Attestation Service) 기반으로 GIWA 위에 영구 저장된다.
3. **`up.id` 등록 (선택)** — Verified Address 보유자는 `myname.up.id` 형태의 SBT 닉네임을 무료로 발급받을 수 있다. ENS 호환이므로 주소 대신 사람이 읽을 수 있는 이름으로 표시된다.

### 4.2 PoF Ticket 내부 검증 (서비스 입장)

모든 구매/양도/입장 트랜잭션은 컨트랙트가 직접 GIWA의 `OnchainVerifier`를 호출해서 검증한다.

```solidity
interface IVerifier {
    function isVerified(address primaryAddress, DojangAttesterId attesterId)
        external view returns (bool);
}

// PoF Ticket에서 사용하는 attester는 업비트 Korea
DojangAttesterId public constant UPBIT_KOREA = DojangAttesterId.wrap(
    0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034
);
```

PoF Ticket의 모든 핵심 호출은 다음 패턴을 따른다.

```solidity
if (!verifier.isVerified(buyer, UPBIT_KOREA)) revert NotVerified(buyer);
```

즉 **PoF Ticket은 PII를 보관하지 않는다.** 사용자가 "검증된 사람인가"라는 사실만 온체인에서 참고한다. 개인정보 보호와 본인확인을 모두 만족시키는 구조다.

### 4.3 검증 실패 시 UX

- 미검증 주소: 상단 wallet chip이 빨간색 `Blocked` 상태가 되고, 모든 구매/양도/등록 버튼이 비활성화된다.
- 검증 만료/취소: Dojang attestation이 무효화된 경우 다음 트랜잭션에서 `NotVerified` revert. UI는 즉시 "지갑에서 Verified Address 갱신" 가이드를 띄운다.
- `up.id` 미등록: 거래 자체는 가능하지만, 상대방 표시가 `0x7a91...4c21` 같은 단축 주소로 보인다.

---

## 5. 암표 방지 메커니즘

암표는 다음과 같이 발생한다: (a) 봇이 대량 구매 → (b) 검증되지 않은 채널(중고 거래앱, 오픈 채팅 등)에서 (c) 시세 위로 재판매 → (d) 캡처 이미지/스크린샷으로 입장. PoF Ticket은 이 네 단계 모두에 차단 지점을 둔다.

### 5.1 봇 대량 구매 차단 — Verified Address 게이팅

- 1차 구매 트랜잭션 자체가 `OnchainVerifier.isVerified` 통과 없이는 실패한다.
- Verified Address는 **거래소 KYC를 통과한 실명**과 연결되어 있으므로 봇/대포지갑이 발급받기 어렵다.
- 1인 N매 제한을 컨트랙트가 강제하므로, 검증 주소를 여러 개 만들었더라도 한 사람당 사들일 수 있는 양은 제한된다.

### 5.2 검증되지 않은 외부 양도 차단 — 전송 정책

- `BaseballTicketNFT`의 `_update()` 훅이 **공식 마켓 컨트랙트 외의 전송을 모두 차단**한다.
- 즉 사용자는 카카오톡 송금하듯이 토큰을 다른 지갑에 보낼 수 없다. 반드시 `TicketTransferMarket`을 거쳐야 한다.
- 마켓을 거치면 ① 가격이 정가 이하인지, ② 양수자가 Verified Address인지, ③ 양도 마감 전인지가 모두 자동 체크된다.

### 5.3 시세 위 재판매 차단 — 가격 상한 강제

- `list(tokenId, price)` 호출 시 `require(price <= faceValue)`.
- 정가는 NFT 메타데이터에 새겨진 `faceValue` 값을 사용하므로 위조 불가.
- 운영 정책상 시즌권 등 일부 티켓은 `faceValue` 이하 + 일정 비율(예: 80%)로 더 엄격하게 잡을 수도 있다.

### 5.4 캡처 이미지 입장 차단 — 짧은 수명 동적 QR

- 게이트 QR은 입장 시점에 **현재 NFT 소유자에게만** 발급된다.
- QR은 30 ~ 60초의 유효 시간을 가지며, 서명에는 `tokenId · ownerAddress · expiry · nonce` 가 포함된다.
- 캡처해서 다른 사람에게 보내도 (a) 30초 안에 도착해야 하고 (b) 게이트 스캐너가 서명자 ↔ 현재 온체인 소유자 일치 여부를 확인하므로 실효성이 없다.
- 한번 사용된 토큰은 즉시 `used=true`가 되어 다음 QR 발급이 차단된다.

### 5.5 부가 장치

- **양도 이력 공개** — 모든 양도가 온체인 이벤트로 남아 부정 거래 패턴을 추적할 수 있다.
- **양도 횟수 제한** — 한 티켓이 여러 명을 거치면서 가격이 누적되는 형태의 우회를 막는다.
- **양도 마감 시간** — 경기 시작 직전 가격이 급등하는 형태의 거래를 시간 자체로 차단한다.
- **운영자 freeze** — 외부 신고/조사 결과 부정 거래로 판단된 토큰은 운영자가 일시 동결 가능.

---

## 6. 입장권 형태 및 게이트 검증

### 6.1 입장권의 실제 형태

사용자가 보는 입장권은 다음 세 가지 표시로 구성된 카드이다.

| 영역 | 내용 |
|---|---|
| Header | 경기명, 구단, 좌석 (예: "1루 내야 2열 4번") |
| Facts | 소유자(`username.up.id`), Token ID, 상태(`입장 가능` / `입장 완료`) |
| **Live QR** | 30~60초 유효한 서명 QR. 화면에 표시될 때마다 새로 생성됨. |

> **물리 종이 발권은 제공하지 않는다.** 캡처 이미지로 양도 가능한 매체 자체를 만들지 않기 위함이다.

### 6.2 QR 페이로드

오프체인 서명 서버가 다음 JSON에 서명한 결과를 QR로 인코딩한다.

```json
{
  "tokenId": 12345,
  "gameId": "g1",
  "owner": "0x7a91...4c21",
  "expiry": 1718530200,
  "nonce": "b3c1...e72f"
}
```

서명 키는 **GateVerifier 컨트랙트가 등록해 둔 운영자 공개키**와 매칭된다. 게이트 단말은 인터넷이 끊겨도 서명만 검증할 수 있도록 공개키를 캐시한다.

### 6.3 게이트 검증 절차

1. **사용자 액션**: 입장권 화면을 열면 클라이언트가 `gate-api`에 QR 발급을 요청한다. 서버는 GIWA RPC로 `ownerOf(tokenId)`를 호출해 호출자가 진짜 현재 소유자인지 확인 후 30~60초 서명 발급.
2. **게이트 스캔**: 입구 단말이 QR을 읽어
    - (a) 서명자 = 운영자 공개키인지 검증
    - (b) `expiry` 가 현재 시각보다 미래인지
    - (c) `owner` 가 현재 NFT 소유자와 같은지 (`ownerOf(tokenId)` 재확인 또는 캐시)
    - (d) `used` 상태가 false인지
3. **사용 처리**: 모든 검사 통과 시 단말이 `GateVerifier.markUsed(tokenId, signature)` 트랜잭션을 큐에 넣고 그린라이트 → 사람 입장. 단말은 응답을 기다리지 않고 즉시 다음 손님 처리 가능.
4. **온체인 반영**: 백오피스가 `markUsed`를 배치로 처리해 `BaseballTicketNFT.used = true` 를 기록. 그 순간 해당 토큰은 더 이상 QR을 발급받을 수 없고, 양도도 불가하다.
5. **재입장 정책**: 같은 경기 안에서 재입장이 필요한 경우 운영자가 `reentryAllowed` 플래그를 켜둔 토큰만 허용한다.

### 6.4 장애 모드

| 케이스 | 대응 |
|---|---|
| 게이트 인터넷 끊김 | 단말은 캐시된 운영자 공개키로 서명만 검증, 입장 후 큐는 복구 시 일괄 동기화 |
| 사용자 폰 배터리 방전 | 본인 인증 후 운영자 단말에서 ownerOf 조회 + 수동 발권 |
| QR 만료 | "QR 새로 받기" 버튼으로 즉시 갱신 |
| 중복 입장 시도 | `used = true` 상태이면 게이트가 빨간색 차단, 사유 표시 |

---

## 7. 화면 명세 / 모바일 웹앱

### 7.1 화면 구성

| 화면 | 라우트 | 핵심 UI |
|---|---|---|
| 홈 / 히어로 | `#home` | 카피, 200ms preconfirm/정가 이하/Verified 배지 |
| 예매 | `#games` | 경기 리스트, 좌석맵, 예매 요약 패널 |
| 양도 마켓 | `#market` | 정가 이하 등록 카드 리스트 |
| 내 티켓 | `#wallet` | 보유 티켓 카드, QR, 입장 처리 |

### 7.2 반응형 / 모바일 웹앱 전략

PoF Ticket은 **반응형 PWA** 형태로 한 코드베이스에서 데스크톱·태블릿·모바일을 모두 지원한다.

| 뷰포트 | 레이아웃 |
|---|---|
| `>= 1120px` | 3컬럼 예매(목록 / 좌석맵 / 체크아웃), 2컬럼 마켓 |
| `780 ~ 1119px` | 1컬럼 예매, 체크아웃은 3등분 |
| `470 ~ 779px` | 모든 패널 세로 스택, 좌석맵 6열 |
| `< 470px` | 좌석맵 4열, 패딩 14px, 풀폭 CTA |

모바일 전용 UX:

- **하단 탭 바**: 작은 화면에서는 상단 nav 대신 화면 하단에 고정된 탭 바(`예매 / 양도 / 내 티켓`)를 제공한다.
- **세이프 에어리어**: iOS 노치/홈바를 위해 `env(safe-area-inset-*)` 패딩 적용.
- **터치 타깃 ≥ 44px**: 좌석 버튼, 액션 버튼 모두 최소 높이를 보장.
- **PWA Installable**: `manifest.webmanifest` 와 `apple-mobile-web-app-*` 메타로 홈 화면 추가 시 앱처럼 동작.
- **테마 컬러**: 상단 시스템 바를 서비스 그린(`#146b43`)으로 통일.

### 7.3 접근성

- 모든 인터랙티브 요소에 `aria-label` 명시.
- 좌석 버튼은 `aria-label`에 구역·열·번호·가격을 한국어로 포함.
- `aria-live="polite"` 영역(`chain-log`)으로 트랜잭션 진행 상태를 스크린리더에 안내.

---

## 8. 상태 모델 / 데이터

### 8.1 티켓 라이프사이클

```
[Issued] ── transfer ──▶ [Issued (new owner)]
   │                          │
   │ markUsed                 │ markUsed
   ▼                          ▼
[Used] (양도 불가, QR 발급 불가)

[Issued] ── markPostponed ──▶ [Postponed] (재일정 후 다시 Issued)
[Issued] ── markVoided    ──▶ [Voided] (환불 가능)
[Issued] ── freeze        ──▶ [Frozen] (운영자 해제 시 Issued 복귀)
```

### 8.2 주요 이벤트

- `TicketMinted(tokenId, owner, gameId, seatId, faceValue)`
- `TicketListed(tokenId, seller, price, deadline)`
- `TicketTransferred(tokenId, from, to, price)`
- `TicketUsed(tokenId, owner, gateId)`
- `TicketVoided(tokenId, reason)`
- `TicketFrozen(tokenId, by)`

---

## 9. 비기능 요구사항

| 분류 | 요구 |
|---|---|
| 응답 속도 | 모든 인터랙션 200ms 이내 시각적 피드백 (Flashblocks preconfirm 활용) |
| 가용성 | 게이트 입장은 인터넷 단절 시에도 캐시된 키로 서명 검증 |
| 보안 | PII 온체인 저장 금지, QR 서명키는 HSM 또는 KMS 보관 |
| 개인정보 | Dojang Verified 여부만 참조, 거래소 KYC 결과 자체는 PoF에 저장하지 않음 |
| 확장성 | 구단·예매처 연동을 위한 어댑터 인터페이스 (티켓링크/인터파크/구단 자체) |
| 관측성 | 모든 컨트랙트 이벤트를 인덱싱해 부정 거래 대시보드 제공 |

---

## 10. MVP 범위 (해커톤)

해커톤 데모는 다음을 포함한다.

- [x] React + Vite 프론트엔드 (현 리포의 `src/`)
- [x] 모의 경기/좌석/마켓/티켓 데이터
- [x] Verified Address 토글 시뮬레이션 (지갑 chip 클릭)
- [x] 예매 → 티켓 발급 → 양도 등록 → 양도 수락 → 입장 처리 시나리오
- [x] 모바일 웹앱 반응형 / PWA manifest
- [ ] GIWA Sepolia 실제 컨트랙트 배포 ([`smart-contract.md`](./smart-contract.md))
- [ ] `wagmi`/`viem` 기반 실제 지갑 연동
- [ ] 게이트 QR 서명 서버 PoC

---

## 11. 향후 로드맵

1. **컨트랙트 배포 + 프론트 연동** (D+2주)
2. **구단 1곳과 파일럿** — 1차 발행 어댑터 (D+1.5개월)
3. **모바일 PWA 정식 배포 + 게이트 단말 SDK** (D+3개월)
4. **운영자 콘솔** — 좌석/정책/freeze/우천 처리 (D+3개월)
5. **타 스포츠 확장** — 축구/배구로 컨트랙트 재사용 (D+6개월)
