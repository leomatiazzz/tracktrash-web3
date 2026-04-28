import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import "dotenv/config";

// Lê as variáveis do arquivo .env (dotenv/config executa automaticamente)

export default defineConfig({
  plugins: [hardhatEthers, hardhatToolboxMochaEthers, hardhatTypechain, hardhatVerify],
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "types",
  },
  networks: {
    // Redes reais conectadas via RPC (Alchemy, Infura, etc.)
    sepolia: {
      type: "http",
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL ?? "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  // Configuração do plugin hardhat-verify (verificação no Etherscan)
  // No hardhat-verify v3 a chave raiz é `verify`, não `etherscan`
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY ?? "",
    },
  },
});