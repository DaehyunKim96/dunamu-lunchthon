const hre = require("hardhat");

const DOJANG_SCROLL = "0xd5077b67dcb56cac8b270c7788fc3e6ee03f17b9";
const UPBIT_KOREA = "0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034";

function envFlag(name) {
  return String(process.env[name] || "").toLowerCase() === "true";
}

async function deployContract(name, args = []) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const useMockVerifier = envFlag("USE_MOCK_VERIFIER");
  const attesterId = process.env.ATTESTER_ID || UPBIT_KOREA;
  const gateSigner = process.env.GATE_SIGNER || deployerAddress;

  let verifierAddress = process.env.VERIFIER_ADDRESS || DOJANG_SCROLL;
  let mockVerifierAddress = null;

  if (useMockVerifier) {
    const mockVerifier = await deployContract("MockDojangVerifier", [false]);
    mockVerifierAddress = await mockVerifier.getAddress();
    verifierAddress = mockVerifierAddress;

    const tx = await mockVerifier.setVerified(deployerAddress, attesterId, true);
    await tx.wait();
  }

  const ticket = await deployContract("BaseballTicketNFT", [
    verifierAddress,
    attesterId,
    "Proof-of-Fandom Ticket",
    "POFT",
  ]);
  const ticketAddress = await ticket.getAddress();

  const sale = await deployContract("PrimaryTicketSale", [ticketAddress, verifierAddress, attesterId]);
  const saleAddress = await sale.getAddress();

  const market = await deployContract("TicketTransferMarket", [ticketAddress, verifierAddress, attesterId]);
  const marketAddress = await market.getAddress();

  const gate = await deployContract("GateVerifier", [ticketAddress, gateSigner]);
  const gateAddress = await gate.getAddress();

  const roleTxs = [
    await ticket.grantRole(await ticket.MINTER_ROLE(), saleAddress),
    await ticket.grantRole(await ticket.BURNER_ROLE(), saleAddress),
    await ticket.grantRole(await ticket.MARKET_ROLE(), marketAddress),
    await ticket.grantRole(await ticket.GATE_ROLE(), gateAddress),
  ];
  for (const tx of roleTxs) {
    await tx.wait();
  }

  const result = {
    network: "giwaSepolia",
    chainId: 91342,
    deployer: deployerAddress,
    useMockVerifier,
    attesterId,
    verifier: verifierAddress,
    mockVerifier: mockVerifierAddress,
    ticket: ticketAddress,
    primarySale: saleAddress,
    transferMarket: marketAddress,
    gateVerifier: gateAddress,
    gateSigner,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
