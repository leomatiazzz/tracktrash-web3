"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Web3Service } from "../../lib/Web3Service";
import contractsData from "../../src/services/contracts.json";

// ─── Contexto ─────────────────────────────────────────────────────────────────
const Web3Context = createContext(null);

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used inside <Web3Provider>");
  return ctx;
}

// chainId esperado vem do contracts.json (gerado no deploy)
const EXPECTED_CHAIN_ID = contractsData.chainId ?? 11155111;

// ─── Provider ─────────────────────────────────────────────────────────────────
export function Web3Provider({ children }) {
  const web3 = useMemo(() => new Web3Service(), []);

  const [wallet,         setWallet]         = useState("");
  const [connecting,     setConnecting]     = useState(false);
  const [status,         setStatus]         = useState("Pronto.");
  const [currentChainId, setCurrentChainId] = useState(null);
  const network = contractsData.network ?? "—";

  // rede incorreta = carteira conectada mas chainId diferente do esperado
  const isWrongNetwork =
    Boolean(wallet) && currentChainId !== null && currentChainId !== EXPECTED_CHAIN_ID;

  // ─── Detecta rede, restaura sessão e registra listeners ─────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    // Lê chainId inicial (passivo, sem popup)
    window.ethereum
      .request({ method: "eth_chainId" })
      .then((id) => setCurrentChainId(parseInt(id, 16)))
      .catch(() => {});

    // [FIX] Restaura sessão anterior: se o usuário já autorizou esta dApp,
    // eth_accounts retorna as contas sem popup → restaura wallet + provider/signer.
    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts?.length) {
          setWallet(accounts[0]);
          // Reconecta silenciosamente sem exibir popup
          const { BrowserProvider } = await import("ethers");
          web3.provider = new BrowserProvider(window.ethereum);
          web3.signer   = await web3.provider.getSigner();
        }
      })
      .catch(() => {});

    // ── Event listeners ──────────────────────────────────────────────────
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

    const onChainChanged = (chainIdHex) => {
      setCurrentChainId(parseInt(chainIdHex, 16));
      // Invalida provider/signer — serão recriados na próxima transação
      web3.provider = null;
      web3.signer   = null;
    };

    const onDisconnect = () => {
      setWallet("");
      web3.signer   = null;
      web3.provider = null;
      setStatus("Carteira desconectada.");
    };

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged",    onChainChanged);
    window.ethereum.on("disconnect",      onDisconnect);

    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged",    onChainChanged);
      window.ethereum.removeListener("disconnect",      onDisconnect);
    };
  }, [web3]);

  // ─── useCallback: evita recriar funções a cada render ───────────────────

  /** Troca a rede do MetaMask para Sepolia via popup automático. */
  const switchToCorrectNetwork = useCallback(async () => {
    try {
      await web3.ensureCorrectNetwork();
      const id = await window.ethereum.request({ method: "eth_chainId" });
      setCurrentChainId(parseInt(id, 16));
      const { BrowserProvider } = await import("ethers");
      web3.provider = new BrowserProvider(window.ethereum);
      web3.signer   = await web3.provider.getSigner();
      setStatus("Rede alterada para Sepolia com sucesso.");
    } catch {
      setStatus("Troca de rede cancelada ou falhou.");
    }
  }, [web3]);

  /** Conecta a carteira (com popup de autorização). */
  const handleConnect = useCallback(async () => {
    try {
      setConnecting(true);
      setStatus("Aguardando autorização da carteira…");
      const address = await web3.connectWallet();
      setWallet(address);
      const id = await window.ethereum.request({ method: "eth_chainId" });
      setCurrentChainId(parseInt(id, 16));
      setStatus("Carteira conectada com sucesso.");
    } catch (err) {
      setStatus(`Erro ao conectar: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  }, [web3]);

  return (
    <Web3Context.Provider
      value={{
        web3,
        wallet,
        connecting,
        status,
        setStatus,
        network,
        handleConnect,
        isWrongNetwork,
        currentChainId,
        expectedChainId: EXPECTED_CHAIN_ID,
        switchToCorrectNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
