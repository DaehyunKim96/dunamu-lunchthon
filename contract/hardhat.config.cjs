require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const GIWA_SEPOLIA_RPC_URL = process.env.GIWA_SEPOLIA_RPC_URL || "https://sepolia-rpc.giwa.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    giwaSepolia: {
      url: GIWA_SEPOLIA_RPC_URL,
      chainId: 91342,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
