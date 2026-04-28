/**
 * Card glassmorphism reutilizável.
 * `accent` define a cor da borda superior (ex.: "green" | "emerald" | "teal").
 */
export default function Card({ title, icon, children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-[#1e3024]/70 p-6 shadow-xl backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {(title || icon) && (
        <div className="mb-5 flex items-center gap-2">
          {icon && <span className="text-green-400">{icon}</span>}
          {title && (
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
