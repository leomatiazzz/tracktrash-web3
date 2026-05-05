/**
 * Aba: Dashboard / Logística Reversa
 * Registrar devolução + mint do EcoBadge NFT.
 */
import Card from "./Card";
import Field from "./Field";

const SZ = { width: 20, height: 20, display: "block", flexShrink: 0 };

const RecycleIcon = (
  <svg style={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1 4 1 10 7 10" />
    <polyline points="23 20 23 14 17 14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

const BadgeIcon = (
  <svg style={SZ} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export default function LogisticsTab({
  itemId, setItemId,
  quantity, setQuantity,
  metadataURI, setMetadataURI,
  feeInEth, setFeeInEth,
  achievementType, setAchievementType,
  impactScore, setImpactScore,
  onRegisterAndMint,
  wallet,
}) {
  const connected = Boolean(wallet);

  return (
    <div className="grid gap-6 md:grid-cols-2">

      {/* ── Registrar devolução ── */}
      <Card title="Registrar Devolução" icon={RecycleIcon}>
        <div className="flex flex-col gap-4">
          <Field
            id="itemId"
            label="ID do Item"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            placeholder="Ex.: ITEM-001"
          />
          <Field
            id="quantity"
            label="Quantidade"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
          />
          <Field
            id="metadataURI"
            label="Metadata URI"
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            placeholder="ipfs://eco/metadata/1"
          />
          <Field
            id="feeInEth"
            label="Taxa (ETH)"
            value={feeInEth}
            onChange={(e) => setFeeInEth(e.target.value)}
            placeholder="0.002"
          />
          <p style={{ marginTop: -8, fontSize: 11, color: "#6ee7b7", opacity: 0.7 }}>
            Mínimo ~0.002 ETH (≈ $5 USD com ETH a $3.000). Taxa vai para o pool de recompensas.
          </p>
        </div>
      </Card>

      {/* ── Mint EcoBadge NFT ── */}
      <Card title="Mint EcoBadge NFT" icon={BadgeIcon}>
        <div className="flex flex-col gap-4">
          {/* Tipo de Conquista — dropdown */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="achievementType"
              className="text-xs font-medium text-slate-400"
            >
              Tipo de Conquista
            </label>
            <select
              id="achievementType"
              value={achievementType}
              onChange={(e) => setAchievementType(e.target.value)}
              className="w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30"
              style={{ backgroundColor: "#0f2318", colorScheme: "dark" }}
            >
              {[
                "Primeira Reciclagem",
                "Reciclagem Avançada",
                "Herói do Plástico",
                "Mestre do Vidro",
                "Guardião do E-Lixo",
                "Resgate de Embalagens",
                "Eco Embaixador",
              ].map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  style={{ backgroundColor: "#0f2318", color: "#f1f5f9" }}
                >
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <Field
            id="impactScore"
            label="Impact Score"
            type="number"
            value={impactScore}
            onChange={(e) => setImpactScore(e.target.value)}
            placeholder="100"
          />

          <div className="mt-2 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-xs text-green-300/80 leading-relaxed">
            O NFT será automaticamente mintado para sua carteira ao confirmar o registro da devolução.
          </div>

          <button
            onClick={onRegisterAndMint}
            disabled={!connected}
            className="mt-auto w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {connected ? "Registrar + Mint NFT" : "Conecte a carteira primeiro"}
          </button>
        </div>
      </Card>

    </div>
  );
}
