import { useEffect, useState } from 'react'

const WALLET_NAME = 'minjun.up.id'
const WALLET_ADDRESS = '0x7a91...4c21'

function createSeats(prefix, basePrice, soldIds) {
  return Array.from({ length: 24 }, (_, index) => {
    const id = `${prefix}${String(index + 1).padStart(2, '0')}`
    const row = Math.floor(index / 8) + 1
    const seat = (index % 8) + 1
    const zone = row === 1 ? '1루 테이블' : row === 2 ? '1루 내야' : '응원지정'
    return {
      id,
      label: id,
      zone,
      row,
      seat,
      price: basePrice - (row - 1) * 5000,
      sold: soldIds.includes(id),
    }
  })
}

const initialGames = [
  {
    id: 'g1',
    home: 'LG 트윈스',
    away: '두산 베어스',
    venue: '잠실야구장',
    date: '6.16 화 18:30',
    provider: '티켓링크/인터파크 연동',
    seats: createSeats('A', 52000, ['A03', 'A04', 'A15', 'A16', 'A21']),
  },
  {
    id: 'g2',
    home: 'KIA 타이거즈',
    away: '삼성 라이온즈',
    venue: '광주-기아 챔피언스 필드',
    date: '6.17 수 18:30',
    provider: '티켓링크 연동',
    seats: createSeats('B', 47000, ['B02', 'B11', 'B12', 'B24']),
  },
  {
    id: 'g3',
    home: '롯데 자이언츠',
    away: '한화 이글스',
    venue: '사직야구장',
    date: '6.18 목 18:30',
    provider: '구단 자체예매 연동',
    seats: createSeats('C', 43000, ['C01', 'C09', 'C18', 'C19']),
  },
]

const initialListings = [
  {
    id: 'l1',
    game: '키움 히어로즈 vs NC 다이노스',
    venue: '고척스카이돔',
    seat: '1루 내야 114구역 8열 13번',
    seller: 'hyejin.up.id',
    price: 39000,
    faceValue: 41000,
  },
  {
    id: 'l2',
    game: 'SSG 랜더스 vs KT 위즈',
    venue: '인천 SSG 랜더스필드',
    seat: '응원지정석 303구역 4열 2번',
    seller: 'doyoon.up.id',
    price: 32000,
    faceValue: 32000,
  },
  {
    id: 'l3',
    game: 'NC 다이노스 vs KIA 타이거즈',
    venue: '창원NC파크',
    seat: '테이블석 T2 2열 7번',
    seller: 'seoha.up.id',
    price: 54000,
    faceValue: 56000,
  },
]

function formatWon(value) {
  return `${value.toLocaleString('ko-KR')}원`
}

function qrCells(seed) {
  const digits = seed.replace(/\D/g, '').padEnd(16, '7')
  return Array.from({ length: 49 }, (_, index) => {
    const active = (index + Number(digits[index % digits.length])) % 3 !== 0
    return <span key={index} className={active ? '' : 'blank'}></span>
  })
}

export default function App() {
  const [verified, setVerified] = useState(true)
  const [games, setGames] = useState(initialGames)
  const [selectedGameId, setSelectedGameId] = useState(initialGames[0].id)
  const [selectedSeatId, setSelectedSeatId] = useState(null)
  const [tickets, setTickets] = useState([])
  const [listings, setListings] = useState(initialListings)
  const [log, setLog] = useState(['지갑 연결 완료', 'Dojang Verified Address 확인'])
  const [toast, setToast] = useState(null)

  const selectedGame = games.find((game) => game.id === selectedGameId)
  const selectedSeat = selectedGame?.seats.find((seat) => seat.id === selectedSeatId) || null

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const addLog = (message) => setLog((prev) => [...prev, message])
  const showToast = (message) => setToast({ id: Date.now(), message })

  const handleToggleWallet = () => {
    setVerified((prev) => {
      const next = !prev
      addLog(next ? 'Dojang Verified Address 확인' : '검증 상태 해제')
      return next
    })
  }

  const handleSelectGame = (id) => {
    setSelectedGameId(id)
    setSelectedSeatId(null)
    addLog('경기 인벤토리 갱신')
  }

  const handleSelectSeat = (seatId) => {
    setSelectedSeatId(seatId)
    addLog('좌석 잠금 요청')
  }

  const buySelectedSeat = () => {
    if (!verified) {
      showToast('Verified Address가 아니면 예매할 수 없습니다.')
      addLog('예매 차단: 미검증 주소')
      return
    }
    if (!selectedGame || !selectedSeat) return

    setGames((prev) =>
      prev.map((game) =>
        game.id === selectedGame.id
          ? {
              ...game,
              seats: game.seats.map((seat) =>
                seat.id === selectedSeat.id ? { ...seat, sold: true } : seat
              ),
            }
          : game
      )
    )

    const tokenId = `KBO-${Date.now().toString().slice(-6)}`
    setTickets((prev) => [
      {
        tokenId,
        game: `${selectedGame.home} vs ${selectedGame.away}`,
        venue: selectedGame.venue,
        seat: `${selectedSeat.zone} ${selectedSeat.row}열 ${selectedSeat.seat}번`,
        price: selectedSeat.price,
        faceValue: selectedSeat.price,
        used: false,
      },
      ...prev,
    ])
    setSelectedSeatId(null)
    addLog('OnchainVerifier.isVerified 통과')
    addLog(`TicketNFT ${tokenId} 발급`)
    showToast('예매가 완료됐습니다. 내 티켓에 SBT-Gated 티켓이 발급되었습니다.')
  }

  const acceptListing = (id) => {
    const listing = listings.find((item) => item.id === id)
    if (!listing) return

    if (!verified) {
      showToast('검증된 팬만 양도받을 수 있습니다.')
      addLog('양도 차단: 수신자 미검증')
      return
    }

    setListings((prev) => prev.filter((item) => item.id !== id))
    setTickets((prev) => [
      {
        tokenId: `KBO-TX-${Date.now().toString().slice(-5)}`,
        game: listing.game,
        venue: listing.venue,
        seat: listing.seat,
        price: listing.price,
        faceValue: listing.faceValue,
        used: false,
      },
      ...prev,
    ])
    addLog('정가 이하 양도 조건 확인')
    addLog('safeTransferFrom 완료')
    showToast(`${listing.seller}의 티켓을 양도받았습니다.`)
  }

  const listOwnedTicket = (tokenId) => {
    const ticket = tickets.find((item) => item.tokenId === tokenId)
    if (!ticket || ticket.used) return

    setTickets((prev) => prev.filter((item) => item.tokenId !== tokenId))
    setListings((prev) => [
      {
        id: `owned-${tokenId}`,
        game: ticket.game,
        venue: ticket.venue,
        seat: ticket.seat,
        seller: WALLET_NAME,
        price: Math.max(ticket.faceValue - 2000, 1000),
        faceValue: ticket.faceValue,
      },
      ...prev,
    ])
    addLog('양도 등록: price <= faceValue')
    showToast('보유 티켓이 정가 이하 양도 마켓에 등록되었습니다.')
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
    addLog('게이트 QR 검증 완료')
    addLog('used 상태 기록')
    showToast('입장 처리가 완료되었습니다. 이 티켓은 더 이상 양도할 수 없습니다.')
  }

  const recentLog = log.slice(-5)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Proof-of-Fandom Ticket 홈">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>Proof-of-Fandom Ticket</span>
        </a>
        <nav className="main-nav" aria-label="주요 화면">
          <a href="#games">예매</a>
          <a href="#market">양도</a>
          <a href="#wallet">내 티켓</a>
        </nav>
        <button
          className={`wallet-chip${verified ? '' : ' unverified'}`}
          type="button"
          onClick={handleToggleWallet}
        >
          <span className="status-dot" aria-hidden="true"></span>
          <span>{verified ? WALLET_NAME : '미검증 주소'}</span>
        </button>
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="heroTitle">
          <img src="/assets/ballpark-ticket-gate.png" alt="" className="hero-media" />
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <p className="eyebrow">GIWA Sepolia Demo</p>
            <h1 id="heroTitle">검증된 팬만 사고, 정가 이하로만 양도하는 KBO 티켓</h1>
            <div className="hero-actions" aria-label="빠른 이동">
              <a className="primary-link" href="#games">경기 선택</a>
              <a className="secondary-link" href="#market">양도 보기</a>
            </div>
          </div>
          <div className="hero-metrics" aria-label="서비스 상태">
            <div>
              <strong>200ms</strong>
              <span>preconfirm</span>
            </div>
            <div>
              <strong>정가 이하</strong>
              <span>transfer rule</span>
            </div>
            <div>
              <strong>Verified</strong>
              <span>Dojang gate</span>
            </div>
          </div>
        </section>

        <section className="workspace" aria-label="예매와 양도">
          <div className="section-heading" id="games">
            <p className="eyebrow">예매</p>
            <h2>오늘 열리는 경기</h2>
          </div>

          <div className="booking-layout">
            <section className="game-list-panel" aria-label="경기 목록">
              <div className="game-list">
                {games.map((game) => {
                  const isActive = game.id === selectedGameId
                  const available = game.seats.filter((seat) => !seat.sold).length
                  return (
                    <button
                      key={game.id}
                      type="button"
                      className={`game-card${isActive ? ' active' : ''}`}
                      onClick={() => handleSelectGame(game.id)}
                    >
                      <div className="matchup">
                        <span className="team">{game.home}</span>
                        <span className="versus">VS</span>
                        <span className="team">{game.away}</span>
                      </div>
                      <div className="game-meta">
                        <span>{game.venue}</span>
                        <span>{game.date}</span>
                        <span>잔여 {available}석</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="seat-panel" aria-label="좌석 선택">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">좌석</p>
                  <h3>
                    {selectedGame
                      ? `${selectedGame.home} vs ${selectedGame.away}`
                      : '경기를 선택하세요'}
                  </h3>
                </div>
                <span className="pill">{selectedGame?.provider ?? '-'}</span>
              </div>
              <div className="field-view" aria-hidden="true">
                <div className="infield"></div>
                <span>FIELD</span>
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
                      onClick={() => handleSelectSeat(seat.id)}
                    >
                      {seat.label}
                    </button>
                  )
                })}
              </div>
            </section>

            <aside className="checkout-panel" aria-label="예매 요약">
              <div className="wallet-card" id="wallet">
                <div className="panel-header compact">
                  <div>
                    <p className="eyebrow">지갑</p>
                    <h3>{verified ? WALLET_NAME : 'guest.wallet'}</h3>
                  </div>
                  <span className={verified ? 'verified-badge' : 'danger-badge'}>
                    {verified ? 'Verified' : 'Blocked'}
                  </span>
                </div>
                <dl className="wallet-details">
                  <div>
                    <dt>주소</dt>
                    <dd>{verified ? WALLET_ADDRESS : '0xfa10...99b0'}</dd>
                  </div>
                  <div>
                    <dt>Attester</dt>
                    <dd>Upbit Korea</dd>
                  </div>
                  <div>
                    <dt>Fan SBT</dt>
                    <dd>Twins Home 2026</dd>
                  </div>
                </dl>
              </div>

              <div className="summary-box">
                <p className="eyebrow">예매 요약</p>
                {selectedGame && selectedSeat ? (
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>경기</span>
                      <strong>{selectedGame.home} vs {selectedGame.away}</strong>
                    </div>
                    <div className="summary-row">
                      <span>좌석</span>
                      <strong>
                        {selectedSeat.zone} {selectedSeat.row}열 {selectedSeat.seat}번
                      </strong>
                    </div>
                    <div className="summary-row">
                      <span>정가</span>
                      <strong>{formatWon(selectedSeat.price)}</strong>
                    </div>
                    <div className="summary-row">
                      <span>양도 정책</span>
                      <strong>정가 이하, 검증 주소만</strong>
                    </div>
                  </div>
                ) : (
                  <div className="summary-empty">
                    좌석을 선택하면 티켓 조건이 표시됩니다.
                  </div>
                )}
                <button
                  className="primary-button"
                  type="button"
                  disabled={!selectedSeat || !verified}
                  onClick={buySelectedSeat}
                >
                  검증 후 예매
                </button>
              </div>

              <div className="chain-log" aria-live="polite">
                <p className="eyebrow">GIWA 상태</p>
                <ol>
                  {recentLog.map((item, index) => (
                    <li
                      key={`${index}-${item}`}
                      className={index === recentLog.length - 1 ? 'done' : ''}
                    >
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </section>

        <section className="workspace split" id="market" aria-label="양도 마켓과 내 티켓">
          <div className="market-panel">
            <div className="section-heading">
              <p className="eyebrow">양도</p>
              <h2>검증 팬 양도 마켓</h2>
            </div>
            <div className="listing-list">
              {listings.map((listing) => (
                <article key={listing.id} className="market-card">
                  <div>
                    <h3>{listing.game}</h3>
                    <div className="listing-meta">
                      <span>{listing.venue}</span>
                      <span>{listing.seat}</span>
                      <span>{listing.seller}</span>
                    </div>
                  </div>
                  <div className="price-block">
                    <strong>{formatWon(listing.price)}</strong>
                    <span>정가 {formatWon(listing.faceValue)}</span>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => acceptListing(listing.id)}
                    >
                      양도받기
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="ticket-panel">
            <div className="section-heading">
              <p className="eyebrow">내 티켓</p>
              <h2>입장권 지갑</h2>
            </div>
            <div id="ticketWallet">
              {tickets.length === 0 ? (
                <div className="empty-ticket">
                  보유 티켓이 없습니다. 예매 또는 양도 수락 후 입장권이 표시됩니다.
                </div>
              ) : (
                tickets.map((ticket) => (
                  <article key={ticket.tokenId} className="ticket-card">
                    <div className="ticket-top">
                      <p className="eyebrow">SBT-Gated Ticket</p>
                      <h3>{ticket.game}</h3>
                    </div>
                    <div className="ticket-body">
                      <dl className="ticket-facts">
                        <div>
                          <dt>좌석</dt>
                          <dd>{ticket.seat}</dd>
                        </div>
                        <div>
                          <dt>소유자</dt>
                          <dd>{verified ? WALLET_NAME : 'guest.wallet'}</dd>
                        </div>
                        <div>
                          <dt>Token ID</dt>
                          <dd>{ticket.tokenId}</dd>
                        </div>
                        <div>
                          <dt>상태</dt>
                          <dd>{ticket.used ? '입장 완료' : '입장 가능'}</dd>
                        </div>
                      </dl>
                      <div className="qr" aria-label="동적 입장 QR 데모">
                        {qrCells(ticket.tokenId)}
                      </div>
                    </div>
                    <div className="ticket-actions">
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={ticket.used}
                        onClick={() => listOwnedTicket(ticket.tokenId)}
                      >
                        정가 이하 양도 등록
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={ticket.used}
                        onClick={() => useTicket(ticket.tokenId)}
                      >
                        입장 처리
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <nav className="mobile-tab-bar" aria-label="모바일 주요 화면">
        <a href="#games">
          <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Zm6 1v6m0-3h.01" />
          </svg>
          <span>예매</span>
        </a>
        <a href="#market">
          <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h12l-2-2m4 12H6l2 2" />
          </svg>
          <span>양도</span>
        </a>
        <a href="#wallet">
          <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="3" width="12" height="18" rx="2" />
            <path d="M11 18h2" />
          </svg>
          <span>내 티켓</span>
        </a>
      </nav>

      {toast && <div className="toast" key={toast.id}>{toast.message}</div>}
    </div>
  )
}
