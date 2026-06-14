# Proof-of-Fandom Ticket

GIWA Chain 위에서 동작하는 한국 프로야구 검증 티켓 예매/양도 서비스 프로토타입입니다.

## 구성

- `index.html` - 팬용 웹앱 프로토타입
- `styles.css` - 반응형 UI 스타일
- `app.js` - 예매, 양도, 검증 상태 데모 로직
- `assets/ballpark-ticket-gate.png` - 생성형 이미지 기반 야구장 티켓 게이트 배경
- `docs/proof-of-fandom-ticket-plan.md` - 리서치 기반 프로젝트 기획서

## 실행

외부 패키지 없이 정적 파일로 실행됩니다.

```bash
python3 -m http.server 5173
```

브라우저에서 `http://localhost:5173`을 열면 됩니다.

