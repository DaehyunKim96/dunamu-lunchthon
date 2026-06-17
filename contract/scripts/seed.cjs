const hre = require("hardhat");

function gameId(value) {
  return hre.ethers.id(value);
}

function seatId(value) {
  return hre.ethers.id(value);
}

async function main() {
  const saleAddress = process.env.PRIMARY_SALE_ADDRESS;
  if (!saleAddress) {
    throw new Error("Set PRIMARY_SALE_ADDRESS to the deployed PrimaryTicketSale address.");
  }

  const sale = await hre.ethers.getContractAt("PrimaryTicketSale", saleAddress);
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 7 * 24 * 60 * 60;
  const transferDeadline = startTime - 2 * 60 * 60;
  const priceWei = hre.ethers.parseEther("0.00001");

  const seats = [
    {
      gameId: gameId("LG_TWINS_VS_DOOSAN_BEARS_2026_06_16"),
      seatId: seatId("JAMSIL_A_01"),
      startTime,
      transferDeadline,
      priceWei,
      faceValueKrw: 52000,
      zoneCode: 101,
      row: 1,
      seat: 1,
      maxTransfers: 2,
      maxPerWallet: 4,
      reentryAllowed: false,
      active: true,
    },
    {
      gameId: gameId("KIA_TIGERS_VS_SAMSUNG_LIONS_2026_06_17"),
      seatId: seatId("GWANGJU_B_02"),
      startTime: startTime + 24 * 60 * 60,
      transferDeadline: transferDeadline + 24 * 60 * 60,
      priceWei,
      faceValueKrw: 47000,
      zoneCode: 201,
      row: 2,
      seat: 2,
      maxTransfers: 2,
      maxPerWallet: 4,
      reentryAllowed: false,
      active: true,
    },
    {
      gameId: gameId("LOTTE_GIANTS_VS_HANWHA_EAGLES_2026_06_18"),
      seatId: seatId("SAJIK_C_03"),
      startTime: startTime + 2 * 24 * 60 * 60,
      transferDeadline: transferDeadline + 2 * 24 * 60 * 60,
      priceWei,
      faceValueKrw: 43000,
      zoneCode: 301,
      row: 3,
      seat: 3,
      maxTransfers: 2,
      maxPerWallet: 4,
      reentryAllowed: false,
      active: true,
    },
  ];

  const tx = await sale.registerSeats(seats);
  const receipt = await tx.wait();
  console.log(`Registered ${seats.length} seats in tx ${receipt.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
