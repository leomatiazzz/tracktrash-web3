"use client";

import { useMemo, useState } from "react";
import { Web3Service } from "../lib/Web3Service";
import contractsData from "../src/services/contracts.json";

import Navbar       from "./components/Navbar";
import LogisticsTab from "./components/LogisticsTab";
import StakingTab   from "./components/StakingTab";
import DAOTab       from "./components/DAOTab";

// ─── ícone de status ──────────────────────────────────────────────────────────
function StatusIcon({ type }) {
  if (type === "success") return <span className="text-green-400">✔</span>;
  if (type === "error")   return <span className="text-red-400">✖</span>;
  return <span className="text-amber-400 animate-pulse">⟳</span>;
}

function statusType(msg) {
  if (!msg || msg === "Pronto.") return "idle";
  if (/erro|error|fail/i.test(msg)) return "error";
  if (/sucesso|realizado|registrado|conectada|conectado/i.test(msg)) return "success";
  return "loading";
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const web3 = useMemo(() => new Web3Service(), []);

  // Wallet
  const [wallet,  setWallet]  = useState("");
  const [network, setNetwork] = useState(contractsData.network ?? "—");
  const [status,  setStatus]  = useState("Pronto.");

  // Abas
  const [activeTab, setActiveTab] = useState("logistics");

  // Logística
  const [itemId,          setItemId]          = useState("ITEM-001");
  const [quantity,        setQuantity]        = useState("1");
  const [metadataURI,     setMetadataURI]     = useState("ipfs://eco/metadata/1");
  const [feeInEth,        setFeeInEth]        = useState("0.002");
  const [achievementType, setAchievementType] = useState("Reciclagem Avançada");
  const [impactScore,     setImpactScore]     = useState("100");

  // Staking
  const [stakeAmountWei, setStakeAmountWei] = useState("1000000000000000000");

  // DAO
  const [proposalId, setProposalId] = useState("1");
  const [support,    setSupport]    = useState(true);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  async function handleConnect() {
    try {
      setStatus("Conectando MetaMask…");
      const address = await web3.connectWallet();
      setWallet(address);
      setStatus("Carteira conectada com sucesso.");
    } catch (err) {
      setStatus(`Erro ao conectar: ${err.message}`);
    }
  }

  async function handleRegisterAndMint() {
    try {
      setStatus("Registrando devolução e mintando NFT…");
      const result = await web3.registerReturnAndMintBadge({
        itemId,
        quantity: BigInt(quantity),
        metadataURI,
        feeInEth,
        achievementType,
        impactScore,
      });
      setStatus(
        `Sucesso! Return tx: ${result.returnTxHash.slice(0, 10)}… | Mint tx: ${result.mintTxHash.slice(0, 10)}…`
      );
    } catch (err) {
      setStatus(`Erro na devolução/NFT: ${err.message}`);
    }
  }

  async function handleStake() {
    try {
      setStatus("Executando stake…");
      const txHash = await web3.stakeEcoTokens(stakeAmountWei);
      setStatus(`Stake realizado. Tx: ${txHash.slice(0, 14)}…`);
    } catch (err) {
      setStatus(`Erro no staking: ${err.message}`);
    }
  }

  async function handleVote() {
    try {
      setStatus("Enviando voto na DAO…");
      const txHash = await web3.voteInDao(proposalId, support);
      setStatus(`Voto registrado. Tx: ${txHash.slice(0, 14)}…`);
    } catch (err) {
      setStatus(`Erro na votação: ${err.message}`);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  const sType = statusType(status);

  return (
    <>
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        wallet={wallet}
        onConnect={handleConnect}
      />

      {/* conteúdo deslocado para baixo da navbar fixa */}
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6">

        {/* ── Breadcrumb de rede ── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {activeTab === "logistics" && "Logística Reversa"}
              {activeTab === "staking"   && "Staking de EcoTokens"}
              {activeTab === "dao"       && "Governança EcoDAO"}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Rede:{" "}
              <span className="font-medium text-green-400">{network}</span>
              {" · "}
              Gerado em:{" "}
              <span className="font-medium text-slate-400">
                {contractsData.generatedAt
                  ? new Date(contractsData.generatedAt).toLocaleString("pt-BR")
                  : "—"}
              </span>
            </p>
          </div>
        </div>

        {/* ── Abas ── */}
        {activeTab === "logistics" && (
          <LogisticsTab
            itemId={itemId}           setItemId={setItemId}
            quantity={quantity}       setQuantity={setQuantity}
            metadataURI={metadataURI} setMetadataURI={setMetadataURI}
            feeInEth={feeInEth}       setFeeInEth={setFeeInEth}
            achievementType={achievementType} setAchievementType={setAchievementType}
            impactScore={impactScore} setImpactScore={setImpactScore}
            onRegisterAndMint={handleRegisterAndMint}
            wallet={wallet}
          />
        )}

        {activeTab === "staking" && (
          <StakingTab
            stakeAmountWei={stakeAmountWei}
            setStakeAmountWei={setStakeAmountWei}
            onStake={handleStake}
            wallet={wallet}
          />
        )}

        {activeTab === "dao" && (
          <DAOTab
            proposalId={proposalId} setProposalId={setProposalId}
            support={support}       setSupport={setSupport}
            onVote={handleVote}
            wallet={wallet}
          />
        )}

        {/* ── Status global ── */}
        <div
          className={[
            "mt-8 flex items-start gap-3 rounded-xl border p-4 text-sm transition-all",
            sType === "error"
              ? "border-red-500/20 bg-red-500/5 text-red-300"
              : sType === "success"
              ? "border-green-500/20 bg-green-500/5 text-green-300"
              : sType === "loading"
              ? "border-amber-500/20 bg-amber-500/5 text-amber-300"
              : "border-white/10 bg-white/5 text-slate-400",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          <StatusIcon type={sType} />
          <span>{status}</span>
        </div>

      </main>
    </>
  );
}
