"use client";

/**
 * Navbar fixa — logo à esquerda, abas no centro, wallet à direita.
 * Props: activeTab, onTabChange, wallet, onConnect, connecting
 */

const TABS = [
  { id: "logistics", label: "Logística" },
  { id: "staking",   label: "Staking"   },
  { id: "dao",       label: "DAO"        },
];

function truncate(addr) {
  if (!addr) return null;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Navbar({ activeTab, onTabChange, wallet, onConnect, connecting }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1610]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

        {/* ── Logo ── */}
        <div className="flex items-center gap-2 select-none">
          <svg
            style={{ width: 28, height: 28, display: "block", flexShrink: 0, color: "#4ade80" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22c0 0-8-5-8-12a8 8 0 0 1 16 0c0 7-8 12-8 12z" />
            <path d="M12 22V10" />
          </svg>
          <span className="text-xl font-bold tracking-tight text-white">
            TrackTrash
          </span>
          <span className="hidden text-xs font-medium text-green-400/70 sm:inline">
            Smart Reverse Logistics
          </span>
        </div>

        {/* ── Navegação por abas ── */}
        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={[
                  "relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-green-500/20 text-green-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Wallet ── */}
        <div className="flex items-center gap-3">
          {wallet ? (
            <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-300">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              {truncate(wallet)}
            </div>
          ) : (
            <button
              id="btn-connect-wallet"
              onClick={onConnect}
              disabled={connecting}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-400 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
            >
              {connecting ? "Aguardando carteira…" : "Conectar Carteira"}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
