"use client";

import { useWeb3 }  from "../context/Web3Context";
import Navbar       from "./Navbar";
import contractsData from "../../src/services/contracts.json";

// ─── ícone de status ──────────────────────────────────────────────────────────
function StatusIcon({ type }) {
  if (type === "success") return <span style={{ color: "#4ade80" }}>✔</span>;
  if (type === "error")   return <span style={{ color: "#f87171" }}>✖</span>;
  return <span style={{ color: "#fbbf24", display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>;
}

function statusType(msg) {
  if (!msg || msg === "Pronto.") return "idle";
  if (/erro|error|fail/i.test(msg)) return "error";
  if (/sucesso|realizado|registrado|conectada|conectado|stake|voto/i.test(msg)) return "success";
  return "loading";
}

const STATUS_STYLES = {
  error:   { borderColor: "rgba(239,68,68,.2)",  background: "rgba(239,68,68,.05)",  color: "#fca5a5" },
  success: { borderColor: "rgba(74,222,128,.2)", background: "rgba(74,222,128,.05)", color: "#86efac" },
  loading: { borderColor: "rgba(251,191,36,.2)", background: "rgba(251,191,36,.05)", color: "#fde68a" },
  idle:    { borderColor: "rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#94a3b8" },
};

/**
 * AppShell — Client Component que envolve o conteúdo de todas as rotas.
 * Renderiza a Navbar global e a barra de status compartilhada.
 */
export default function AppShell({ children }) {
  const { wallet, connecting, status, network, handleConnect } = useWeb3();
  const sType = statusType(status);
  const style = STATUS_STYLES[sType];

  return (
    <>
      <Navbar
        wallet={wallet}
        connecting={connecting}
        onConnect={handleConnect}
      />

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6">

        {/* ── Breadcrumb de rede ── */}
        <div className="mb-8">
          <p className="text-sm text-slate-500">
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

        {/* ── Conteúdo da rota atual ── */}
        {children}

        {/* ── Barra de status global ── */}
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            borderRadius: 12,
            border: "1px solid " + style.borderColor,
            background: style.background,
            color: style.color,
            padding: "14px 16px",
            fontSize: 14,
            transition: "all .2s",
          }}
        >
          <StatusIcon type={sType} />
          <span style={{ minWidth: 0, wordBreak: "break-all", overflowWrap: "anywhere", flex: 1 }}>
            {status}
          </span>
        </div>

      </main>
    </>
  );
}
