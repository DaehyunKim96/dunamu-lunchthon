const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

const ATTESTER_ID = "0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034";

async function deployFixture() {
  const [admin, buyer, receiver] = await ethers.getSigners();

  const MockVerifier = await ethers.getContractFactory("MockDojangVerifier");
  const verifier = await MockVerifier.deploy(false);
  await verifier.waitForDeployment();

  const Ticket = await ethers.getContractFactory("BaseballTicketNFT");
  const ticket = await Ticket.deploy(
    await verifier.getAddress(),
    ATTESTER_ID,
    "Proof-of-Fandom Ticket",
    "POFT"
  );
  await ticket.waitForDeployment();

  const Sale = await ethers.getContractFactory("PrimaryTicketSale");
  const sale = await Sale.deploy(await ticket.getAddress(), await verifier.getAddress(), ATTESTER_ID);
  await sale.waitForDeployment();

  const Market = await ethers.getContractFactory("TicketTransferMarket");
  const market = await Market.deploy(await ticket.getAddress(), await verifier.getAddress(), ATTESTER_ID);
  await market.waitForDeployment();

  const Gate = await ethers.getContractFactory("GateVerifier");
  const gate = await Gate.deploy(await ticket.getAddress(), admin.address);
  await gate.waitForDeployment();

  await (await ticket.grantRole(await ticket.MINTER_ROLE(), await sale.getAddress())).wait();
  await (await ticket.grantRole(await ticket.BURNER_ROLE(), await sale.getAddress())).wait();
  await (await ticket.grantRole(await ticket.MARKET_ROLE(), await market.getAddress())).wait();
  await (await ticket.grantRole(await ticket.GATE_ROLE(), await gate.getAddress())).wait();

  await (await verifier.setVerified(buyer.address, ATTESTER_ID, true)).wait();
  await (await verifier.setVerified(receiver.address, ATTESTER_ID, true)).wait();

  return { admin, buyer, receiver, verifier, ticket, sale, market, gate };
}

async function expectReject(promise, marker) {
  try {
    await promise;
    assert.fail(`Expected revert containing ${marker}`);
  } catch (error) {
    assert.match(String(error), new RegExp(marker));
  }
}

describe("Proof-of-Fandom Ticket MVP", function () {
  it("enforces verified purchase, face-value market transfer, and gate redemption", async function () {
    const { admin, buyer, receiver, ticket, sale, market, gate } = await deployFixture();

    const now = Math.floor(Date.now() / 1000);
    const priceWei = ethers.parseEther("0.00001");
    const gameId = ethers.id("LG_TWINS_VS_DOOSAN_BEARS_2026_06_16");
    const seatId = ethers.id("JAMSIL_A_01");
    const seat = {
      gameId,
      seatId,
      startTime: now + 86_400,
      transferDeadline: now + 80_000,
      priceWei,
      faceValueKrw: 52_000,
      zoneCode: 101,
      row: 1,
      seat: 1,
      maxTransfers: 2,
      maxPerWallet: 4,
      reentryAllowed: false,
      active: true,
    };

    const seatKey = await sale.seatKeyOf(gameId, seatId);
    await (await sale.registerSeats([seat])).wait();
    await (await sale.connect(buyer).purchase(seatKey, { value: priceWei })).wait();

    assert.equal(await ticket.ownerOf(1n), buyer.address);

    await expectReject(
      ticket.connect(buyer).transferFrom(buyer.address, receiver.address, 1n),
      "TransferNotAllowed"
    );
    await expectReject(market.connect(buyer).list(1n, priceWei + 1n), "PriceTooHigh");

    const resalePrice = priceWei - 1n;
    await (await market.connect(buyer).list(1n, resalePrice)).wait();
    await (await market.connect(receiver).buy(1n, { value: resalePrice })).wait();

    assert.equal(await ticket.ownerOf(1n), receiver.address);
    assert.equal(await ticket.transferCount(1n), 1n);

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const pass = {
      tokenId: 1n,
      ownerAtSign: receiver.address,
      expiry: BigInt(now + 300),
      nonce: ethers.id("gate-pass-1"),
      gateId: ethers.id("JAMSIL_GATE_A"),
    };
    const domain = {
      name: "Proof-of-Fandom GateVerifier",
      version: "1",
      chainId,
      verifyingContract: await gate.getAddress(),
    };
    const types = {
      GatePass: [
        { name: "tokenId", type: "uint256" },
        { name: "ownerAtSign", type: "address" },
        { name: "expiry", type: "uint64" },
        { name: "nonce", type: "bytes32" },
        { name: "gateId", type: "bytes32" },
      ],
    };
    const signature = await admin.signTypedData(domain, types, pass);

    await (await gate.connect(receiver).redeem(pass, signature)).wait();
    assert.equal(await ticket.tokenStatus(1n), 1n);

    await expectReject(market.connect(receiver).list(1n, resalePrice), "WrongStatus");
  });
});
