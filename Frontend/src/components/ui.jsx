import { motion } from "framer-motion";

export function Card({ title, value, hint, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-600 dark:bg-slate-800"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150 dark:bg-brand-500/10" />
      <div className="relative flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-slate-300">
          {title}
        </p>
        <div className="rounded-xl bg-blue-50 p-2 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-brand-600">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </div>
      </div>
      <div className="relative mt-4">
        <h4 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
        </h4>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-slate-400">
          <span className="text-emerald-500 font-bold">↑</span>
          {hint}
        </p>
      </div>
    </motion.div>
  );
}

export function Panel({ title, right, children, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-slate-800 ${className}`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
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
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
    pending:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
    canceled:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/50",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
    "fully paid":
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
    partial:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
    unpaid:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50",
    refunded:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/50",
    vip: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50",
    active:
      "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-800/50",
    inactive:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50",
    draft:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
    expired:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50",
    terminated:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/50",
    suspended:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/50",
    lead: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50",
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
      className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none ring-blue-500/20 transition-all focus:border-blue-500 focus:ring-1 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400 dark:ring-brand-500/10 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }) {
  return (
    <select
      className={`w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none ring-blue-500/20 transition-all focus:border-blue-500 focus:ring-1 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:ring-brand-500/10 ${className}`}
      {...props}
    />
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary:
      "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95 dark:bg-brand-600 dark:hover:bg-brand-700",
    ghost:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600",
    danger:
      "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:scale-95 dark:bg-rose-600 dark:hover:bg-rose-700",
    success:
      "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-700",
    outline:
      "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:scale-95 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800",
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

export function IconButton({ icon: Icon, onClick, variant = "ghost", className = "", title = "" }) {
  const variants = {
    ghost: "p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors",
    danger: "p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-colors",
    primary: "p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-brand-400 dark:hover:bg-brand-900/30 transition-colors",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="h-5 w-5" />}
    </button>
  );
}

export function DataTable({ headers, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-slate-700">
          <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase dark:bg-slate-800/80">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-4 font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-700 dark:bg-transparent">
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
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-premium dark:border-gray-600 dark:bg-slate-900"
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
