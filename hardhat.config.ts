import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const BSC_RPC = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";
const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "11".repeat(32);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      // Enable forking only when explicitly requested
      forking: process.env.HARDHAT_FORK === "1" ? { url: BSC_RPC } : undefined,
    },
    bsc: {
      url: BSC_RPC,
      chainId: 56,
      accounts: PRIVATE_KEY && PRIVATE_KEY.length > 2 ? [PRIVATE_KEY] : [],
    },
    bscTestnet: {
      url: BSC_TESTNET_RPC,
      chainId: 97,
      accounts: PRIVATE_KEY && PRIVATE_KEY.length > 2 ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;


