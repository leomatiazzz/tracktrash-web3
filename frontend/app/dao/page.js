"use client";

import { useState } from "react";
import { useWeb3 }  from "../context/Web3Context";
import DAOTab       from "../components/DAOTab";

export default function DAOPage() {
  const { web3, wallet, setStatus } = useWeb3();

  const [proposalId, setProposalId] = useState("1");
  const [support,    setSupport]    = useState(true);

  async function handleVote() {
    try {
      setStatus("Enviando voto na DAO…");
      const txHash = await web3.voteInDao(proposalId, support);
      setStatus(`Voto registrado. Tx: ${txHash.slice(0, 14)}…`);
    } catch (err) {
      const raw = err.message ?? String(err);
      setStatus(`Erro na votação: ${raw.split(" (error=")[0]}`);
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-white">
        Governança EcoDAO
      </h1>
      <DAOTab
        proposalId={proposalId} setProposalId={setProposalId}
        support={support}       setSupport={setSupport}
        onVote={handleVote}
        wallet={wallet}
      />
    </>
  );
}
