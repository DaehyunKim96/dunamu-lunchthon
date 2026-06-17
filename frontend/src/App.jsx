import { useEffect, useMemo, useState } from 'react'

const WALLET_NAME = 'minjun.up.id'
const WALLET_ADDRESS = '0x7a91...4c21'

/* ── KBO 구단 레지스트리 (공식 컬러 기반) ───────────────────────── */
const TEAMS = {
  LG: { name: 'LG 트윈스', short: 'LG', city: '서울', primary: '#C30452', deep: '#8e033b', trim: '#000000', mascot: '럭키', initial: 'LG' },
  OB: { name: '두산 베어스', short: '두산', city: '서울', primary: '#1A1748', deep: '#0d0b2b', trim: '#ED1C24', mascot: '철웅이', initial: 'D' },
  HT: { name: 'KIA 타이거즈', short: 'KIA', city: '광주', primary: '#EA0029', deep: '#a60020', trim: '#06141F', mascot: '호걸이', initial: 'K' },
  SS: { name: '삼성 라이온즈', short: '삼성', city: '대구', primary: '#074CA1', deep: '#053a7a', trim: '#C0C0C0', mascot: '블레오', initial: 'S' },
  LT: { name: '롯데 자이언츠', short: '롯데', city: '부산', primary: '#041E42', deep: '#02132b', trim: '#D00F31', mascot: '누리', initial: 'L' },
  HH: { name: '한화 이글스', short: '한화', city: '대전', primary: '#FC4E00', deep: '#c43c00', trim: '#000000', mascot: '위니', initial: 'H' },
  SK: { name: 'SSG 랜더스', short: 'SSG', city: '인천', primary: '#CE0E2D', deep: '#9c0a22', trim: '#FFB81C', mascot: '랜디', initial: 'SSG' },
  KT: { name: 'KT 위즈', short: 'KT', city: '수원', primary: '#16171B', deep: '#000000', trim: '#EB1C24', mascot: '빅', initial: 'KT' },
  NC: { name: 'NC 다이노스', short: 'NC', city: '창원', primary: '#315288', deep: '#22395f', trim: '#C7A079', mascot: '단디', initial: 'NC' },
  KW: { name: '키움 히어로즈', short: '키움', city: '서울', primary: '#570514', deep: '#3a0310', trim: '#B07F4E', mascot: '턱돌이', initial: 'K' },
}

const VENUE = {
  LG: '서울 잠실야구장', OB: '서울 잠실야구장', HT: '광주-기아 챔피언스 필드',
  SS: '대구 삼성라이온즈파크', LT: '부산 사직야구장', HH: '대전 한화생명 볼파크',
  SK: '인천 SSG 랜더스필드', KT: '수원 케이티 위즈파크', NC: '창원 NC파크', KW: '서울 고척스카이돔',
}

function createSeats(prefix, basePrice, soldIds) {
  return Array.from({ length: 24 }, (_, index) => {
    const id = `${prefix}${String(index + 1).padStart(2, '0')}`
    const row = Math.floor(index / 8) + 1
    const seat = (index % 8) + 1
    const zone = row === 1 ? '1루 테이블석' : row === 2 ? '1루 내야지정석' : '응원지정석'
    return { id, label: id, zone, row, seat, price: basePrice - (row - 1) * 6000, sold: soldIds.includes(id) }
  })
}

const initialGames = [
  { id: 'g1', home: 'LG', away: 'OB', date: { md: '06.19', dow: '금', time: '18:30' }, badges: ['검증예매', '클린양도'], seats: createSeats('A', 54000, ['A03', 'A04', 'A15', 'A16', 'A21']) },
  { id: 'g2', home: 'LG', away: 'SS', date: { md: '06.23', dow: '화', time: '18:30' }, badges: ['검증예매', '취소표 알림'], seats: createSeats('B', 50000, ['B02', 'B11', 'B12', 'B24']) },
  { id: 'g3', home: 'HT', away: 'SK', date: { md: '06.20', dow: '토', time: '17:00' }, badges: ['검증예매', '클린양도'], seats: createSeats('C', 47000, ['C01', 'C09', 'C18', 'C19']) },
  { id: 'g4', home: 'LT', away: 'HH', date: { md: '06.21', dow: '일', time: '17:00' }, badges: ['검증예매', '매진임박'], seats: createSeats('D', 44000, ['D05', 'D06', 'D07', 'D14', 'D22']) },
]

const initialListings = [
  { id: 'l1', home: 'KW', away: 'NC', date: '06.20 토 17:00', seat: '1루 내야지정석 114블록 8열 13번', seller: 'hyejin.up.id', price: 39000, faceValue: 43000 },
  { id: 'l2', home: 'SK', away: 'KT', date: '06.21 일 14:00', seat: '응원지정석 303블록 4열 2번', seller: 'doyoon.up.id', price: 30000, faceValue: 33000 },
  { id: 'l3', home: 'NC', away: 'HT', date: '06.23 화 18:30', seat: '1루 테이블석 T2 2열 7번', seller: 'seoha.up.id', price: 52000, faceValue: 58000 },
]

const initialTickets = [
  { tokenId: 'KBO-480000', home: 'LG', away: 'OB', date: '06.14 토 17:00', seat: '1루 테이블석 1열 5번', price: 54000, faceValue: 54000, used: false },
  { tokenId: 'KBO-480002', home: 'HH', away: 'LT', date: '06.12 목 18:30', seat: '1루 내야지정석 209블록 6열 8번', price: 32000, faceValue: 32000, used: false },
  { tokenId: 'KBO-480003', home: 'HT', away: 'SK', date: '06.08 일 17:00', seat: '응원지정석 305블록 3열 11번', price: 24000, faceValue: 24000, used: true },
  { tokenId: 'KBO-480102', home: 'NC', away: 'KW', date: '06.05 목 18:30', seat: '응원지정석 112블록 9열 2번', price: 22000, faceValue: 22000, used: false },
]

/* ── 컬렉션 카드 파생 (tokenId 기반 결정적) ──────────────────────── */
const RARITIES = {
  common: { key: 'common', label: 'COMMON', stars: 1 },
  rare: { key: 'rare', label: 'RARE', stars: 2 },
  epic: { key: 'epic', label: 'EPIC', stars: 3 },
  legendary: { key: 'legendary', label: 'LEGENDARY', stars: 4 },
}
const POSITIONS = ['투수', '포수', '내야수', '외야수', '지명타자']
const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '한', '오', '서', '신', '권', '류', '전']
const GIVENS = ['도윤', '지훈', '현우', '민준', '서준', '강민', '태경', '승호', '준영', '재현', '시우', '하준', '연우', '지운', '성진', '우진']

function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function deriveCard(tokenId, teamCode, zone = '') {
  const seed = hashSeed(`${teamCode}-${tokenId}`)
  let score = seed % 100
  if (zone.includes('테이블')) score += 42
  else if (zone.includes('내야')) score += 18
  const rarity =
    score >= 90 ? RARITIES.legendary : score >= 70 ? RARITIES.epic : score >= 40 ? RARITIES.rare : RARITIES.common
  const number = ((seed >>> 3) % 98) + 1
  const position = POSITIONS[(seed >>> 7) % POSITIONS.length]
  const playerName = `${SURNAMES[(seed >>> 9) % SURNAMES.length]}${GIVENS[(seed >>> 13) % GIVENS.length]}`
  const pose = position === '투수' ? 'pitch' : 'bat'
  const serial = String(((seed >>> 2) % 1500) + 1).padStart(4, '0')
  return { seed, rarity, number, position, playerName, pose, serial }
}

function formatWon(value) {
  return `${value.toLocaleString('ko-KR')}원`
}

function qrCells(seed) {
  const digits = seed.replace(/\D/g, '').padEnd(16, '7')
  return Array.from({ length: 49 }, (_, index) => {
    const active = (index + Number(digits[index % digits.length])) % 3 !== 0
    return <span key={index} className={active ? '' : 'blank'} />
  })
}

/* ── 구단 엠블럼 ─────────────────────────────────────────────── */
function TeamCrest({ code, size = 44 }) {
  const team = TEAMS[code]
  return (
    <span
      className="crest"
      style={{ width: size, height: size, background: team.primary, color: team.trim === '#000000' ? '#fff' : team.trim }}
      aria-hidden="true"
    >
      <span className="crest-initial" style={{ fontSize: size * (team.initial.length > 1 ? 0.34 : 0.46) }}>
        {team.initial}
      </span>
    </span>
  )
}

/* ── 마스코트 캐릭터 아트 (NFT 카드 주인공) ───────────────────────── */
function MascotArt({ code, pose }) {
  const t = TEAMS[code]
  const dark = '#1b2230'
  return (
    <svg className="mascot-art" viewBox="0 0 260 300" role="img" aria-label={`${t.name} 마스코트`}>
      <ellipse cx="130" cy="282" rx="74" ry="12" fill="rgba(0,0,0,0.22)" />
      {/* 배트 */}
      <g transform={pose === 'pitch' ? 'rotate(-58 196 120)' : 'rotate(34 188 196)'}>
        <rect x="182" y={pose === 'pitch' ? 40 : 150} width="14" height="118" rx="7" fill="#caa472" />
        <rect x="182" y={pose === 'pitch' ? 138 : 248} width="14" height="22" rx="6" fill="#9c7a4f" />
      </g>
      {/* 다리 */}
      <rect x="108" y="222" width="16" height="48" rx="8" fill={dark} />
      <rect x="136" y="222" width="16" height="48" rx="8" fill={dark} />
      <ellipse cx="110" cy="272" rx="17" ry="8" fill="#fff" />
      <ellipse cx="150" cy="272" rx="17" ry="8" fill="#fff" />
      {/* 야구공 머리 */}
      <circle cx="130" cy="142" r="80" fill="#ffffff" stroke="#e4e9f0" strokeWidth="2" />
      <path d="M72 92 Q50 142 72 192" fill="none" stroke="#e8131d" strokeWidth="3.4" strokeDasharray="2 8" strokeLinecap="round" />
      <path d="M188 92 Q210 142 188 192" fill="none" stroke="#e8131d" strokeWidth="3.4" strokeDasharray="2 8" strokeLinecap="round" />
      {/* 팔 */}
      <rect x="40" y="184" width="42" height="15" rx="7.5" fill="#fff" stroke="#e4e9f0" strokeWidth="1.5" transform="rotate(18 61 191)" />
      <rect x="176" y={pose === 'pitch' ? 150 : 182} width="42" height="15" rx="7.5" fill="#fff" stroke="#e4e9f0" strokeWidth="1.5" transform={pose === 'pitch' ? 'rotate(-44 197 157)' : 'rotate(-26 197 189)'} />
      {/* 모자 */}
      <path d="M66 122 Q130 56 194 122 Q130 90 66 122 Z" fill={t.primary} />
      <path d="M62 122 Q86 134 118 128 L116 140 Q82 144 58 132 Z" fill={t.deep} />
      <circle cx="130" cy="74" r="6" fill={t.trim === '#000000' ? '#fff' : t.trim} />
      <text x="138" y="116" textAnchor="middle" fontSize="22" fontWeight="900" fill={t.trim === '#000000' ? '#fff' : t.trim} fontFamily="Inter, sans-serif">
        {t.initial}
      </text>
      {/* 얼굴 */}
      <ellipse cx="106" cy="170" rx="8" ry="4" fill={t.primary} opacity="0.22" />
      <ellipse cx="158" cy="170" rx="8" ry="4" fill={t.primary} opacity="0.22" />
      <circle cx="112" cy="154" r="7.5" fill={dark} />
      <circle cx="150" cy="154" r="7.5" fill={dark} />
      <circle cx="114" cy="151" r="2.2" fill="#fff" />
      <circle cx="152" cy="151" r="2.2" fill="#fff" />
      <path d="M118 176 Q131 188 144 176" fill="none" stroke={dark} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

/* ── NFT 컬렉션 카드 ──────────────────────────────────────────── */
function CollectibleCard({ ticket, owner, onFlip, flipped }) {
  const card = deriveCard(ticket.tokenId, ticket.home, ticket.seat)
  const team = TEAMS[ticket.home]
  return (
    <div className={`collectible rarity-${card.rarity.key}${flipped ? ' flipped' : ''}`}>
      <div className="collectible-inner">
        <div
          className="collectible-face front"
          style={{ '--team': team.primary, '--team-deep': team.deep, '--team-trim': team.trim === '#000000' ? '#dfe4ec' : team.trim }}
        >
          <div className="holo" aria-hidden="true" />
          <div className="card-head">
            <div className="card-team">
              <TeamCrest code={ticket.home} size={30} />
              <span>{team.name}</span>
            </div>
            <span className="rarity-gem">
              {'★'.repeat(card.rarity.stars)}
              <em>{card.rarity.label}</em>
            </span>
          </div>
          <div className="card-stage">
            <span className="jersey-no">{card.number}</span>
            <MascotArt code={ticket.home} pose={card.pose} />
          </div>
          <div className="card-plate">
            <div className="plate-name">
              <strong>{card.playerName}</strong>
              <span>{card.position} · {team.mascot} 에디션</span>
            </div>
            <div className="plate-serial">
              <span>SERIAL</span>
              <strong>#{card.serial} / 2026</strong>
            </div>
          </div>
        </div>

        <div className="collectible-face back">
          <p className="back-eyebrow">입장권 · LIVE QR</p>
          <div className="qr" aria-label="동적 입장 QR">{qrCells(ticket.tokenId)}</div>
          <p className="back-note">
            {ticket.used ? '입장 완료 · QR 비활성' : '경기장 게이트에서 스캔하세요 (45초 후 자동 갱신)'}
          </p>
          <dl className="back-facts">
            <div><dt>소유자</dt><dd>{owner}</dd></div>
            <div><dt>Token</dt><dd>{ticket.tokenId}</dd></div>
          </dl>
        </div>
      </div>
      <button type="button" className="flip-btn" onClick={onFlip}>
        {flipped ? '카드 앞면' : '입장 QR 보기'}
      </button>
    </div>
  )
}

export default function App() {
  const [verified, setVerified] = useState(true)
  const [games, setGames] = useState(initialGames)
  const [selectedGameId, setSelectedGameId] = useState(initialGames[0].id)
  const [selectedSeatId, setSelectedSeatId] = useState(null)
  const [tickets, setTickets] = useState(initialTickets)
  const [listings, setListings] = useState(initialListings)
  const [flipped, setFlipped] = useState({})
  const [toast, setToast] = useState(null)

  const selectedGame = games.find((game) => game.id === selectedGameId)
  const selectedSeat = selectedGame?.seats.find((seat) => seat.id === selectedSeatId) || null
  const owner = verified ? WALLET_NAME : 'guest.wallet'

  const checklist = useMemo(
    () => [
      { label: '실명 인증된 팬 (GIWA 검증)', done: verified },
      { label: '정가 이하 가격 확인', done: Boolean(selectedSeat) },
      { label: 'NFT 입장권 즉시 발급 준비', done: Boolean(selectedSeat) && verified },
    ],
    [verified, selectedSeat]
  )

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const showToast = (message, tone = 'ok') => setToast({ id: Date.now(), message, tone })
  const toggleFlip = (tokenId) => setFlipped((prev) => ({ ...prev, [tokenId]: !prev[tokenId] }))

  const handleSelectGame = (id) => {
    setSelectedGameId(id)
    setSelectedSeatId(null)
  }

  const buySelectedSeat = () => {
    if (!verified) {
      showToast('실명 인증된 팬만 예매할 수 있어요. 지갑 인증을 완료해 주세요.', 'warn')
      return
    }
    if (!selectedGame || !selectedSeat) return

    setGames((prev) =>
      prev.map((game) =>
        game.id === selectedGame.id
          ? { ...game, seats: game.seats.map((seat) => (seat.id === selectedSeat.id ? { ...seat, sold: true } : seat)) }
          : game
      )
    )

    const tokenId = `KBO-${Date.now().toString().slice(-6)}`
    setTickets((prev) => [
      {
        tokenId,
        home: selectedGame.home,
        away: selectedGame.away,
        date: `${selectedGame.date.md} ${selectedGame.date.dow} ${selectedGame.date.time}`,
        seat: `${selectedSeat.zone} ${selectedSeat.row}열 ${selectedSeat.seat}번`,
        price: selectedSeat.price,
        faceValue: selectedSeat.price,
        used: false,
      },
      ...prev,
    ])
    setSelectedSeatId(null)
    showToast('예매 완료! 내 컬렉션에 NFT 입장권이 발급됐어요.')
  }

  const acceptListing = (id) => {
    const listing = listings.find((item) => item.id === id)
    if (!listing) return
    if (!verified) {
      showToast('검증된 팬만 양도받을 수 있어요.', 'warn')
      return
    }
    setListings((prev) => prev.filter((item) => item.id !== id))
    setTickets((prev) => [
      {
        tokenId: `KBO-TX${Date.now().toString().slice(-5)}`,
        home: listing.home,
        away: listing.away,
        date: listing.date,
        seat: listing.seat,
        price: listing.price,
        faceValue: listing.faceValue,
        used: false,
      },
      ...prev,
    ])
    showToast(`${listing.seller} 님의 티켓을 정가 이하로 안전하게 양도받았어요.`)
  }

  const listOwnedTicket = (tokenId) => {
    const ticket = tickets.find((item) => item.tokenId === tokenId)
    if (!ticket || ticket.used) return
    setTickets((prev) => prev.filter((item) => item.tokenId !== tokenId))
    setListings((prev) => [
      {
        id: `owned-${tokenId}`,
        home: ticket.home,
        away: ticket.away,
        date: ticket.date,
        seat: ticket.seat,
        seller: WALLET_NAME,
        price: Math.max(ticket.faceValue - 3000, 1000),
        faceValue: ticket.faceValue,
      },
      ...prev,
    ])
    showToast('보유 티켓을 정가 이하 양도 마켓에 등록했어요.')
  }

  const useTicket = (tokenId) => {
    let changed = false
    setTickets((prev) =>
      prev.map((item) => {
        if (item.tokenId === tokenId && !item.used) {
          changed = true
          return { ...item, used: true }
        }
        return item
      })
    )
    if (!changed) return
    showToast('입장 처리 완료! 이 티켓은 기념 NFT로 영구 소장돼요.')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="직관 홈">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#fff" /><path d="M6 6 Q9 12 6 18 M18 6 Q15 12 18 18" stroke="#e8131d" strokeWidth="1.6" fill="none" strokeDasharray="1.2 3" strokeLinecap="round" /></svg>
          </span>
          <span className="brand-word">직관<em>JIKGWAN</em></span>
        </a>
        <nav className="main-nav" aria-label="주요 화면">
          <a href="#games">예매</a>
          <a href="#market">양도</a>
          <a href="#collection">내 컬렉션</a>
        </nav>
        <button className={`wallet-chip${verified ? '' : ' unverified'}`} type="button" onClick={() => setVerified((p) => !p)}>
          <span className="status-dot" aria-hidden="true" />
          <span>{verified ? WALLET_NAME : '미인증 지갑'}</span>
          {verified && <span className="chip-verify">인증</span>}
        </button>
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="heroTitle">
          <img src="/assets/ballpark-ticket-gate.png" alt="" className="hero-media" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">KBO 공식 검증 티켓 · 블록체인 소유 증명</p>
            <h1 id="heroTitle">검증된 팬만,<br />정가 그대로.</h1>
            <p className="hero-sub">
              실명 인증된 진짜 팬만 예매하고, 못 가는 날엔 정가 이하로만 안전하게 양도하세요.
              모든 입장권은 구단별 한정판 NFT 카드로 소장됩니다.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#games">경기 예매하기</a>
              <a className="secondary-link" href="#market">양도 티켓 둘러보기</a>
            </div>
          </div>
          <div className="hero-metrics" aria-label="서비스 핵심 가치">
            <div><strong>실명 인증 팬 전용</strong><span>봇·매크로 원천 차단</span></div>
            <div><strong>정가 이하 양도</strong><span>암표·웃돈 거래 불가</span></div>
            <div><strong>NFT 한정판 입장권</strong><span>경기 후에도 영구 소장</span></div>
          </div>
        </section>

        <section className="workspace" id="games" aria-label="경기 예매">
          <div className="section-heading">
            <p className="eyebrow">예매</p>
            <h2>오늘의 KBO 경기</h2>
            <p className="section-desc">검증된 팬만 정가에 예매할 수 있는 1차 발권 경기입니다.</p>
          </div>

          <div className="game-rows">
            {games.map((game) => {
              const home = TEAMS[game.home]
              const away = TEAMS[game.away]
              const isActive = game.id === selectedGameId
              const available = game.seats.filter((seat) => !seat.sold).length
              return (
                <article key={game.id} className={`game-row${isActive ? ' active' : ''}`}>
                  <div className="row-date">
                    <strong>{game.date.md}</strong>
                    <span className={game.date.dow === '일' ? 'sun' : game.date.dow === '토' ? 'sat' : ''}>
                      ({game.date.dow}) {game.date.time}
                    </span>
                  </div>
                  <div className="row-match">
                    <div className="side">
                      <TeamCrest code={game.away} />
                      <span>{away.short}</span>
                    </div>
                    <span className="vs">VS</span>
                    <div className="side">
                      <TeamCrest code={game.home} />
                      <span><i className="home-tag">홈</i>{home.short}</span>
                    </div>
                  </div>
                  <div className="row-badges">
                    {game.badges.map((badge) => (
                      <span key={badge} className={`badge${badge.includes('매진') ? ' hot' : ''}`}>{badge}</span>
                    ))}
                  </div>
                  <div className="row-venue">
                    <span>{VENUE[game.home]}</span>
                    <span className="seats-left">잔여 {available}석</span>
                  </div>
                  <button type="button" className={`row-cta${isActive ? ' on' : ''}`} onClick={() => handleSelectGame(game.id)}>
                    {isActive ? '선택됨' : '예매하기'}
                  </button>
                </article>
              )
            })}
          </div>

          <div className="booking-layout">
            <section className="seat-panel" aria-label="좌석 선택">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">좌석 선택</p>
                  <h3>{selectedGame ? `${TEAMS[selectedGame.away].short} vs ${TEAMS[selectedGame.home].short}` : '경기를 선택하세요'}</h3>
                </div>
                <span className="pill">{selectedGame ? VENUE[selectedGame.home] : '-'}</span>
              </div>
              <div className="field-view" aria-hidden="true"><div className="infield" /><span>GROUND</span></div>
              <div className="seat-legend">
                <span><i className="dot avail" />선택 가능</span>
                <span><i className="dot pick" />선택</span>
                <span><i className="dot sold" />매진</span>
              </div>
              <div className="seat-map">
                {selectedGame?.seats.map((seat) => {
                  const selected = seat.id === selectedSeatId
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={`seat-button${seat.sold ? ' sold' : ''}${selected ? ' selected' : ''}`}
                      disabled={seat.sold}
                      aria-label={`${seat.zone} ${seat.row}열 ${seat.seat}번 ${formatWon(seat.price)}`}
                      onClick={() => setSelectedSeatId(seat.id)}
                    >
                      {seat.label}
                    </button>
                  )
                })}
              </div>
            </section>

            <aside className="checkout-panel" aria-label="예매 정보">
              <div className="wallet-card" id="wallet">
                <div className="panel-header compact">
                  <div>
                    <p className="eyebrow">내 인증</p>
                    <h3>{owner}</h3>
                  </div>
                  <span className={verified ? 'verified-badge' : 'danger-badge'}>{verified ? '실명 인증' : '미인증'}</span>
                </div>
                <dl className="wallet-details">
                  <div><dt>지갑 주소</dt><dd>{verified ? WALLET_ADDRESS : '0xfa10...99b0'}</dd></div>
                  <div><dt>본인확인</dt><dd>업비트 실명 (KYC)</dd></div>
                  <div><dt>팬 등급</dt><dd>LG 트윈스 시즌 멤버</dd></div>
                </dl>
              </div>

              <div className="summary-box">
                <p className="eyebrow">예매 요약</p>
                {selectedGame && selectedSeat ? (
                  <div className="summary-details">
                    <div className="summary-row"><span>경기</span><strong>{TEAMS[selectedGame.away].short} vs {TEAMS[selectedGame.home].short}</strong></div>
                    <div className="summary-row"><span>좌석</span><strong>{selectedSeat.zone} {selectedSeat.row}열 {selectedSeat.seat}번</strong></div>
                    <div className="summary-row total"><span>결제 금액</span><strong>{formatWon(selectedSeat.price)}</strong></div>
                  </div>
                ) : (
                  <div className="summary-empty">좌석을 선택하면 결제 정보가 표시됩니다.</div>
                )}
                <button className="primary-button" type="button" disabled={!selectedSeat || !verified} onClick={buySelectedSeat}>
                  {verified ? '예매하기' : '지갑 인증이 필요해요'}
                </button>
              </div>

              <div className="trust-box">
                <p className="eyebrow">안심 예매</p>
                <ul>
                  {checklist.map((item) => (
                    <li key={item.label} className={item.done ? 'done' : ''}>
                      <span className="check" aria-hidden="true">{item.done ? '✓' : ''}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="workspace alt" id="market" aria-label="정가 이하 양도">
          <div className="section-heading">
            <p className="eyebrow">양도</p>
            <h2>정가 이하 안심 양도</h2>
            <p className="section-desc">못 가게 된 팬이 내놓은 티켓을 정가 이하로만 거래합니다. 웃돈·암표는 구조적으로 불가능해요.</p>
          </div>
          <div className="listing-grid">
            {listings.map((listing) => {
              const home = TEAMS[listing.home]
              const away = TEAMS[listing.away]
              const save = listing.faceValue - listing.price
              return (
                <article key={listing.id} className="listing-card">
                  <div className="listing-top" style={{ background: `linear-gradient(120deg, ${home.primary}, ${home.deep})` }}>
                    <div className="listing-match">
                      <TeamCrest code={listing.away} size={34} />
                      <span className="lvs">VS</span>
                      <TeamCrest code={listing.home} size={34} />
                    </div>
                    <span className="listing-date">{listing.date}</span>
                  </div>
                  <div className="listing-body">
                    <h3>{away.short} <em>vs</em> {home.short}</h3>
                    <p className="listing-seat">{listing.seat}</p>
                    <p className="listing-venue">{VENUE[listing.home]}</p>
                    <div className="listing-seller"><span className="status-dot" />{listing.seller} · 검증된 팬</div>
                    <div className="listing-foot">
                      <div className="price-block">
                        <strong>{formatWon(listing.price)}</strong>
                        <span className="face">정가 {formatWon(listing.faceValue)}</span>
                        {save > 0 && <span className="save">{formatWon(save)} 절약</span>}
                      </div>
                      <button className="primary-button slim" type="button" onClick={() => acceptListing(listing.id)}>양도받기</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="workspace" id="collection" aria-label="내 NFT 컬렉션">
          <div className="section-heading">
            <p className="eyebrow">내 컬렉션</p>
            <h2>나의 직관 NFT 카드</h2>
            <p className="section-desc">예매·양도받은 입장권이 구단별 한정판 카드로 발급됩니다. 경기가 끝나도 영원히 내 것이에요.</p>
          </div>
          {tickets.length === 0 ? (
            <div className="empty-ticket">아직 보유한 티켓이 없어요. 경기를 예매하거나 양도받으면 NFT 카드가 발급됩니다.</div>
          ) : (
            <div className="collection-grid">
              {tickets.map((ticket) => (
                <div key={ticket.tokenId} className="ticket-slot">
                  <CollectibleCard ticket={ticket} owner={owner} flipped={Boolean(flipped[ticket.tokenId])} onFlip={() => toggleFlip(ticket.tokenId)} />
                  <div className="ticket-info">
                    <div className="ticket-info-head">
                      <strong>{TEAMS[ticket.away].short} vs {TEAMS[ticket.home].short}</strong>
                      <span className={`ticket-state${ticket.used ? ' used' : ''}`}>{ticket.used ? '입장 완료' : '입장 가능'}</span>
                    </div>
                    <p>{ticket.date} · {ticket.seat}</p>
                    <div className="ticket-actions">
                      <button className="ghost-button" type="button" disabled={ticket.used} onClick={() => listOwnedTicket(ticket.tokenId)}>정가 이하 양도</button>
                      <button className="ghost-button strong" type="button" disabled={ticket.used} onClick={() => useTicket(ticket.tokenId)}>입장 처리</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="site-foot">
        <div className="brand"><span className="brand-word">직관<em>JIKGWAN</em></span></div>
        <p>검증된 팬만, 정가 그대로. · GIWA 블록체인 기반 KBO 검증 티켓</p>
      </footer>

      <nav className="mobile-tab-bar" aria-label="모바일 주요 화면">
        <a href="#games"><svg className="tab-icon" viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" /></svg><span>예매</span></a>
        <a href="#market"><svg className="tab-icon" viewBox="0 0 24 24"><path d="M4 7h12l-2-2m4 12H6l2 2" /></svg><span>양도</span></a>
        <a href="#collection"><svg className="tab-icon" viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 8h6M9 12h6" /></svg><span>컬렉션</span></a>
      </nav>

      {toast && <div className={`toast ${toast.tone}`} key={toast.id}>{toast.message}</div>}
    </div>
  )
}
