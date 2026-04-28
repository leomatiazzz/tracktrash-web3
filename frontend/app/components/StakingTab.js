/**
 * Aba: Staking de EcoTokens
 */
import Card from "./Card";
import Field from "./Field";

const SZ = { width: 20, height: 20, display: "block", flexShrink: 0 };

const CoinsIcon = (
  <svg style={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
);

const LockIcon = (
  <svg style={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function StakingTab({ stakeAmountWei, setStakeAmountWei, onStake, wallet }) {
  const connected = Boolean(wallet);

  return (
    <div className="grid gap-6 md:grid-cols-2">

      {/* ── Informações ── */}
      <Card title="Como funciona o Staking" icon={CoinsIcon}>
        <ul className="space-y-3 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-green-400">1.</span>
            <span>Aprove o contrato <code className="rounded bg-white/5 px-1 text-green-300">EcoStaking</code> para gastar seus <strong className="text-slate-200">EcoTokens</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-green-400">2.</span>
            <span>Informe a quantidade em Wei e clique em <strong className="text-slate-200">Fazer Stake</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-green-400">3.</span>
            <span>Recompensas acumulam por segundo e podem ser sacadas a qualquer momento.</span>
          </li>
        </ul>

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300/80 leading-relaxed">
          <strong className="text-amber-300">Atenção:</strong> certifique-se de que o contrato <code>EcoStaking</code> possui permissão de <em>MINTER_ROLE</em> para pagar recompensas.
        </div>
      </Card>

      {/* ── Ação de Stake ── */}
      <Card title="Trancar EcoTokens" icon={LockIcon}>
        <div className="flex flex-col gap-4">
          <Field
            id="stakeAmount"
            label="Quantidade (Wei)"
            value={stakeAmountWei}
            onChange={(e) => setStakeAmountWei(e.target.value)}
            placeholder="1000000000000000000"
          />

          <p className="text-xs text-slate-500">
            1 ECO = 10<sup>18</sup> Wei. Exemplo: 1 token = <code className="text-slate-300">1000000000000000000</code>
          </p>

          <button
            onClick={onStake}
            disabled={!connected}
            className="mt-auto w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {connected ? "Fazer Stake" : "Conecte a carteira primeiro"}
          </button>
        </div>
      </Card>

    </div>
  );
}
