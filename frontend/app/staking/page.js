"use client";

import { useState }       from "react";
import { useWeb3 }        from "../context/Web3Context";
import { parseWeb3Error } from "../../lib/parseWeb3Error";
import StakingTab         from "../components/StakingTab";

export default function StakingPage() {
  const { web3, wallet, setStatus } = useWeb3();

  const [stakeAmountWei, setStakeAmountWei] = useState("1000000000000000000");

  async function handleStake() {
    try {
      setStatus("Executando stake…");
      const txHash = await web3.stakeEcoTokens(stakeAmountWei);
      setStatus(`Stake realizado. Tx: ${txHash.slice(0, 14)}…`);
    } catch (err) {
      setStatus(`Erro no staking: ${parseWeb3Error(err)}`);
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-white">
        Staking de EcoTokens
      </h1>
      <StakingTab
        stakeAmountWei={stakeAmountWei}
        setStakeAmountWei={setStakeAmountWei}
        onStake={handleStake}
        wallet={wallet}
      />
    </>
  );
}
