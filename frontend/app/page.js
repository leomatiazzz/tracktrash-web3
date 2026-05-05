"use client";

import { useState }   from "react";
import { useWeb3 }    from "./context/Web3Context";
import LogisticsTab   from "./components/LogisticsTab";

export default function LogisticsPage() {
  const { web3, wallet, setStatus } = useWeb3();

  const [itemId,          setItemId]          = useState("ITEM-001");
  const [quantity,        setQuantity]        = useState("1");
  const [metadataURI,     setMetadataURI]     = useState("ipfs://eco/metadata/1");
  const [feeInEth,        setFeeInEth]        = useState("0.002");
  const [achievementType, setAchievementType] = useState("Primeira Reciclagem");
  const [impactScore,     setImpactScore]     = useState("100");

  async function handleRegisterAndMint() {
    const fee = parseFloat(feeInEth);
    if (!feeInEth || isNaN(fee) || fee <= 0) {
      setStatus("Erro: informe um valor de taxa em ETH (mínimo ~0.002 ETH).");
      return;
    }
    if (fee < 0.002) {
      setStatus(`Erro: taxa insuficiente. Mínimo recomendado: 0.002 ETH. Você informou ${feeInEth} ETH.`);
      return;
    }
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
      setStatus(`Sucesso! Tx: ${result.returnTxHash.slice(0, 18)}…`);
    } catch (err) {
      const raw = err.message ?? String(err);
      setStatus(`Erro na devolução/NFT: ${raw.split(" (error=")[0].split(", payload=")[0]}`);
    }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-white">
        Logística Reversa
      </h1>
      <LogisticsTab
        itemId={itemId}                   setItemId={setItemId}
        quantity={quantity}               setQuantity={setQuantity}
        metadataURI={metadataURI}         setMetadataURI={setMetadataURI}
        feeInEth={feeInEth}               setFeeInEth={setFeeInEth}
        achievementType={achievementType} setAchievementType={setAchievementType}
        impactScore={impactScore}         setImpactScore={setImpactScore}
        onRegisterAndMint={handleRegisterAndMint}
        wallet={wallet}
      />
    </>
  );
}
