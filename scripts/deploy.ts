import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

import { EcoToken__factory } from "../types/factories/EcoToken__factory.js";
import { EcoBadge__factory } from "../types/factories/EcoBadge__factory.js";
import { MockV3Aggregator__factory } from "../types/factories/mocks/MockV3Aggregator__factory.js";
import { ReverseLogistics__factory } from "../types/factories/ReverseLogistics.sol/ReverseLogistics__factory.js";
import { EcoStaking__factory } from "../types/factories/EcoStaking__factory.js";
import { EcoDAO__factory } from "../types/factories/EcoDAO__factory.js";

import type { EcoToken } from "../types/EcoToken.js";
import type { EcoBadge } from "../types/EcoBadge.js";
import type { MockV3Aggregator } from "../types/mocks/MockV3Aggregator.js";
import type { ReverseLogistics } from "../types/ReverseLogistics.sol/ReverseLogistics.js";
import type { EcoStaking } from "../types/EcoStaking.js";
import type { EcoDAO } from "../types/EcoDAO.js";

// ---------------------------------------------------------------------------
// Tipos de utilitário locais
// ---------------------------------------------------------------------------

/**
 * Formato de cada entrada de contrato gravada em contracts.json.
 * `abi` é tipado como `readonly unknown[]` para permanecer compatível com
 * os arrays `as const` gerados pelo TypeChain sem necessidade de cast.
 */
type ContractExport = {
  address: string;
  abi: readonly unknown[];
};

type ContractsFile = {
  network: string;
  chainId: number;
  generatedAt: string;
  contracts: {
    EcoToken: ContractExport;
    EcoBadge: ContractExport;
    ReverseLogistics: ContractExport;
    EcoStaking: ContractExport;
    EcoDAO: ContractExport;
  };
};

// ---------------------------------------------------------------------------
// Auxiliar: lê o ABI diretamente do artefato gerado pelo Hardhat
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function readAbi(relativeArtifactPath: string): Promise<readonly unknown[]> {
  const artifactPath = path.resolve(__dirname, "..", "artifacts", relativeArtifactPath);
  const raw = await fs.readFile(artifactPath, "utf-8");
  const artifact = JSON.parse(raw) as { abi: readonly unknown[] };
  return artifact.abi;
}

// ---------------------------------------------------------------------------
// Auxiliar: persiste o contracts.json para consumo pelo frontend
// ---------------------------------------------------------------------------

async function writeContractsJson(payload: ContractsFile): Promise<void> {
  const outputPath = path.resolve(
    __dirname,
    "..",
    "frontend",
    "src",
    "services",
    "contracts.json",
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log("✔  contracts.json salvo em:", outputPath);
}

// ---------------------------------------------------------------------------
// Rotina principal de deploy
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log("Realizando deploy com:", deployer.address);

  // ── EcoToken ──────────────────────────────────────────────────────────────
  const ecoToken: EcoToken = await new EcoToken__factory(deployer).deploy(
    deployer.address,
  );
  await ecoToken.waitForDeployment();

  // ── EcoBadge ──────────────────────────────────────────────────────────────
  const ecoBadge: EcoBadge = await new EcoBadge__factory(deployer).deploy(
    deployer.address,
  );
  await ecoBadge.waitForDeployment();

  // ── MockV3Aggregator (mock do price feed Chainlink) ────────────────────────
  const mockPriceFeed: MockV3Aggregator = await new MockV3Aggregator__factory(
    deployer,
  ).deploy(
    8,                 // decimals_   (uint8  → BigNumberish)
    3000n * 10n ** 8n, // initialAnswer (int256 → BigNumberish)
  );
  await mockPriceFeed.waitForDeployment();

  // ── ReverseLogistics ──────────────────────────────────────────────────────
  const reverseLogistics: ReverseLogistics =
    await new ReverseLogistics__factory(deployer).deploy(
      deployer.address,                    // admin
      await ecoToken.getAddress(),         // ecoTokenAddress
      await ecoBadge.getAddress(),         // ecoBadgeAddress  ← novo
      await mockPriceFeed.getAddress(),    // priceFeedAddress
      5n * 10n ** 18n,                     // flatFeeUsd18_
      3n * 10n ** 18n,                     // rewardUsd18_
      1n * 10n ** 18n,                     // ecoTokenUsdPrice18_
    );
  await reverseLogistics.waitForDeployment();

  // ── EcoStaking ────────────────────────────────────────────────────────────
  const ecoStaking: EcoStaking = await new EcoStaking__factory(deployer).deploy(
    deployer.address,              // admin
    await ecoToken.getAddress(),   // stakingTokenAddress
    await ecoToken.getAddress(),   // rewardTokenAddress
    10n ** 18n,                    // rewardRatePerSecond_
  );
  await ecoStaking.waitForDeployment();

  // ── EcoDAO ────────────────────────────────────────────────────────────────
  const ecoDao: EcoDAO = await new EcoDAO__factory(deployer).deploy(
    deployer.address,             // admin
    await ecoToken.getAddress(),  // governanceTokenAddress
    3 * 24 * 60 * 60,             // votingPeriod_  (number → BigNumberish)
    1_000n * 10n ** 18n,          // quorum_
  );
  await ecoDao.waitForDeployment();

  // ── Concessão de MINTER_ROLE (padrão mint-on-demand) ─────────────────────
  // ReverseLogistics e EcoStaking mintam ECO diretamente para os usuários,
  // eliminando a necessidade de pools pré-financiados.
  console.log("\nConcedendo MINTER_ROLE aos contratos operacionais…");

  const MINTER_ROLE = await ecoToken.MINTER_ROLE();

  // EcoToken: ReverseLogistics e EcoStaking podem mintar ECO
  const grantRLTx = await ecoToken.grantRole(MINTER_ROLE, await reverseLogistics.getAddress());
  await grantRLTx.wait();
  console.log("  ✔ MINTER_ROLE no EcoToken → ReverseLogistics");

  const grantSTTx = await ecoToken.grantRole(MINTER_ROLE, await ecoStaking.getAddress());
  await grantSTTx.wait();
  console.log("  ✔ MINTER_ROLE no EcoToken → EcoStaking");

  // EcoBadge: ReverseLogistics pode mintar NFTs de devolução
  const badgeMinterRole = await ecoBadge.MINTER_ROLE();
  const grantBadgeTx = await ecoBadge.grantRole(badgeMinterRole, await reverseLogistics.getAddress());
  await grantBadgeTx.wait();
  console.log("  ✔ MINTER_ROLE no EcoBadge  → ReverseLogistics");

  // ── Grava o contracts.json ─────────────────────────────────────────────────
  const contractsJson: ContractsFile = {
    network: network.name,
    chainId: network.config.chainId ?? 31337,
    generatedAt: new Date().toISOString(),
    contracts: {
      EcoToken: {
        address: await ecoToken.getAddress(),
        abi: await readAbi(path.join("contracts", "EcoToken.sol", "EcoToken.json")),
      },
      EcoBadge: {
        address: await ecoBadge.getAddress(),
        abi: await readAbi(path.join("contracts", "EcoBadge.sol", "EcoBadge.json")),
      },
      ReverseLogistics: {
        address: await reverseLogistics.getAddress(),
        abi: await readAbi(
          path.join("contracts", "ReverseLogistics.sol", "ReverseLogistics.json"),
        ),
      },
      EcoStaking: {
        address: await ecoStaking.getAddress(),
        abi: await readAbi(path.join("contracts", "EcoStaking.sol", "EcoStaking.json")),
      },
      EcoDAO: {
        address: await ecoDao.getAddress(),
        abi: await readAbi(path.join("contracts", "EcoDAO.sol", "EcoDAO.json")),
      },
    },
  };

  await writeContractsJson(contractsJson);

  // ── Endereços implantados ──────────────────────────────────────────────────
  console.log("EcoToken       :", await ecoToken.getAddress());
  console.log("EcoBadge       :", await ecoBadge.getAddress());
  console.log("MockPriceFeed  :", await mockPriceFeed.getAddress());
  console.log("ReverseLogistics:", await reverseLogistics.getAddress());
  console.log("EcoStaking     :", await ecoStaking.getAddress());
  console.log("EcoDAO         :", await ecoDao.getAddress());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
