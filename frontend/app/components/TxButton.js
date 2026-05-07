/**
 * TxButton — botão de transação reutilizável.
 * Gerencia estado de loading, disabled e feedback visual
 * de forma consistente em todos os formulários Web3.
 */
export default function TxButton({ onClick, disabled, loading, children, className = "" }) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        loading
          ? "cursor-wait bg-green-600 shadow-green-900/40"
          : "bg-green-500 shadow-green-900/40 hover:bg-green-400",
        className,
      ].join(" ")}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Aguardando confirmação…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
