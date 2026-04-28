/**
 * Input estilizado para o tema dark orgânico.
 */
export default function Field({ label, id, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-slate-400">
          {label}
        </label>
      )}
      <input
        id={id}
        className="rounded-lg border border-white/10 bg-[#111a14] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none ring-0 transition focus:border-green-500/60 focus:ring-1 focus:ring-green-500/40"
        {...props}
      />
    </div>
  );
}
