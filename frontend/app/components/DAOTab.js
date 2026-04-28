/**
 * Aba: Governança DAO
 */
import { useState } from "react";
import Card from "./Card";
import Field from "./Field";

const SZ = { width: 20, height: 20, display: "block", flexShrink: 0 };

const ScaleIcon = (
  <svg style={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const VoteIcon = (
  <svg style={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 12 2 2 4-4" />
    <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
    <path d="M22 19H2" />
  </svg>
);

export default function DAOTab({ proposalId, setProposalId, support, setSupport, onVote, wallet }) {
  const connected = Boolean(wallet);

  return (
    <div className="grid gap-6 md:grid-cols-2">

      {/* ── Sobre a DAO ── */}
      <Card title="EcoDAO — Governança" icon={ScaleIcon}>
        <p className="text-sm text-slate-400 leading-relaxed">
          A <strong className="text-slate-200">EcoDAO</strong> permite que detentores de <strong className="text-green-300">EcoTokens</strong> votem em propostas que afetam o protocolo — como ajustes de recompensas, upgrades de contrato e regras de logística reversa.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-500">
          <li className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
            Quorum mínimo definido em contrato
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
            Período de votação configurável
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
            Peso do voto = saldo de EcoTokens
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
            Execução automática ao atingir maioria
          </li>
        </ul>
      </Card>

      {/* ── Formulário de voto ── */}
      <Card title="Registrar Voto" icon={VoteIcon}>
        <div className="flex flex-col gap-5">
          <Field
            id="proposalId"
            label="ID da Proposta"
            type="number"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            placeholder="1"
          />

          {/* Toggle Favor / Contra */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400">Seu Voto</span>
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              <button
                onClick={() => setSupport(true)}
                className={[
                  "flex-1 py-2.5 text-sm font-medium transition",
                  support
                    ? "bg-green-500 text-white"
                    : "bg-transparent text-slate-400 hover:bg-green-500/10 hover:text-green-300",
                ].join(" ")}
              >
                ✓ Favor
              </button>
              <button
                onClick={() => setSupport(false)}
                className={[
                  "flex-1 py-2.5 text-sm font-medium transition",
                  !support
                    ? "bg-red-500/80 text-white"
                    : "bg-transparent text-slate-400 hover:bg-red-500/10 hover:text-red-300",
                ].join(" ")}
              >
                ✗ Contra
              </button>
            </div>
          </div>

          <button
            onClick={onVote}
            disabled={!connected}
            className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {connected ? "Confirmar Voto" : "Conecte a carteira primeiro"}
          </button>
        </div>
      </Card>

    </div>
  );
}
