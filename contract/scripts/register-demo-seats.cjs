const hre = require("hardhat");

const SALE_ADDRESS = "0x1ADa63347E95cdC98328b2f72Dff6aEB4e386F4E";
const KRW_TO_WEI = 1_000_000_000n; // 1원 = 1e9 wei, keeps demo amounts small on testnet ETH

// Mirrors frontend/src/App.jsx createSeats() + initialGames so on-chain seatKeys
// line up exactly with what the UI shows.
function createSeats(prefix, basePrice, soldIds) {
  return Array.from({ length: 32 }, (_, index) => {
    const id = `${prefix}${String(index + 1).padStart(2, "0")}`;
    const row = Math.floor(index / 8) + 1;
    const seat = (index % 8) + 1;
    return { id, row, seat, price: basePrice - (row - 1) * 6000, sold: soldIds.includes(id) };
  });
}

// 2026-xx-xx 18:30 / 17:00 KST (UTC+9) -> UTC epoch seconds
function kstStart(monthDay, time) {
  const [month, day] = monthDay.split(".").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return Math.floor(Date.UTC(2026, month - 1, day, hour - 9, minute) / 1000);
}

const games = [
  { id: "g1", md: "06.19", time: "18:30", seats: createSeats("A", 54000, ["A03", "A04", "A15", "A16", "A21", "A27"]) },
  { id: "g2", md: "06.24", time: "18:30", seats: createSeats("B", 50000, ["B02", "B11", "B12", "B24", "B30"]) },
  { id: "g3", md: "06.20", time: "17:00", seats: createSeats("C", 47000, ["C01", "C09", "C18", "C19", "C25"]) },
  { id: "g4", md: "06.21", time: "17:00", seats: createSeats("D", 44000, ["D05", "D06", "D07", "D14", "D22", "D28", "D29"]) },
];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const sale = await hre.ethers.getContractAt("PrimaryTicketSale", SALE_ADDRESS);

  const listings = [];
  for (const game of games) {
    const gameId = hre.ethers.id(game.id);
    const startTime = kstStart(game.md, game.time);
    const transferDeadline = startTime - 2 * 60 * 60;
    for (const seat of game.seats) {
      if (seat.sold) continue; // cosmetic "매진" seats in the demo UI; not for sale on-chain
      listings.push({
        gameId,
        seatId: hre.ethers.id(seat.id),
        startTime,
        transferDeadline,
        priceWei: BigInt(seat.price) * KRW_TO_WEI,
        faceValueKrw: seat.price,
        zoneCode: 100 + seat.row,
        row: seat.row,
        seat: seat.seat,
        maxTransfers: 2,
        maxPerWallet: 4,
        reentryAllowed: false,
        active: true,
      });
    }
  }

  console.log(`Registering ${listings.length} seats across ${games.length} games...`);
  for (const batch of chunk(listings, 20)) {
    const tx = await sale.registerSeats(batch);
    const receipt = await tx.wait();
    console.log(`  +${batch.length} seats in tx ${receipt.hash}`);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
