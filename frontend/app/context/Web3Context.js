"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Web3Service } from "../../lib/Web3Service";
import contractsData from "../../src/services/contracts.json";

// ─── Contexto ─────────────────────────────────────────────────────────────────
const Web3Context = createContext(null);

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used inside <Web3Provider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function Web3Provider({ children }) {
  const web3 = useMemo(() => new Web3Service(), []);

  const [wallet,     setWallet]     = useState("");
  const [connecting, setConnecting] = useState(false);
  const [status,     setStatus]     = useState("Pronto.");
  const network = contractsData.network ?? "—";

  // Detecta troca de conta e desconexão no MetaMask
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    // Verifica passivamente se já há contas autorizadas (sem popup)
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => { if (!accounts?.length) setWallet(""); })
      .catch(() => {});

    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWallet("");
        web3.signer   = null;
        web3.provider = null;
        setStatus("Carteira desconectada.");
      } else {
        setWallet(accounts[0]);
        setStatus("Conta alterada: " + accounts[0].slice(0, 10) + "…");
      }
    };

    const onDisconnect = () => {
      setWallet("");
      web3.signer   = null;
      web3.provider = null;
      setStatus("Carteira desconectada.");
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("disconnect",      onDisconnect);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("disconnect",      onDisconnect);
    };
  }, [web3]);

  // ─── Handler de conexão ───────────────────────────────────────────────────
  async function handleConnect() {
    try {
      setConnecting(true);
      setStatus("Aguardando autorização da carteira…");
      const address = await web3.connectWallet();
      setWallet(address);
      setStatus("Carteira conectada com sucesso.");
    } catch (err) {
      setStatus(`Erro ao conectar: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Web3Context.Provider
      value={{ web3, wallet, connecting, status, setStatus, network, handleConnect }}
    >
      {children}
    </Web3Context.Provider>
  );
}
