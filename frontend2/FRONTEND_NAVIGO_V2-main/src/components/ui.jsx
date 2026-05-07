import { motion } from "framer-motion";

export function Card({ title, value, hint, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-all hover:shadow-premium dark:border-slate-800 dark:bg-slate-900/50 dark:backdrop-blur-xl"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-brand-500/5 transition-transform group-hover:scale-150 dark:bg-brand-500/10" />
      <div className="relative flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="rounded-xl bg-brand-50 p-2 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/30 dark:text-brand-400">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
      </div>
      <div className="relative mt-4">
        <h4 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h4>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="text-emerald-500">↑</span>
          {hint}
        </p>
      </div>
    </motion.div>
  );
}

export function Panel({ title, right, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div className="relative">{children}</div>
    </motion.section>
  );
}

export function StatusBadge({ value }) {
  const palette = {
    confirmed:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    pending:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    canceled:
      "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    "fully paid":
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    partial:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    unpaid:
      "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
    refunded:
      "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800",
    vip: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    active:
      "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800",
    suspended:
      "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
    lead: "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-all ${
        palette[value?.toLowerCase()] ?? palette.lead
      }`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {value}
    </span>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 outline-none ring-brand-500/20 transition-all focus:border-brand-500 focus:ring-4 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder-slate-500 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }) {
  return (
    <select
      className={`w-full appearance-none rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 outline-none ring-brand-500/20 transition-all focus:border-brand-500 focus:ring-4 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 ${className}`}
      {...props}
    />
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary:
      "bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:shadow-brand-600/30 active:scale-95",
    ghost:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95",
    danger:
      "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 hover:shadow-rose-600/30 active:scale-95",
    success:
      "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-95",
    outline:
      "border-2 border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 active:scale-95",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold tracking-tight transition-all disabled:opacity-50 ${
        variants[variant] ?? variants.primary
      } ${className}`}
      {...props}
    />
  );
}

export function DataTable({ headers, rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900/50">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-4 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-transparent">
            {rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-premium dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
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
        <div className="relative">{children}</div>
      </motion.div>
    </div>
  );
}
