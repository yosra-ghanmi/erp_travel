export function Card({ title, value, hint, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        {Icon ? (
          <Icon className="h-5 w-5 text-brand-600 dark:text-brand-500" />
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}

export function Panel({ title, right, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ value }) {
  const palette = {
    confirmed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    canceled:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    partial:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    unpaid: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    refunded: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    vip: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    active:
      "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400",
    suspended:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    lead: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        palette[value] ?? palette.lead
      }`}
    >
      {value}
    </span>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }) {
  return (
    <select
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950 ${className}`}
      {...props}
    />
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    ghost:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  return (
    <button
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        variants[variant] ?? variants.primary
      } ${className}`}
      {...props}
    />
  );
}

export function DataTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {headers.map((header) => (
              <th
                key={header}
                className="px-2 py-3 font-medium text-slate-500 dark:text-slate-400"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
