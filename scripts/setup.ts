/**
 * scripts/setup.ts
 *
 * Executa as configurações pós-deploy necessárias para o protocolo funcionar:
 *
 *  1. Minta EcoTokens para o pool de recompensas do ReverseLogistics
 *     (o contrato usa ecoToken.transfer, logo precisa ter saldo próprio)
 *  2. Minta EcoTokens para o pool de recompensas do EcoStaking
 *
 * Execute após o deploy na Sepolia:
 *   npm run setup:sepolia
 */

import { network } from "hardhat";

import { EcoToken__factory }        from "../types/factories/EcoToken__factory.js";
import { ReverseLogistics__factory } from "../types/factories/ReverseLogistics.sol/ReverseLogistics__factory.js";
import { EcoStaking__factory }      from "../types/factories/EcoStaking__factory.js";

import contractsData from "../frontend/src/services/contracts.json" assert { type: "json" };

// ─── Endereços lidos do contracts.json gerado pelo deploy ───────────────────
const ADDRESSES = {
  ecoToken:         contractsData.contracts.EcoToken.address,
  reverseLogistics: contractsData.contracts.ReverseLogistics.address,
  ecoStaking:       contractsData.contracts.EcoStaking.address,
} as const;

// ─── Quantidades a mintar nos pools ─────────────────────────────────────────
const REVERSE_LOGISTICS_POOL = 10_000n * 10n ** 18n; // 10.000 ECO
const STAKING_POOL           = 50_000n * 10n ** 18n; // 50.000 ECO

async function main(): Promise<void> {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("Setup com conta:", deployer.address);
  console.log("Rede:", contractsData.network);

  // Instancia o EcoToken conectado ao deployer (que tem MINTER_ROLE)
  const ecoToken = EcoToken__factory.connect(ADDRESSES.ecoToken, deployer);

  // ── 1. Pool do ReverseLogistics ───────────────────────────────────────────
  console.log("\n[1/2] Mintando ECO para o pool do ReverseLogistics...");
  const tx1 = await ecoToken.mint(ADDRESSES.reverseLogistics, REVERSE_LOGISTICS_POOL);
  await tx1.wait();
  console.log("  ✔ Tx:", tx1.hash);

  // Verifica o saldo resultante
  const rlBalance = await ecoToken.balanceOf(ADDRESSES.reverseLogistics);
  console.log("  Saldo ReverseLogistics:", ethers.formatEther(rlBalance), "ECO");

  // ── 2. Pool do EcoStaking ─────────────────────────────────────────────────
  console.log("\n[2/2] Mintando ECO para o pool do EcoStaking...");
  const tx2 = await ecoToken.mint(ADDRESSES.ecoStaking, STAKING_POOL);
  await tx2.wait();
  console.log("  ✔ Tx:", tx2.hash);

  const stakingBalance = await ecoToken.balanceOf(ADDRESSES.ecoStaking);
  console.log("  Saldo EcoStaking:", ethers.formatEther(stakingBalance), "ECO");

  console.log("\n✅ Setup concluído. O protocolo está pronto para uso.");

  // Verifica a taxa mínima atual para diagnóstico
  const rl = ReverseLogistics__factory.connect(ADDRESSES.reverseLogistics, deployer);
  const flatFeeUsd18 = await rl.flatFeeUsd18();
  console.log("\n📋 Taxa mínima configurada:", ethers.formatEther(flatFeeUsd18), "USD (18 decimais)");
  console.log("   → Com ETH a $3000, isso equivale a ~", (Number(flatFeeUsd18) / 1e18 / 3000).toFixed(6), "ETH");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
