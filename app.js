const games = [
  {
    id: "g1",
    home: "LG 트윈스",
    away: "두산 베어스",
    venue: "잠실야구장",
    date: "6.16 화 18:30",
    provider: "티켓링크/인터파크 연동",
    seats: createSeats("A", 52000, ["A03", "A04", "A15", "A16", "A21"])
  },
  {
    id: "g2",
    home: "KIA 타이거즈",
    away: "삼성 라이온즈",
    venue: "광주-기아 챔피언스 필드",
    date: "6.17 수 18:30",
    provider: "티켓링크 연동",
    seats: createSeats("B", 47000, ["B02", "B11", "B12", "B24"])
  },
  {
    id: "g3",
    home: "롯데 자이언츠",
    away: "한화 이글스",
    venue: "사직야구장",
    date: "6.18 목 18:30",
    provider: "구단 자체예매 연동",
    seats: createSeats("C", 43000, ["C01", "C09", "C18", "C19"])
  }
];

const initialListings = [
  {
    id: "l1",
    game: "키움 히어로즈 vs NC 다이노스",
    venue: "고척스카이돔",
    seat: "1루 내야 114구역 8열 13번",
    seller: "hyejin.up.id",
    price: 39000,
    faceValue: 41000
  },
  {
    id: "l2",
    game: "SSG 랜더스 vs KT 위즈",
    venue: "인천 SSG 랜더스필드",
    seat: "응원지정석 303구역 4열 2번",
    seller: "doyoon.up.id",
    price: 32000,
    faceValue: 32000
  },
  {
    id: "l3",
    game: "NC 다이노스 vs KIA 타이거즈",
    venue: "창원NC파크",
    seat: "테이블석 T2 2열 7번",
    seller: "seoha.up.id",
    price: 54000,
    faceValue: 56000
  }
];

const state = {
  verified: true,
  walletName: "minjun.up.id",
  walletAddress: "0x7a91...4c21",
  selectedGameId: games[0].id,
  selectedSeatId: null,
  tickets: [],
  listings: [...initialListings],
  log: ["지갑 연결 완료", "Dojang Verified Address 확인"]
};

const els = {
  walletToggle: document.querySelector("#walletToggle"),
  walletLabel: document.querySelector("#walletLabel"),
  walletName: document.querySelector("#walletName"),
  walletAddress: document.querySelector("#walletAddress"),
  verifyBadge: document.querySelector("#verifyBadge"),
  gameList: document.querySelector("#gameList"),
  seatMap: document.querySelector("#seatMap"),
  selectedGameTitle: document.querySelector("#selectedGameTitle"),
  gameProvider: document.querySelector("#gameProvider"),
  bookingSummary: document.querySelector("#bookingSummary"),
  buyButton: document.querySelector("#buyButton"),
  chainLog: document.querySelector("#chainLog"),
  listingList: document.querySelector("#listingList"),
  ticketWallet: document.querySelector("#ticketWallet")
};

function createSeats(prefix, basePrice, soldIds) {
  return Array.from({ length: 24 }, (_, index) => {
    const id = `${prefix}${String(index + 1).padStart(2, "0")}`;
    const row = Math.floor(index / 8) + 1;
    const seat = (index % 8) + 1;
    const zone = row === 1 ? "1루 테이블" : row === 2 ? "1루 내야" : "응원지정";
    return {
      id,
      label: id,
      zone,
      row,
      seat,
      price: basePrice - (row - 1) * 5000,
      sold: soldIds.includes(id)
    };
  });
}

function formatWon(value) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function getSelectedGame() {
  return games.find((game) => game.id === state.selectedGameId);
}

function getSelectedSeat() {
  const game = getSelectedGame();
  return game?.seats.find((seat) => seat.id === state.selectedSeatId) || null;
}

function render() {
  renderWallet();
  renderGames();
  renderSeats();
  renderSummary();
  renderLog();
  renderListings();
  renderTickets();
}

function renderWallet() {
  els.walletToggle.classList.toggle("unverified", !state.verified);
  els.walletLabel.textContent = state.verified ? state.walletName : "미검증 주소";
  els.walletName.textContent = state.verified ? state.walletName : "guest.wallet";
  els.walletAddress.textContent = state.verified ? state.walletAddress : "0xfa10...99b0";
  els.verifyBadge.className = state.verified ? "verified-badge" : "danger-badge";
  els.verifyBadge.textContent = state.verified ? "Verified" : "Blocked";
}

function renderGames() {
  els.gameList.innerHTML = games.map((game) => {
    const isActive = game.id === state.selectedGameId;
    const available = game.seats.filter((seat) => !seat.sold).length;
    return `
      <button class="game-card ${isActive ? "active" : ""}" type="button" data-game-id="${game.id}">
        <div class="matchup">
          <span class="team">${game.home}</span>
          <span class="versus">VS</span>
          <span class="team">${game.away}</span>
        </div>
        <div class="game-meta">
          <span>${game.venue}</span>
          <span>${game.date}</span>
          <span>잔여 ${available}석</span>
        </div>
      </button>
    `;
  }).join("");

  document.querySelectorAll("[data-game-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedGameId = button.dataset.gameId;
      state.selectedSeatId = null;
      addLog("경기 인벤토리 갱신");
      render();
    });
  });
}

function renderSeats() {
  const game = getSelectedGame();
  els.selectedGameTitle.textContent = `${game.home} vs ${game.away}`;
  els.gameProvider.textContent = game.provider;
  els.seatMap.innerHTML = game.seats.map((seat) => {
    const selected = seat.id === state.selectedSeatId;
    return `
      <button
        class="seat-button ${seat.sold ? "sold" : ""} ${selected ? "selected" : ""}"
        type="button"
        data-seat-id="${seat.id}"
        ${seat.sold ? "disabled" : ""}
        aria-label="${seat.zone} ${seat.row}열 ${seat.seat}번 ${formatWon(seat.price)}"
      >${seat.label}</button>
    `;
  }).join("");

  document.querySelectorAll("[data-seat-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedSeatId = button.dataset.seatId;
      addLog("좌석 잠금 요청");
      render();
    });
  });
}

function renderSummary() {
  const game = getSelectedGame();
  const seat = getSelectedSeat();

  if (!seat) {
    els.bookingSummary.className = "summary-empty";
    els.bookingSummary.textContent = "좌석을 선택하면 티켓 조건이 표시됩니다.";
    els.buyButton.disabled = true;
    return;
  }

  els.bookingSummary.className = "summary-details";
  els.bookingSummary.innerHTML = `
    <div class="summary-row"><span>경기</span><strong>${game.home} vs ${game.away}</strong></div>
    <div class="summary-row"><span>좌석</span><strong>${seat.zone} ${seat.row}열 ${seat.seat}번</strong></div>
    <div class="summary-row"><span>정가</span><strong>${formatWon(seat.price)}</strong></div>
    <div class="summary-row"><span>양도 정책</span><strong>정가 이하, 검증 주소만</strong></div>
  `;
  els.buyButton.disabled = !state.verified;
}

function renderLog() {
  els.chainLog.innerHTML = state.log
    .slice(-5)
    .map((item, index, list) => `<li class="${index === list.length - 1 ? "done" : ""}">${item}</li>`)
    .join("");
}

function renderListings() {
  els.listingList.innerHTML = state.listings.map((listing) => `
    <article class="market-card">
      <div>
        <h3>${listing.game}</h3>
        <div class="listing-meta">
          <span>${listing.venue}</span>
          <span>${listing.seat}</span>
          <span>${listing.seller}</span>
        </div>
      </div>
      <div class="price-block">
        <strong>${formatWon(listing.price)}</strong>
        <span>정가 ${formatWon(listing.faceValue)}</span>
        <button class="ghost-button" type="button" data-listing-id="${listing.id}">양도받기</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-listing-id]").forEach((button) => {
    button.addEventListener("click", () => acceptListing(button.dataset.listingId));
  });
}

function renderTickets() {
  if (state.tickets.length === 0) {
    els.ticketWallet.innerHTML = `
      <div class="empty-ticket">
        보유 티켓이 없습니다. 예매 또는 양도 수락 후 입장권이 표시됩니다.
      </div>
    `;
    return;
  }

  els.ticketWallet.innerHTML = state.tickets.map((ticket) => `
    <article class="ticket-card">
      <div class="ticket-top">
        <p class="eyebrow">SBT-Gated Ticket</p>
        <h3>${ticket.game}</h3>
      </div>
      <div class="ticket-body">
        <dl class="ticket-facts">
          <div><dt>좌석</dt><dd>${ticket.seat}</dd></div>
          <div><dt>소유자</dt><dd>${state.verified ? state.walletName : "guest.wallet"}</dd></div>
          <div><dt>Token ID</dt><dd>${ticket.tokenId}</dd></div>
          <div><dt>상태</dt><dd>${ticket.used ? "입장 완료" : "입장 가능"}</dd></div>
        </dl>
        <div class="qr" aria-label="동적 입장 QR 데모">${qrMarkup(ticket.tokenId)}</div>
      </div>
      <div class="ticket-actions">
        <button class="ghost-button" type="button" data-sell-token="${ticket.tokenId}" ${ticket.used ? "disabled" : ""}>정가 이하 양도 등록</button>
        <button class="ghost-button" type="button" data-use-token="${ticket.tokenId}" ${ticket.used ? "disabled" : ""}>입장 처리</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-sell-token]").forEach((button) => {
    button.addEventListener("click", () => listOwnedTicket(button.dataset.sellToken));
  });
  document.querySelectorAll("[data-use-token]").forEach((button) => {
    button.addEventListener("click", () => useTicket(button.dataset.useToken));
  });
}

function qrMarkup(seed) {
  const digits = seed.replace(/\D/g, "").padEnd(16, "7");
  return Array.from({ length: 49 }, (_, index) => {
    const active = (index + Number(digits[index % digits.length])) % 3 !== 0;
    return `<span class="${active ? "" : "blank"}"></span>`;
  }).join("");
}

function buySelectedSeat() {
  const game = getSelectedGame();
  const seat = getSelectedSeat();

  if (!state.verified) {
    showToast("Verified Address가 아니면 예매할 수 없습니다.");
    addLog("예매 차단: 미검증 주소");
    render();
    return;
  }

  if (!seat) return;

  seat.sold = true;
  const tokenId = `KBO-${Date.now().toString().slice(-6)}`;
  state.tickets.unshift({
    tokenId,
    game: `${game.home} vs ${game.away}`,
    venue: game.venue,
    seat: `${seat.zone} ${seat.row}열 ${seat.seat}번`,
    price: seat.price,
    faceValue: seat.price,
    used: false
  });
  state.selectedSeatId = null;
  addLog("OnchainVerifier.isVerified 통과");
  addLog(`TicketNFT ${tokenId} 발급`);
  showToast("예매가 완료됐습니다. 내 티켓에 SBT-Gated 티켓이 발급되었습니다.");
  render();
}

function acceptListing(id) {
  const listing = state.listings.find((item) => item.id === id);
  if (!listing) return;

  if (!state.verified) {
    showToast("검증된 팬만 양도받을 수 있습니다.");
    addLog("양도 차단: 수신자 미검증");
    render();
    return;
  }

  state.listings = state.listings.filter((item) => item.id !== id);
  state.tickets.unshift({
    tokenId: `KBO-TX-${Date.now().toString().slice(-5)}`,
    game: listing.game,
    venue: listing.venue,
    seat: listing.seat,
    price: listing.price,
    faceValue: listing.faceValue,
    used: false
  });
  addLog("정가 이하 양도 조건 확인");
  addLog("safeTransferFrom 완료");
  showToast(`${listing.seller}의 티켓을 양도받았습니다.`);
  render();
}

function listOwnedTicket(tokenId) {
  const ticket = state.tickets.find((item) => item.tokenId === tokenId);
  if (!ticket || ticket.used) return;

  state.tickets = state.tickets.filter((item) => item.tokenId !== tokenId);
  state.listings.unshift({
    id: `owned-${tokenId}`,
    game: ticket.game,
    venue: ticket.venue,
    seat: ticket.seat,
    seller: state.walletName,
    price: Math.max(ticket.faceValue - 2000, 1000),
    faceValue: ticket.faceValue
  });
  addLog("양도 등록: price <= faceValue");
  showToast("보유 티켓이 정가 이하 양도 마켓에 등록되었습니다.");
  render();
}

function useTicket(tokenId) {
  const ticket = state.tickets.find((item) => item.tokenId === tokenId);
  if (!ticket || ticket.used) return;
  ticket.used = true;
  addLog("게이트 QR 검증 완료");
  addLog("used 상태 기록");
  showToast("입장 처리가 완료되었습니다. 이 티켓은 더 이상 양도할 수 없습니다.");
  render();
}

function addLog(message) {
  state.log.push(message);
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

els.walletToggle.addEventListener("click", () => {
  state.verified = !state.verified;
  addLog(state.verified ? "Dojang Verified Address 확인" : "검증 상태 해제");
  render();
});

els.buyButton.addEventListener("click", buySelectedSeat);

render();
