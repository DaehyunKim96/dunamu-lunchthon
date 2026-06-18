import { useEffect, useMemo, useRef, useState } from 'react'
import { useWallet, shortAddr, METAMASK_INSTALL_URL } from './useWallet'
import {
  KRW_TO_WEI,
  findEvent,
  getLogsInRange,
  getWalletClient,
  giwaSepolia,
  idHash,
  krwToWei,
  pofTicketContracts,
  primarySaleAbi,
  publicClient,
  ticketAbi,
  transferMarketAbi,
} from './contracts/giwaSepolia'

const EXPLORER = giwaSepolia.blockExplorers.default.url
const DOJANG_GUIDE = 'https://docs.giwa.io/giwa-ecosystem/dojang'

// 실제 GIWA Sepolia 배포 주소 (contract/deployments/giwa-sepolia.json)
const CONTRACTS = {
  ticket: pofTicketContracts.ticket,
  sale: pofTicketContracts.primarySale,
  market: pofTicketContracts.transferMarket,
}

/* ── KBO 구단 레지스트리 ─────────────────────────────────────── */
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
  LG: '서울 잠실야구장', OB: '서울 잠실야구장', HT: '광주-기아 챔피언스 필드', SS: '대구 삼성라이온즈파크',
  LT: '부산 사직야구장', HH: '대전 한화생명 볼파크', SK: '인천 SSG 랜더스필드', KT: '수원 케이티 위즈파크',
  NC: '창원 NC파크', KW: '서울 고척스카이돔',
}

function createSeats(prefix, basePrice, soldIds) {
  return Array.from({ length: 32 }, (_, index) => {
    const id = `${prefix}${String(index + 1).padStart(2, '0')}`
    const row = Math.floor(index / 8) + 1
    const seat = (index % 8) + 1
    const zone = row === 1 ? '1루 테이블석' : row === 2 ? '1루 내야지정석' : row === 3 ? '블루석' : '응원지정석'
    return { id, label: id, zone, row, seat, price: basePrice - (row - 1) * 6000, sold: soldIds.includes(id) }
  })
}

const initialGames = [
  { id: 'g1', home: 'LG', away: 'OB', date: { md: '06.19', dow: '금', time: '18:30' }, badges: ['검증예매', '온체인 발권'], seats: createSeats('A', 54000, ['A03', 'A04', 'A15', 'A16', 'A21', 'A27']) },
  { id: 'g2', home: 'LG', away: 'SS', date: { md: '06.24', dow: '수', time: '18:30' }, badges: ['검증예매', '취소표 알림'], seats: createSeats('B', 50000, ['B02', 'B11', 'B12', 'B24', 'B30']) },
  { id: 'g3', home: 'HT', away: 'SK', date: { md: '06.20', dow: '토', time: '17:00' }, badges: ['검증예매', '온체인 발권'], seats: createSeats('C', 47000, ['C01', 'C09', 'C18', 'C19', 'C25']) },
  { id: 'g4', home: 'LT', away: 'HH', date: { md: '06.21', dow: '일', time: '17:00' }, badges: ['검증예매', '매진임박'], seats: createSeats('D', 44000, ['D05', 'D06', 'D07', 'D14', 'D22', 'D28', 'D29']) },
]

const initialListings = [
  { id: 'l1', home: 'LG', away: 'SS', dateText: '2026.06.24 18:30', grade: '외야 그린석', block: '402블록', row: '19열', qty: 2, pricePer: 7000, faceValue: 10000, seller: 'hyejin.up.id', tokenId: 7421 },
  { id: 'l2', home: 'LG', away: 'SS', dateText: '2026.06.24 18:30', grade: '외야 그린석', block: '418블록', row: '10열', qty: 2, pricePer: 8000, faceValue: 10000, seller: 'doyoon.up.id', tokenId: 7388 },
  { id: 'l3', home: 'HT', away: 'SK', dateText: '2026.06.20 17:00', grade: '1루 내야지정석', block: '114블록', row: '8열', qty: 1, pricePer: 39000, faceValue: 43000, seller: 'seoha.up.id', tokenId: 6610 },
  { id: 'l4', home: 'KW', away: 'NC', dateText: '2026.06.20 17:00', grade: '응원지정석', block: '303블록', row: '4열', qty: 2, pricePer: 28000, faceValue: 33000, seller: 'jiwoo.up.id', tokenId: 5902 },
  { id: 'l5', home: 'NC', away: 'HT', dateText: '2026.06.23 18:30', grade: '1루 테이블석', block: 'T2', row: '2열', qty: 2, pricePer: 52000, faceValue: 58000, seller: 'minseo.up.id', tokenId: 4471 },
  { id: 'l6', home: 'LT', away: 'HH', dateText: '2026.06.21 17:00', grade: '3루 내야지정석', block: '207블록', row: '11열', qty: 1, pricePer: 36000, faceValue: 40000, seller: 'taeyang.up.id', tokenId: 3920 },
]

const initialTickets = [
  { tokenId: 'KBO-480000', home: 'LG', away: 'OB', date: '06.14 토 17:00', seat: '1루 테이블석 1열 5번', price: 54000, faceValue: 54000, used: false },
  { tokenId: 'KBO-480002', home: 'HH', away: 'LT', date: '06.12 목 18:30', seat: '1루 내야지정석 209블록 6열 8번', price: 32000, faceValue: 32000, used: false },
  { tokenId: 'KBO-480003', home: 'HT', away: 'SK', date: '06.08 일 17:00', seat: '응원지정석 305블록 3열 11번', price: 24000, faceValue: 24000, used: true },
  { tokenId: 'KBO-480102', home: 'NC', away: 'KW', date: '06.05 목 18:30', seat: '응원지정석 112블록 9열 2번', price: 22000, faceValue: 22000, used: false },
]

// register-demo-seats.cjs가 같은 규칙으로 등록한 좌석이므로, gameId 해시로 어느 경기인지 역추적할 수 있다.
const GAME_TEAMS_BY_HASH = Object.fromEntries(initialGames.map((g) => [idHash(g.id), { home: g.home, away: g.away }]))
function gradeForRow(row) {
  return row === 1 ? '1루 테이블석' : row === 2 ? '1루 내야지정석' : row === 3 ? '블루석' : '응원지정석'
}
function formatAgo(atMs) {
  const diff = Date.now() - atMs
  if (diff < 60_000) return '방금'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`
  return `${Math.floor(diff / 86_400_000)}일 전`
}

// 사이드바의 "최근 온체인 거래"는 mock이 아니라 PrimaryTicketSale/TicketTransferMarket의
// 실제 이벤트 로그를 읽어 채운다.
async function loadRecentOnchainTrades() {
  const saleEvent = primarySaleAbi.find((x) => x.type === 'event' && x.name === 'SeatPurchased')
  const transferEvent = transferMarketAbi.find((x) => x.type === 'event' && x.name === 'TicketTransferred')
  try {
    const [purchaseLogs, transferLogs] = await Promise.all([
      getLogsInRange({ address: CONTRACTS.sale, event: saleEvent }),
      getLogsInRange({ address: CONTRACTS.market, event: transferEvent }),
    ])

    const merged = [...purchaseLogs, ...transferLogs]
      .sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) return b.blockNumber > a.blockNumber ? 1 : -1
        return Number(b.logIndex) - Number(a.logIndex)
      })
      .slice(0, 8)

    const blockNumbers = [...new Set(merged.map((l) => l.blockNumber))]
    const blocks = await Promise.all(blockNumbers.map((bn) => publicClient.getBlock({ blockNumber: bn })))
    const blockTimeMs = new Map(blockNumbers.map((bn, i) => [bn, Number(blocks[i].timestamp) * 1000]))

    return await Promise.all(
      merged.map(async (log) => {
        let row
        let gameId
        let priceWei
        if (log.eventName === 'SeatPurchased') {
          const listing = await publicClient.readContract({ address: CONTRACTS.sale, abi: primarySaleAbi, functionName: 'seatListing', args: [log.args.seatKey] })
          row = listing.row
          gameId = listing.gameId
          priceWei = log.args.priceWei
        } else {
          const meta = await publicClient.readContract({ address: CONTRACTS.ticket, abi: ticketAbi, functionName: 'ticketMeta', args: [log.args.tokenId] })
          row = meta.row
          gameId = meta.gameId
          priceWei = log.args.priceWei
        }
        const teams = GAME_TEAMS_BY_HASH[gameId]
        return {
          key: `${log.transactionHash}-${log.logIndex}`,
          hash: log.transactionHash,
          match: teams ? `${TEAMS[teams.away].short} vs ${TEAMS[teams.home].short}` : '알 수 없는 경기',
          grade: gradeForRow(row),
          price: Number(priceWei / KRW_TO_WEI),
          ago: formatAgo(blockTimeMs.get(log.blockNumber)),
        }
      })
    )
  } catch (err) {
    console.error('loadRecentOnchainTrades failed', err)
    return []
  }
}

// 좌석이 실제로 판매됐는지는 React state가 아니라 SeatPurchased 로그가 진실이다.
// 새로고침해도 같은 좌석을 다시 살 수 있으면 안 되므로, 매번 체인에서 다시 읽어 games에 병합한다.
async function loadOnchainSoldSeatIds() {
  const saleEvent = primarySaleAbi.find((x) => x.type === 'event' && x.name === 'SeatPurchased')
  try {
    const logs = await getLogsInRange({ address: CONTRACTS.sale, event: saleEvent })
    const soldByGame = {}
    await Promise.all(
      logs.map(async (log) => {
        const listing = await publicClient.readContract({ address: CONTRACTS.sale, abi: primarySaleAbi, functionName: 'seatListing', args: [log.args.seatKey] })
        const game = initialGames.find((g) => idHash(g.id) === listing.gameId)
        const seat = game?.seats[(listing.row - 1) * 8 + (listing.seat - 1)]
        if (!game || !seat) return
        soldByGame[game.id] = soldByGame[game.id] || new Set()
        soldByGame[game.id].add(seat.id)
      })
    )
    return soldByGame
  } catch (err) {
    console.error('loadOnchainSoldSeatIds failed', err)
    return {}
  }
}

function formatGameDate(startTimeSec) {
  const kst = new Date(Number(startTimeSec) * 1000 + 9 * 3_600_000)
  const md = `${String(kst.getUTCMonth() + 1).padStart(2, '0')}.${String(kst.getUTCDate()).padStart(2, '0')}`
  const dow = ['일', '월', '화', '수', '목', '금', '토'][kst.getUTCDay()]
  const hhmm = `${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`
  return `${md} ${dow} ${hhmm}`
}

// "내 티켓"도 마찬가지로 로컬 state만 믿으면 새로고침 시 사라진다.
// Transfer 이벤트로 지갑이 현재 들고 있는 토큰을 매번 체인에서 다시 계산한다.
async function loadOwnedOnchainTickets(address) {
  if (!address) return []
  const transferEvent = ticketAbi.find((x) => x.type === 'event' && x.name === 'Transfer')
  try {
    const [toLogs, fromLogs] = await Promise.all([
      getLogsInRange({ address: CONTRACTS.ticket, event: transferEvent, args: { to: address } }),
      getLogsInRange({ address: CONTRACTS.ticket, event: transferEvent, args: { from: address } }),
    ])

    const latestByToken = new Map()
    for (const log of [...toLogs, ...fromLogs]) {
      const key = log.args.tokenId.toString()
      const prev = latestByToken.get(key)
      if (!prev || log.blockNumber > prev.blockNumber || (log.blockNumber === prev.blockNumber && log.logIndex > prev.logIndex)) {
        latestByToken.set(key, log)
      }
    }
    const ownedIds = [...latestByToken.values()].filter((log) => log.args.to.toLowerCase() === address.toLowerCase()).map((log) => log.args.tokenId)

    return await Promise.all(
      ownedIds.map(async (tokenId) => {
        const [meta, status] = await Promise.all([
          publicClient.readContract({ address: CONTRACTS.ticket, abi: ticketAbi, functionName: 'ticketMeta', args: [tokenId] }),
          publicClient.readContract({ address: CONTRACTS.ticket, abi: ticketAbi, functionName: 'tokenStatus', args: [tokenId] }),
        ])
        const teams = GAME_TEAMS_BY_HASH[meta.gameId] || { home: 'LG', away: 'LG' }
        return {
          tokenId: `KBO-${tokenId}`,
          realTokenId: tokenId,
          onchain: true,
          home: teams.home,
          away: teams.away,
          date: formatGameDate(meta.startTime),
          seat: `${gradeForRow(meta.row)} ${meta.row}열 ${meta.seat}번`,
          price: meta.faceValueKrw,
          faceValue: meta.faceValueKrw,
          used: status !== 0,
        }
      })
    )
  } catch (err) {
    console.error('loadOwnedOnchainTickets failed', err)
    return []
  }
}

/* ── 유틸 ─────────────────────────────────────────────────────── */
const RARITIES = {
  common: { key: 'common', label: 'COMMON', stars: 1 }, rare: { key: 'rare', label: 'RARE', stars: 2 },
  epic: { key: 'epic', label: 'EPIC', stars: 3 }, legendary: { key: 'legendary', label: 'LEGENDARY', stars: 4 },
}
const POSITIONS = ['투수', '포수', '내야수', '외야수', '지명타자']
const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '한', '오', '서', '신', '권', '류', '전']
const GIVENS = ['도윤', '지훈', '현우', '민준', '서준', '강민', '태경', '승호', '준영', '재현', '시우', '하준', '연우', '지운', '성진', '우진']

function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function deriveCard(tokenId, teamCode, zone = '') {
  const seed = hashSeed(`${teamCode}-${tokenId}`)
  let score = seed % 100
  if (zone.includes('테이블')) score += 42
  else if (zone.includes('내야')) score += 18
  const rarity = score >= 90 ? RARITIES.legendary : score >= 70 ? RARITIES.epic : score >= 40 ? RARITIES.rare : RARITIES.common
  const number = ((seed >>> 3) % 98) + 1
  const position = POSITIONS[(seed >>> 7) % POSITIONS.length]
  const playerName = `${SURNAMES[(seed >>> 9) % SURNAMES.length]}${GIVENS[(seed >>> 13) % GIVENS.length]}`
  const pose = position === '투수' ? 'pitch' : 'bat'
  const serial = String(((seed >>> 2) % 1500) + 1).padStart(4, '0')
  return { seed, rarity, number, position, playerName, pose, serial }
}
const formatWon = (v) => `${v.toLocaleString('ko-KR')}원`
function randTxHash() {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 64; i += 1) s += hex[Math.floor(Math.random() * 16)]
  return s
}
const shortHash = (h) => `${h.slice(0, 10)}…${h.slice(-6)}`
function qrCells(seed) {
  const digits = seed.replace(/\D/g, '').padEnd(16, '7')
  return Array.from({ length: 49 }, (_, i) => {
    const active = (i + Number(digits[i % digits.length])) % 3 !== 0
    return <span key={i} className={active ? '' : 'blank'} />
  })
}

/* ── 작은 컴포넌트 ────────────────────────────────────────────── */
function TeamCrest({ code, size = 44 }) {
  const team = TEAMS[code]
  return (
    <span className="crest" style={{ width: size, height: size, background: team.primary, color: team.trim === '#000000' ? '#fff' : team.trim }} aria-hidden="true">
      <span className="crest-initial" style={{ fontSize: size * (team.initial.length > 1 ? 0.34 : 0.46) }}>{team.initial}</span>
    </span>
  )
}
function VerifiedMark({ size = 16 }) {
  return (
    <svg className="verified-mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.2 4.6 5.4v5.2c0 4.6 3.1 8.5 7.4 9.9 4.3-1.4 7.4-5.3 7.4-9.9V5.4L12 2.2Z" fill="currentColor" />
      <path d="M8.4 12.2 11 14.8l4.8-5" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ShieldIdIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="shieldIdGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff5a4e" />
          <stop offset="1" stopColor="#c4121d" />
        </linearGradient>
      </defs>
      <path
        d="M24 3.5 41 9.6v13.1c0 11.2-7.1 19.9-17 22.3-9.9-2.4-17-11.1-17-22.3V9.6L24 3.5Z"
        fill="url(#shieldIdGrad)"
        stroke="#7a0f17"
        strokeWidth="1.4"
      />
      <path
        d="M24 7.4 10.6 12v10.7c0 9.1 5.6 16.1 13.4 18.3 7.8-2.2 13.4-9.2 13.4-18.3V12L24 7.4Z"
        fill="rgba(255,255,255,0.14)"
      />
      <circle cx="24" cy="19.5" r="5.4" fill="#fff" />
      <path
        d="M14.6 33.4c1.4-5.1 5.1-7.8 9.4-7.8s8 2.7 9.4 7.8c-2.7 2.6-5.9 4.3-9.4 5.2-3.5-0.9-6.7-2.6-9.4-5.2Z"
        fill="#fff"
      />
    </svg>
  )
}
function ChainTag({ children }) {
  return (
    <span className="chain-tag">
      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M9 12a3 3 0 0 1 3-3h3a3 3 0 1 1 0 6h-1m-2 0H9a3 3 0 1 1 0-6h1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      {children}
    </span>
  )
}
function MascotArt({ code, pose }) {
  const t = TEAMS[code]
  const dark = '#1b2230'
  return (
    <svg className="mascot-art" viewBox="0 0 260 300" role="img" aria-label={`${t.name} 마스코트`}>
      <ellipse cx="130" cy="282" rx="74" ry="12" fill="rgba(0,0,0,0.22)" />
      <g transform={pose === 'pitch' ? 'rotate(-58 196 120)' : 'rotate(34 188 196)'}>
        <rect x="182" y={pose === 'pitch' ? 40 : 150} width="14" height="118" rx="7" fill="#caa472" />
        <rect x="182" y={pose === 'pitch' ? 138 : 248} width="14" height="22" rx="6" fill="#9c7a4f" />
      </g>
      <rect x="108" y="222" width="16" height="48" rx="8" fill={dark} />
      <rect x="136" y="222" width="16" height="48" rx="8" fill={dark} />
      <ellipse cx="110" cy="272" rx="17" ry="8" fill="#fff" />
      <ellipse cx="150" cy="272" rx="17" ry="8" fill="#fff" />
      <circle cx="130" cy="142" r="80" fill="#ffffff" stroke="#e4e9f0" strokeWidth="2" />
      <path d="M72 92 Q50 142 72 192" fill="none" stroke="#e8131d" strokeWidth="3.4" strokeDasharray="2 8" strokeLinecap="round" />
      <path d="M188 92 Q210 142 188 192" fill="none" stroke="#e8131d" strokeWidth="3.4" strokeDasharray="2 8" strokeLinecap="round" />
      <rect x="40" y="184" width="42" height="15" rx="7.5" fill="#fff" stroke="#e4e9f0" strokeWidth="1.5" transform="rotate(18 61 191)" />
      <rect x="176" y={pose === 'pitch' ? 150 : 182} width="42" height="15" rx="7.5" fill="#fff" stroke="#e4e9f0" strokeWidth="1.5" transform={pose === 'pitch' ? 'rotate(-44 197 157)' : 'rotate(-26 197 189)'} />
      <path d="M66 122 Q130 56 194 122 Q130 90 66 122 Z" fill={t.primary} />
      <path d="M62 122 Q86 134 118 128 L116 140 Q82 144 58 132 Z" fill={t.deep} />
      <circle cx="130" cy="74" r="6" fill={t.trim === '#000000' ? '#fff' : t.trim} />
      <text x="138" y="116" textAnchor="middle" fontSize="22" fontWeight="900" fill={t.trim === '#000000' ? '#fff' : t.trim} fontFamily="Inter, sans-serif">{t.initial}</text>
      <ellipse cx="106" cy="170" rx="8" ry="4" fill={t.primary} opacity="0.22" />
      <ellipse cx="158" cy="170" rx="8" ry="4" fill={t.primary} opacity="0.22" />
      <circle cx="112" cy="154" r="7.5" fill={dark} /><circle cx="150" cy="154" r="7.5" fill={dark} />
      <circle cx="114" cy="151" r="2.2" fill="#fff" /><circle cx="152" cy="151" r="2.2" fill="#fff" />
      <path d="M118 176 Q131 188 144 176" fill="none" stroke={dark} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

/* ── 모드 전환 (시뮬레이션 ↔ 온체인) ──────────────────────────── */
function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="모드 전환">
      <button type="button" role="tab" aria-selected={mode === 'simulation'} className={mode === 'simulation' ? 'active' : ''} onClick={() => onChange('simulation')}>
        <span className="mode-dot" aria-hidden="true" />시뮬레이션
      </button>
      <button type="button" role="tab" aria-selected={mode === 'onchain'} className={mode === 'onchain' ? 'active onchain' : ''} onClick={() => onChange('onchain')}>
        <span className="mode-dot" aria-hidden="true" />온체인
      </button>
    </div>
  )
}

/* ── 지갑 칩 ──────────────────────────────────────────────────── */
function WalletChip({ wallet }) {
  const { status, verified, verifying, address, handle } = wallet
  if (status === 'disconnected') {
    return <button className="wallet-chip connect" type="button" onClick={wallet.connect}><span className="wallet-ico" aria-hidden="true">👛</span><span>지갑 연결</span></button>
  }
  if (status === 'connecting') {
    return <button className="wallet-chip" type="button" disabled><span className="spinner" aria-hidden="true" /><span>연결 중…</span></button>
  }
  if (status === 'wrong-network') {
    return <button className="wallet-chip unverified" type="button" onClick={wallet.switchNetwork}><span className="status-dot" aria-hidden="true" /><span>GIWA로 전환</span></button>
  }
  const label = handle || shortAddr(address)
  const state = verifying ? 'checking' : verified === true ? 'ok' : verified === false ? 'no' : 'unknown'
  return (
    <button className={`wallet-chip${state === 'ok' ? '' : ' unverified'}`} type="button" onClick={wallet.disconnect} title="연결 해제">
      <span className="status-dot" aria-hidden="true" />
      <span className="wallet-name">{label}</span>
      {state === 'checking' && <span className="chip-verify checking"><span className="spinner sm" />확인 중</span>}
      {state === 'ok' && <span className="chip-verify"><VerifiedMark size={13} />인증</span>}
      {state === 'no' && <span className="chip-verify danger">미인증</span>}
    </button>
  )
}

/* ── 인증 배너 (예매 탭 상단) ─────────────────────────────────── */
function VerifyBanner({ wallet, appMode, onSwitchMode }) {
  const { status, verified, verifying, address, handle, hasInjectedWallet } = wallet
  const connected = status === 'connected'

  if (appMode === 'simulation') {
    return (
      <div className="verify-banner ok">
        <div className="vb-icon" aria-hidden="true"><VerifiedMark size={22} /></div>
        <div className="vb-text">
          <strong>시뮬레이션 모드로 둘러보는 중이에요<span className="chip-demo">SIM</span></strong>
          <span>지갑 연결 없이 mock 데이터로 예매·양도·입장 흐름을 체험할 수 있어요. 실제 트랜잭션은 발생하지 않아요.</span>
        </div>
        <div className="vb-action">
          <button className="primary-button slim" type="button" onClick={() => onSwitchMode('onchain')}>온체인 모드로 전환</button>
        </div>
      </div>
    )
  }

  let tone = 'idle'
  let title = '지갑을 연결하고 검증된 팬으로 예매하세요'
  let desc = 'GIWA Dojang 실명 인증을 통과한 지갑만 예매·양도할 수 있어요.'
  if (status === 'wrong-network') { tone = 'warn'; title = 'GIWA Sepolia 네트워크로 전환이 필요해요'; desc = '검증과 발권은 GIWA 체인에서 처리됩니다.' }
  else if (connected && verifying) { tone = 'idle'; title = `${handle || shortAddr(address)} · 검증 확인 중`; desc = 'Dojang OnchainVerifier 를 조회하고 있어요.' }
  else if (connected && verified) { tone = 'ok'; title = `${handle || shortAddr(address)} · Dojang 인증 완료`; desc = 'Upbit Korea attester 기준 검증된 팬이에요. 실제 온체인 트랜잭션으로 예매할 수 있어요.' }
  else if (connected && verified === false) { tone = 'warn'; title = '아직 검증되지 않은 지갑이에요'; desc = 'Dojang에서 Verified Address를 발급받으면 예매할 수 있어요.' }

  return (
    <div className={`verify-banner ${tone}`}>
      <div className="vb-icon" aria-hidden="true">{tone === 'ok' ? <VerifiedMark size={22} /> : <ShieldIdIcon size={26} />}</div>
      <div className="vb-text">
        <strong>{title}</strong>
        <span>{desc}</span>
        {!connected && status !== 'wrong-network' && !hasInjectedWallet && (
          <span className="vb-subaction"><a href={METAMASK_INSTALL_URL} target="_blank" rel="noreferrer">MetaMask 설치 ↗</a></span>
        )}
      </div>
      <div className="vb-action">
        {!connected ? <button className="primary-button slim" type="button" onClick={wallet.connect}>지갑 연결</button>
          : status === 'wrong-network' ? <button className="primary-button slim" type="button" onClick={wallet.switchNetwork}>GIWA로 전환</button>
          : verified === false ? <a className="ghost-button slim" href={DOJANG_GUIDE} target="_blank" rel="noreferrer">Dojang 인증받기 ↗</a>
          : verified === null && !verifying ? <button className="ghost-button slim" type="button" onClick={wallet.recheck}>다시 확인</button>
          : <a className="ghost-button slim" href={`${EXPLORER}/address/${address}`} target="_blank" rel="noreferrer">{shortAddr(address)} ↗</a>}
      </div>
    </div>
  )
}

/* ── 온체인 트랜잭션 모달 (예매/양도 공용) ────────────────────── */
// tx.simulated (기본값 true): 시뮬레이션 모드/시드 매물용 가짜 진행률.
// tx.simulated === false: tx.execute(onSubmitted) 가 실제 walletClient.writeContract 를 호출하고
// 실제 tx hash/블록으로 진행 상태를 채운다.
const TX_STAGES = [
  { key: 'sign', label: '지갑 서명 요청', sub: 'GIWA 지갑에서 거래를 승인하세요', ms: 1100 },
  { key: 'broadcast', label: '트랜잭션 전송', sub: 'GIWA Sepolia 네트워크로 브로드캐스트', ms: 800 },
  { key: 'preconfirm', label: 'Flashblocks Preconfirm', sub: '약 200ms 만에 프리컨펌 수신', ms: 600 },
  { key: 'confirm', label: '블록 확정', sub: '1 confirmation 기록', ms: 1000 },
]
const REAL_TX_STAGES = [
  { key: 'sign', label: '지갑 서명 요청', sub: 'MetaMask에서 트랜잭션을 승인하세요' },
  { key: 'broadcast', label: '트랜잭션 전송', sub: 'GIWA Sepolia 네트워크로 브로드캐스트' },
  { key: 'confirm', label: '블록 확정 대기', sub: '1 confirmation 대기 중' },
]
function TxModal({ tx, onClose }) {
  const [stage, setStage] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const meta = useRef(tx.simulated === false ? {} : { hash: randTxHash(), block: 4821507 + Math.floor(Math.random() * 900) })
  const committed = useRef(false)
  const stages = tx.simulated === false ? REAL_TX_STAGES : TX_STAGES

  useEffect(() => {
    if (tx.simulated === false) {
      let alive = true
      tx.execute((hash) => { if (alive) { meta.current.hash = hash; setStage(2) } })
        .then((result) => {
          if (!alive) return
          meta.current = { ...meta.current, ...result }
          setDone(true)
          if (!committed.current) { committed.current = true; tx.onComplete?.(meta.current) }
        })
        .catch((err) => {
          if (!alive) return
          const message = err?.shortMessage || err?.message || '트랜잭션이 실패했어요.'
          setError(message)
          tx.onError?.(err)
        })
      return () => { alive = false }
    }

    let alive = true
    const timers = []
    let acc = 0
    TX_STAGES.forEach((s, i) => {
      acc += s.ms
      timers.push(setTimeout(() => alive && setStage(i + 1), acc))
    })
    timers.push(setTimeout(() => { if (alive) { setDone(true); if (!committed.current) { committed.current = true; tx.onComplete?.(meta.current) } } }, acc + 300))
    return () => { alive = false; timers.forEach(clearTimeout) }
  }, [tx])

  if (error) {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="modal tx-modal" onClick={(e) => e.stopPropagation()}>
          <div className="tx-head">
            <ChainTag>{tx.contract}.{tx.method}()</ChainTag>
            <h3>트랜잭션 실패</h3>
            <p>{error}</p>
          </div>
          <button className="primary-button" type="button" onClick={onClose}>닫기</button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={done ? onClose : undefined}>
      <div className="modal tx-modal" onClick={(e) => e.stopPropagation()}>
        {!done ? (
          <>
            <div className="tx-head">
              <ChainTag>{tx.contract}.{tx.method}()</ChainTag>
              <h3>{tx.title}</h3>
              <p>{tx.subtitle}</p>
            </div>
            <ol className="tx-stages">
              {stages.map((s, i) => {
                const st = i < stage ? 'done' : i === stage ? 'active' : 'wait'
                return (
                  <li key={s.key} className={st}>
                    <span className="tx-dot">{st === 'done' ? '✓' : st === 'active' ? <span className="spinner sm" /> : i + 1}</span>
                    <span className="tx-label"><strong>{s.label}</strong><em>{s.sub}</em></span>
                  </li>
                )
              })}
            </ol>
            {stage >= 2 && meta.current.hash && (
              <a className="tx-hash" href={`${EXPLORER}/tx/${meta.current.hash}`} target="_blank" rel="noreferrer">
                tx {shortHash(meta.current.hash)} ↗
              </a>
            )}
          </>
        ) : (
          <div className="tx-success">
            <div className="tx-check" aria-hidden="true"><VerifiedMark size={34} /></div>
            <h3>{tx.successTitle}</h3>
            <p>{tx.successText}</p>
            <dl className="tx-receipt">
              <div><dt>네트워크</dt><dd>GIWA Sepolia</dd></div>
              <div><dt>컨트랙트</dt><dd>{tx.contract}</dd></div>
              <div><dt>블록</dt><dd>#{Number(meta.current.block).toLocaleString()}</dd></div>
              <div><dt>Tx Hash</dt><dd><a href={`${EXPLORER}/tx/${meta.current.hash}`} target="_blank" rel="noreferrer">{shortHash(meta.current.hash)} ↗</a></dd></div>
            </dl>
            <button className="primary-button" type="button" onClick={onClose}>{tx.successCta || '확인'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── 좌석 선택 모달 ───────────────────────────────────────────── */
function SeatModal({ game, wallet, appMode, onClose, onCheckout }) {
  const [seatId, setSeatId] = useState(null)
  const simulating = appMode === 'simulation'
  const connected = simulating || wallet.status === 'connected'
  const verified = simulating || wallet.verified === true
  const home = TEAMS[game.home]
  const away = TEAMS[game.away]
  const seat = game.seats.find((s) => s.id === seatId) || null
  const canBuy = connected && verified && seat

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal seat-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="닫기">×</button>
        <div className="seat-modal-head">
          <div className="smh-match">
            <TeamCrest code={game.away} size={34} /><span className="smh-vs">VS</span><TeamCrest code={game.home} size={34} />
          </div>
          <div className="smh-info">
            <h3>{away.short} <em>vs</em> {home.short}</h3>
            <p>{game.date.md} ({game.date.dow}) {game.date.time} · {VENUE[game.home]}</p>
          </div>
          <ChainTag>온체인 발권</ChainTag>
        </div>

        <div className="seat-modal-body">
          <div className="seat-area">
            <div className="field-view" aria-hidden="true"><div className="infield" /><span>GROUND</span></div>
            <div className="seat-legend">
              <span><i className="dot avail" />선택 가능</span><span><i className="dot pick" />선택</span><span><i className="dot sold" />매진</span>
            </div>
            <div className="seat-map">
              {game.seats.map((s) => (
                <button key={s.id} type="button"
                  className={`seat-button${s.sold ? ' sold' : ''}${s.id === seatId ? ' selected' : ''}`}
                  disabled={s.sold} onClick={() => setSeatId(s.id)}
                  aria-label={`${s.zone} ${s.row}열 ${s.seat}번 ${formatWon(s.price)}`}>{s.label}</button>
              ))}
            </div>
          </div>

          <aside className="seat-summary">
            <p className="eyebrow">예매 요약</p>
            {seat ? (
              <div className="summary-details">
                <div className="summary-row"><span>좌석</span><strong>{seat.zone} {seat.row}열 {seat.seat}번</strong></div>
                <div className="summary-row total"><span>결제 금액 (정가)</span><strong>{formatWon(seat.price)}</strong></div>
              </div>
            ) : <div className="summary-empty">좌석을 선택하세요</div>}

            <ul className="trust-list">
              <li className={connected ? 'done' : ''}><span className="check">{connected ? '✓' : ''}</span>지갑 연결</li>
              <li className={verified ? 'done' : ''}><span className="check">{verified ? '✓' : ''}</span>Dojang 실명 인증</li>
              <li className="done"><span className="check">✓</span>구단 공식 정가 발행</li>
              <li className={canBuy ? 'done' : ''}><span className="check">{canBuy ? '✓' : ''}</span>NFT 입장권 즉시 발급</li>
            </ul>

            {!connected ? <button className="primary-button" type="button" onClick={wallet.connect}>지갑 연결하고 예매</button>
              : !verified ? <a className="primary-button as-link" href={DOJANG_GUIDE} target="_blank" rel="noreferrer">Dojang 인증이 필요해요</a>
              : <button className="primary-button" type="button" disabled={!seat} onClick={() => onCheckout(seat)}>
                  {seat ? `${formatWon(seat.price)} 결제하기` : '좌석을 선택하세요'}
                </button>}
            <p className="pay-note"><ChainTag>PrimaryTicketSale.purchase()</ChainTag> 로 온체인 발권돼요.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ── 거래소 상세/구매 모달 (티켓베이 스타일) ──────────────────── */
function ListingModal({ listing, wallet, appMode, onClose, onBuy }) {
  const simulating = appMode === 'simulation'
  const connected = simulating || wallet.status === 'connected'
  const verified = simulating || wallet.verified === true
  const home = TEAMS[listing.home]
  const away = TEAMS[listing.away]
  const total = listing.pricePer * listing.qty
  const save = (listing.faceValue - listing.pricePer) * listing.qty
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal listing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="닫기">×</button>
        <p className="eyebrow">상품 정보 · #{listing.tokenId}</p>
        <div className="lm-product">
          <div className="lm-tags"><span className="badge safe"><VerifiedMark size={12} />입장 안심</span><span className="badge under">정가 이하</span><ChainTag>온체인 에스크로</ChainTag></div>
          <p className="lm-breadcrumb">스포츠 › 야구 › {home.name} › {VENUE[listing.home]}</p>
          <p className="lm-date">경기 일시 <strong>{listing.dateText}</strong></p>
          <h3>vs {away.short} <em>|</em> {listing.block} <em>|</em> {listing.row}</h3>
          <p className="lm-grade">{listing.grade}</p>
        </div>

        <div className="lm-deal">
          <div className="lm-method">
            <p className="eyebrow">거래 방식</p>
            <label className="radio-row"><span className="radio on" />PIN(E-ticket) = <b>온체인 NFT 양도</b></label>
            <p className="lm-help">스마트컨트랙트가 정가 이하 가격과 검증된 팬 여부를 강제합니다. 결제 즉시 NFT 소유권이 이전돼요.</p>
            <div className="lm-chain-facts">
              <span>토큰 ID <b>#{listing.tokenId}</b></span>
              <span>판매자 <b>{listing.seller}</b> <VerifiedMark size={11} /></span>
              <a href={`${EXPLORER}/address/${CONTRACTS.market}`} target="_blank" rel="noreferrer">TicketTransferMarket ↗</a>
            </div>
          </div>
          <div className="lm-pay">
            <div className="lm-row"><span>티켓 보유 여부</span><b className="ok">현재 보유 중</b></div>
            <div className="lm-row"><span>한 매 가격</span><b><s>{formatWon(listing.faceValue)}</s> {formatWon(listing.pricePer)}</b></div>
            <div className="lm-row"><span>수량</span><b>{listing.qty}매{listing.qty > 1 ? '/연석' : ''}</b></div>
            <div className="lm-row total"><span>총 가격</span><b>{formatWon(total)}</b></div>
            {save > 0 && <p className="lm-save">정가 대비 {formatWon(save)} 절약</p>}
            {!connected ? <button className="primary-button" type="button" onClick={wallet.connect}>지갑 연결하고 양도받기</button>
              : !verified ? <a className="primary-button as-link" href={DOJANG_GUIDE} target="_blank" rel="noreferrer">Dojang 인증이 필요해요</a>
              : <button className="primary-button" type="button" onClick={() => onBuy(listing)}>양도받기 (온체인 정산)</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── NFT 컬렉션 카드 ──────────────────────────────────────────── */
function CollectibleCard({ ticket, owner, onFlip, flipped }) {
  const card = deriveCard(ticket.tokenId, ticket.home, ticket.seat)
  const team = TEAMS[ticket.home]
  return (
    <div className={`collectible rarity-${card.rarity.key}${flipped ? ' flipped' : ''}`}>
      <div className="collectible-inner">
        <div className="collectible-face front" style={{ '--team': team.primary, '--team-deep': team.deep, '--team-trim': team.trim === '#000000' ? '#dfe4ec' : team.trim }}>
          <div className="holo" aria-hidden="true" />
          <div className="card-head">
            <div className="card-team"><TeamCrest code={ticket.home} size={30} /><span>{team.name}</span></div>
            <span className="rarity-gem">{'★'.repeat(card.rarity.stars)}<em>{card.rarity.label}</em></span>
          </div>
          <div className="card-stage"><span className="jersey-no">{card.number}</span><MascotArt code={ticket.home} pose={card.pose} /></div>
          <div className="card-plate">
            <div className="plate-name"><strong>{card.playerName}</strong><span>{card.position} · {team.mascot} 에디션</span></div>
            <div className="plate-serial"><span>SERIAL</span><strong>#{card.serial} / 2026</strong></div>
          </div>
        </div>
        <div className="collectible-face back">
          <p className="back-eyebrow">입장권 · LIVE QR</p>
          <div className="qr" aria-label="동적 입장 QR">{qrCells(ticket.tokenId)}</div>
          <p className="back-note">{ticket.used ? '입장 완료 · QR 비활성' : '게이트에서 스캔 (45초 후 자동 갱신)'}</p>
          <dl className="back-facts">
            <div><dt>소유자</dt><dd>{owner}</dd></div>
            <div><dt>Token</dt><dd>{ticket.tokenId}</dd></div>
            <div><dt>컨트랙트</dt><dd><a href={`${EXPLORER}/address/${CONTRACTS.ticket}`} target="_blank" rel="noreferrer">{shortAddr(CONTRACTS.ticket)} ↗</a></dd></div>
            {ticket.onchain && ticket.txHash && (
              <div><dt>발급 Tx</dt><dd><a href={`${EXPLORER}/tx/${ticket.txHash}`} target="_blank" rel="noreferrer">{shortHash(ticket.txHash)} ↗</a></dd></div>
            )}
          </dl>
        </div>
      </div>
      <button type="button" className="flip-btn" onClick={onFlip}>{flipped ? '카드 앞면' : '입장 QR 보기'}</button>
    </div>
  )
}

const TABS = [
  { key: 'book', label: '예매', icon: <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" /> },
  { key: 'market', label: '거래소', icon: <path d="M4 7h12l-2-2m4 12H6l2 2" /> },
  { key: 'collection', label: '내 티켓', icon: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M9 8h6M9 12h6" /></> },
]

export default function App() {
  const wallet = useWallet()
  const connected = wallet.status === 'connected'
  const [appMode, setAppMode] = useState('simulation') // 'simulation' | 'onchain'
  const [tab, setTab] = useState('book')
  const [games, setGames] = useState(initialGames)
  const [tickets, setTickets] = useState(initialTickets)
  const [listings, setListings] = useState(initialListings)
  const [recentTrades, setRecentTrades] = useState([])
  const [flipped, setFlipped] = useState({})
  const [toast, setToast] = useState(null)
  // 모달 상태
  const [seatGameId, setSeatGameId] = useState(null)
  const [detailListing, setDetailListing] = useState(null)
  const [tx, setTx] = useState(null)
  // 거래소 필터
  const [teamFilter, setTeamFilter] = useState('ALL')
  const [underOnly, setUnderOnly] = useState(true)
  const [sortBy, setSortBy] = useState('price')

  const owner = connected ? wallet.handle || shortAddr(wallet.address) : appMode === 'simulation' ? 'sim.up.id' : '게스트'
  const seatGame = games.find((g) => g.id === seatGameId) || null

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3400)
    return () => window.clearTimeout(id)
  }, [toast])
  useEffect(() => {
    if (wallet.error) showToast(wallet.error, 'warn')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.error])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const m = params.get('mode')
    if (m === 'onchain' || m === 'simulation') setAppMode(m)
    const t = params.get('tab')
    if (t && TABS.some((x) => x.key === t)) setTab(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshRecentTrades = () => { loadRecentOnchainTrades().then(setRecentTrades) }
  // 판매된 좌석은 체인이 진실이다. sold:false였던 좌석만 true로 덮어써서
  // 새로고침해도 같은 좌석을 다시 살 수 있는 상태로 돌아가지 않게 한다.
  const refreshOnchainSeats = () => {
    loadOnchainSoldSeatIds().then((soldByGame) => {
      setGames((prev) =>
        prev.map((g) => {
          const sold = soldByGame[g.id]
          if (!sold || sold.size === 0) return g
          return { ...g, seats: g.seats.map((s) => (sold.has(s.id) ? { ...s, sold: true } : s)) }
        })
      )
    })
  }
  // 연결된 지갑이 실제로 들고 있는 NFT를 매번 체인에서 다시 읽어 온체인 티켓을 갱신한다.
  const refreshOwnedTickets = () => {
    if (!wallet.address) return
    loadOwnedOnchainTickets(wallet.address).then((onchainTickets) => {
      setTickets((prev) => [...onchainTickets, ...prev.filter((t) => !t.onchain)])
    })
  }

  useEffect(() => {
    refreshRecentTrades()
    refreshOnchainSeats()
    const id = window.setInterval(() => {
      refreshRecentTrades()
      refreshOnchainSeats()
    }, 20_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    refreshOwnedTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address])

  const showToast = (message, tone = 'ok') => setToast({ id: Date.now(), message, tone })
  const toggleFlip = (id) => setFlipped((p) => ({ ...p, [id]: !p[id] }))
  const goTab = (k) => { setTab(k); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  // 온체인 모드로 전환하면 즉시 지갑 연결을 시도한다 (시뮬레이션 모드는 지갑 없이도 동작)
  const handleModeChange = (next) => {
    if (next === appMode) return
    setAppMode(next)
    if (next === 'onchain' && wallet.status !== 'connected') wallet.connect()
  }

  // 실제 트랜잭션은 온체인 모드 + MetaMask로 GIWA Sepolia에 연결된 지갑에서만 가능
  const canSendReal = appMode === 'onchain' && wallet.mode === 'wallet' && Boolean(wallet.provider) && Boolean(wallet.address)
  const txErrorMessage = (err) => err?.shortMessage || err?.cause?.shortMessage || err?.message || '트랜잭션이 실패했어요.'

  // 예매 결제 (좌석 모달 → 결제 트랜잭션)
  const startPurchase = (seat) => {
    const game = seatGame
    setSeatGameId(null)
    const subtitle = `${TEAMS[game.away].short} vs ${TEAMS[game.home].short} · ${seat.zone} ${seat.row}열 ${seat.seat}번 · ${formatWon(seat.price)}`

    if (!canSendReal) {
      setTx({
        contract: 'PrimaryTicketSale', method: 'purchase',
        title: '온체인 예매 결제', subtitle,
        successTitle: 'NFT 입장권 발급 완료', successText: '구단이 공식 발행한 정가 티켓이 내 지갑에 민팅됐어요. (시뮬레이션 모드)', successCta: '내 티켓 보기',
        onComplete: () => {
          setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, seats: g.seats.map((s) => s.id === seat.id ? { ...s, sold: true } : s) } : g))
          const tokenId = `KBO-${Date.now().toString().slice(-6)}`
          setTickets((prev) => [{ tokenId, home: game.home, away: game.away, date: `${game.date.md} ${game.date.dow} ${game.date.time}`, seat: `${seat.zone} ${seat.row}열 ${seat.seat}번`, price: seat.price, faceValue: seat.price, used: false }, ...prev])
        },
      })
      return
    }

    setTx({
      simulated: false,
      contract: 'PrimaryTicketSale', method: 'purchase',
      title: '온체인 예매 결제', subtitle,
      successTitle: 'NFT 입장권 발급 완료', successText: '구단이 공식 발행한 정가 티켓이 내 지갑에 실제로 민팅됐어요.', successCta: '내 티켓 보기',
      execute: async (onSubmitted) => {
        const walletClient = getWalletClient(wallet.provider, wallet.address)
        const gameId = idHash(game.id)
        const seatId = idHash(seat.id)
        const seatKey = await publicClient.readContract({ address: CONTRACTS.sale, abi: primarySaleAbi, functionName: 'seatKeyOf', args: [gameId, seatId] })
        const hash = await walletClient.writeContract({ address: CONTRACTS.sale, abi: primarySaleAbi, functionName: 'purchase', args: [seatKey], value: krwToWei(seat.price) })
        onSubmitted(hash)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        const event = findEvent(primarySaleAbi, receipt.logs, 'SeatPurchased')
        return { hash, block: receipt.blockNumber, tokenId: event?.args?.tokenId }
      },
      onComplete: (result) => {
        setGames((prev) => prev.map((g) => g.id === game.id ? { ...g, seats: g.seats.map((s) => s.id === seat.id ? { ...s, sold: true } : s) } : g))
        const realTokenId = result.tokenId
        setTickets((prev) => [{ tokenId: `KBO-${realTokenId}`, realTokenId, onchain: true, txHash: result.hash, home: game.home, away: game.away, date: `${game.date.md} ${game.date.dow} ${game.date.time}`, seat: `${seat.zone} ${seat.row}열 ${seat.seat}번`, price: seat.price, faceValue: seat.price, used: false }, ...prev])
        refreshRecentTrades()
        refreshOnchainSeats()
        refreshOwnedTickets()
      },
      onError: (err) => showToast(txErrorMessage(err), 'warn'),
    })
  }
  const closeTxAndGoCollection = () => { setTx(null); goTab('collection') }

  // 양도 결제 (거래소 상세 → 온체인 정산)
  const startTransfer = (listing) => {
    setDetailListing(null)
    const subtitle = `${TEAMS[listing.away].short} vs ${TEAMS[listing.home].short} · ${listing.grade} · ${formatWon(listing.pricePer * listing.qty)}`

    if (!listing.onchain || !canSendReal) {
      setTx({
        contract: 'TicketTransferMarket', method: 'buy',
        title: '온체인 양도 정산', subtitle,
        successTitle: '양도 완료', successText: `스마트컨트랙트 에스크로를 통해 NFT 소유권이 내 지갑으로 이전됐어요. (${listing.onchain ? '시뮬레이션 모드' : '시드 매물 · 시뮬레이션'})`, successCta: '내 티켓 보기',
        onComplete: () => {
          setListings((prev) => prev.filter((x) => x.id !== listing.id))
          setTickets((prev) => [{ tokenId: `KBO-TX${Date.now().toString().slice(-5)}`, home: listing.home, away: listing.away, date: listing.dateText.replace(/^2026\./, '').slice(0, 11), seat: `${listing.grade} ${listing.block} ${listing.row}`, price: listing.pricePer, faceValue: listing.faceValue, used: false }, ...prev])
        },
      })
      return
    }

    setTx({
      simulated: false,
      contract: 'TicketTransferMarket', method: 'buy',
      title: '온체인 양도 정산', subtitle,
      successTitle: '양도 완료', successText: '스마트컨트랙트 에스크로를 통해 NFT 소유권이 실제로 내 지갑으로 이전됐어요.', successCta: '내 티켓 보기',
      execute: async (onSubmitted) => {
        const walletClient = getWalletClient(wallet.provider, wallet.address)
        const hash = await walletClient.writeContract({ address: CONTRACTS.market, abi: transferMarketAbi, functionName: 'buy', args: [BigInt(listing.realTokenId)], value: krwToWei(listing.pricePer * listing.qty) })
        onSubmitted(hash)
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        return { hash, block: receipt.blockNumber }
      },
      onComplete: () => {
        setListings((prev) => prev.filter((x) => x.id !== listing.id))
        setTickets((prev) => [{ tokenId: `KBO-${listing.realTokenId}`, realTokenId: listing.realTokenId, onchain: true, home: listing.home, away: listing.away, date: listing.dateText.replace(/^2026\./, '').slice(0, 11), seat: `${listing.grade} ${listing.block} ${listing.row}`, price: listing.pricePer, faceValue: listing.faceValue, used: false }, ...prev])
        refreshRecentTrades()
        refreshOwnedTickets()
      },
      onError: (err) => showToast(txErrorMessage(err), 'warn'),
    })
  }

  const listOwnedTicket = (tokenId) => {
    const ticket = tickets.find((t) => t.tokenId === tokenId)
    if (!ticket || ticket.used) return
    const pricePer = Math.max(ticket.faceValue - 3000, 1000)

    if (!ticket.onchain || !canSendReal) {
      setTickets((prev) => prev.filter((t) => t.tokenId !== tokenId))
      setListings((prev) => [{ id: `owned-${tokenId}`, home: ticket.home, away: ticket.away, dateText: `2026.${ticket.date}`, grade: ticket.seat.split(' ')[0], block: ticket.seat.split(' ')[1] || '-', row: ticket.seat.split(' ')[2] || '-', qty: 1, pricePer, faceValue: ticket.faceValue, seller: owner, tokenId: tokenId.replace(/\D/g, '').slice(-4) }, ...prev])
      showToast(`보유 티켓을 정가 이하로 거래소에 등록했어요. (시뮬레이션 모드)`)
      return
    }

    ;(async () => {
      try {
        showToast('양도 등록 트랜잭션을 전송하고 있어요…')
        const walletClient = getWalletClient(wallet.provider, wallet.address)
        const hash = await walletClient.writeContract({ address: CONTRACTS.market, abi: transferMarketAbi, functionName: 'list', args: [BigInt(ticket.realTokenId), krwToWei(pricePer)] })
        await publicClient.waitForTransactionReceipt({ hash })
        setTickets((prev) => prev.filter((t) => t.tokenId !== tokenId))
        setListings((prev) => [{ id: `owned-${tokenId}`, onchain: true, realTokenId: ticket.realTokenId, home: ticket.home, away: ticket.away, dateText: `2026.${ticket.date}`, grade: ticket.seat.split(' ')[0], block: ticket.seat.split(' ')[1] || '-', row: ticket.seat.split(' ')[2] || '-', qty: 1, pricePer, faceValue: ticket.faceValue, seller: owner, tokenId: String(ticket.realTokenId) }, ...prev])
        showToast('실제 온체인 거래소에 정가 이하로 등록했어요. TicketTransferMarket.list() 트랜잭션이 기록됐습니다.')
      } catch (err) {
        showToast(txErrorMessage(err), 'warn')
      }
    })()
  }
  const useTicket = (tokenId) => {
    let changed = false
    setTickets((prev) => prev.map((t) => { if (t.tokenId === tokenId && !t.used) { changed = true; return { ...t, used: true } } return t }))
    if (changed) showToast('입장 처리 완료! GateVerifier 가 used=true 를 기록했어요. 기념 NFT로 영구 소장됩니다.')
  }

  const filteredListings = useMemo(() => {
    let rows = listings.filter((l) => (appMode === 'simulation' || l.onchain) && (teamFilter === 'ALL' || l.home === teamFilter || l.away === teamFilter) && (!underOnly || l.pricePer <= l.faceValue))
    rows = [...rows].sort((a, b) => sortBy === 'price' ? a.pricePer - b.pricePer : b.faceValue - b.pricePer - (a.faceValue - a.pricePer))
    return rows
  }, [listings, appMode, teamFilter, underOnly, sortBy])

  const visibleTickets = useMemo(
    () => tickets.filter((t) => appMode === 'simulation' || t.onchain),
    [tickets, appMode]
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => goTab('book')} aria-label="직관 홈">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#fff" /><path d="M6 6 Q9 12 6 18 M18 6 Q15 12 18 18" stroke="#e8131d" strokeWidth="1.6" fill="none" strokeDasharray="1.2 3" strokeLinecap="round" /></svg></span>
          <span className="brand-word">직관<em>JIKGWAN</em></span>
        </button>
        <nav className="main-nav" aria-label="주요 화면">
          {TABS.map((t) => <button key={t.key} type="button" className={tab === t.key ? 'active' : ''} onClick={() => goTab(t.key)}>{t.label}</button>)}
        </nav>
        <div className="top-right">
          <ModeToggle mode={appMode} onChange={handleModeChange} />
          <span className="net-badge"><span className="net-dot" />GIWA Sepolia</span>
          <WalletChip wallet={wallet} />
        </div>
      </header>

      <main>
        {tab === 'book' && (
          <>
            <section className="hero compact" aria-labelledby="heroTitle">
              <img src="/assets/ballpark-ticket-gate.png" alt="" className="hero-media" />
              <div className="hero-overlay" />
              <div className="hero-content">
                <p className="eyebrow"><ChainTag>GIWA 블록체인 검증 티켓</ChainTag></p>
                <h1 id="heroTitle">검증된 팬만,<br />정가 그대로.</h1>
                <p className="hero-sub">실명 인증된 팬만 정가에 예매하고, 못 가는 날엔 정가 이하로만 온체인 양도하세요. 모든 입장권은 한정판 NFT 카드로 소장됩니다.</p>
              </div>
            </section>

            <section className="workspace">
              <VerifyBanner wallet={wallet} appMode={appMode} onSwitchMode={handleModeChange} />
              <div className="section-heading">
                <p className="eyebrow">1차 예매 · 구단 공식 발행</p>
                <h2>오늘의 KBO 경기</h2>
                <p className="section-desc">구단이 발행하는 정가 티켓입니다. 예매 시 <ChainTag>PrimaryTicketSale</ChainTag> 컨트랙트로 NFT가 즉시 민팅돼요.</p>
              </div>
              <div className="game-rows">
                {games.map((game) => {
                  const home = TEAMS[game.home]; const away = TEAMS[game.away]
                  const available = game.seats.filter((s) => !s.sold).length
                  return (
                    <article key={game.id} className="game-row">
                      <div className="row-date"><strong>{game.date.md}</strong><span className={game.date.dow === '일' ? 'sun' : game.date.dow === '토' ? 'sat' : ''}>({game.date.dow}) {game.date.time}</span></div>
                      <div className="row-match">
                        <div className="side"><TeamCrest code={game.away} /><span>{away.short}</span></div>
                        <span className="vs">VS</span>
                        <div className="side"><TeamCrest code={game.home} /><span><i className="home-tag">홈</i>{home.short}</span></div>
                      </div>
                      <div className="row-badges">{game.badges.map((b) => <span key={b} className={`badge${b.includes('매진') ? ' hot' : b.includes('온체인') ? ' chain' : ''}`}>{b}</span>)}</div>
                      <div className="row-venue"><span>{VENUE[game.home]}</span><span className="seats-left">잔여 {available}석</span></div>
                      <button type="button" className="row-cta" onClick={() => setSeatGameId(game.id)}>예매하기</button>
                    </article>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {tab === 'market' && (
          <section className="workspace market-tab">
            <div className="section-heading">
              <p className="eyebrow">2차 거래소 · 팬 간 양도</p>
              <h2>정가 이하 안심 거래소</h2>
              <p className="section-desc">못 가게 된 팬의 티켓을 정가 이하로만 거래합니다. <ChainTag>TicketTransferMarket</ChainTag> 스마트컨트랙트가 가격 상한과 검증을 강제해요.</p>
            </div>

            <div className="market-layout">
              <aside className="market-filters" aria-label="검색 필터">
                <h4>경기 / 구단</h4>
                <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                  <option value="ALL">전체 구단</option>
                  {Object.entries(TEAMS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
                <h4>정렬</h4>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="price">낮은 가격순</option>
                  <option value="save">할인 많은순</option>
                </select>
                <label className="filter-check"><input type="checkbox" checked={underOnly} onChange={(e) => setUnderOnly(e.target.checked)} />정가 이하만 보기</label>
                <div className="filter-note"><VerifiedMark size={13} /> 모든 매물은 검증된 팬이 등록하고, 온체인 에스크로로 정산됩니다.</div>
              </aside>

              <div className="market-main">
                <div className="market-toolbar"><span><b>{filteredListings.length}</b>개 매물</span><span className="under-pill">정가 이하 보장</span></div>
                <div className="ticketbay-list">
                  {filteredListings.map((l) => {
                    const home = TEAMS[l.home]; const away = TEAMS[l.away]; const save = l.faceValue - l.pricePer
                    return (
                      <button key={l.id} type="button" className="tb-row" onClick={() => setDetailListing(l)}>
                        <div className="tb-crest"><TeamCrest code={l.home} size={40} /></div>
                        <div className="tb-info">
                          <span className="tb-date">경기 일시 {l.dateText}</span>
                          <strong className="tb-title">vs {away.short} <em>|</em> {l.block} <em>|</em> {l.row}</strong>
                          <span className="tb-grade">{l.grade}</span>
                          <div className="tb-tags"><span className="badge under">정가 이하</span><span className="badge safe"><VerifiedMark size={11} />입장 안심</span><ChainTag>#{l.tokenId}</ChainTag>{l.onchain ? <span className="badge safe">온체인 실거래</span> : <span className="chip-demo">데모</span>}</div>
                        </div>
                        <div className="tb-price">
                          <span className="tb-qty">수량 {l.qty}매{l.qty > 1 ? '(연석)' : ''}</span>
                          <span className="tb-face">{formatWon(l.faceValue)}</span>
                          <strong>한 매 {formatWon(l.pricePer)}</strong>
                          {save > 0 && <span className="tb-save">{formatWon(save)}↓</span>}
                        </div>
                      </button>
                    )
                  })}
                  {filteredListings.length === 0 && (
                    <div className="empty-ticket">
                      {appMode === 'onchain' ? '아직 온체인으로 등록된 매물이 없어요.' : '조건에 맞는 매물이 없어요.'}
                    </div>
                  )}
                </div>
              </div>

              <aside className="market-rail" aria-label="온체인 거래 현황">
                <div className="rail-card">
                  <h4><ChainTag>온체인 정산</ChainTag></h4>
                  <p>거래는 카카오톡 송금이 아니라 <b>스마트컨트랙트 에스크로</b>로 처리됩니다. 결제 즉시 NFT 소유권이 이전되고, 정가 초과·미검증 거래는 컨트랙트가 자동 거절해요.</p>
                </div>
                <div className="rail-card">
                  <h4>최근 온체인 거래</h4>
                  {recentTrades.length === 0 ? (
                    <p className="rail-empty">아직 체인에 기록된 거래가 없어요.</p>
                  ) : (
                    <ul className="trade-feed">
                      {recentTrades.map((t) => (
                        <li key={t.key}>
                          <span className="tf-dot" />
                          <div><strong>{t.match}</strong><em>{t.grade} · {formatWon(t.price)}</em></div>
                          <a href={`${EXPLORER}/tx/${t.hash}`} target="_blank" rel="noreferrer">{shortAddr(t.hash)}<br />{t.ago}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </section>
        )}

        {tab === 'collection' && (
          <section className="workspace">
            <div className="section-heading">
              <p className="eyebrow">내 티켓 · NFT 보관함</p>
              <h2>나의 직관 NFT 카드</h2>
              <p className="section-desc">예매·양도받은 입장권이 <ChainTag>BaseballTicketNFT</ChainTag> 로 발급됩니다. 경기가 끝나도 영원히 내 지갑에 남아요.</p>
            </div>
            {visibleTickets.length === 0 ? (
              <div className="empty-ticket">
                {appMode === 'onchain'
                  ? '아직 온체인으로 발급받은 티켓이 없어요. 온체인 모드에서 예매하거나 거래소에서 양도받으면 NFT 카드가 발급됩니다.'
                  : '아직 보유한 티켓이 없어요. 경기를 예매하거나 거래소에서 양도받으면 NFT 카드가 발급됩니다.'}
              </div>
            ) : (
              <div className="collection-grid">
                {visibleTickets.map((ticket) => (
                  <div key={ticket.tokenId} className="ticket-slot">
                    <CollectibleCard ticket={ticket} owner={owner} flipped={Boolean(flipped[ticket.tokenId])} onFlip={() => toggleFlip(ticket.tokenId)} />
                    <div className="ticket-info">
                      <div className="ticket-info-head"><strong>{TEAMS[ticket.away].short} vs {TEAMS[ticket.home].short}</strong>{ticket.onchain ? <ChainTag>온체인</ChainTag> : <span className="chip-demo">데모</span>}<span className={`ticket-state${ticket.used ? ' used' : ''}`}>{ticket.used ? '입장 완료' : '입장 가능'}</span></div>
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
        )}
      </main>

      <footer className="site-foot">
        <div className="brand"><span className="brand-word">직관<em>JIKGWAN</em></span></div>
        <p>검증된 팬만, 정가 그대로. · GIWA 블록체인 기반 KBO 검증 티켓</p>
      </footer>

      <nav className="mobile-tab-bar" aria-label="모바일 주요 화면">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? 'active' : ''} onClick={() => goTab(t.key)}>
            <svg className="tab-icon" viewBox="0 0 24 24">{t.icon}</svg><span>{t.label}</span>
          </button>
        ))}
      </nav>

      {seatGame && <SeatModal game={seatGame} wallet={wallet} appMode={appMode} onClose={() => setSeatGameId(null)} onCheckout={startPurchase} />}
      {detailListing && <ListingModal listing={detailListing} wallet={wallet} appMode={appMode} onClose={() => setDetailListing(null)} onBuy={startTransfer} />}
      {tx && <TxModal tx={tx} onClose={closeTxAndGoCollection} />}
      {toast && <div className={`toast ${toast.tone}`} key={toast.id}>{toast.message}</div>}
    </div>
  )
}
