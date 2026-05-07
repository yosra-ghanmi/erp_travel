import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  Tag, 
  FileText, 
  Plus, 
  TrendingDown, 
  PieChart, 
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Edit3
} from "lucide-react";
import { Button, DataTable, Input, Panel, Select, Card, StatusBadge } from "../components/ui";
import {
  fetchExpenses,
  createExpense,
  syncExpensesFromInvoices,
} from "../services/erpApi";

const initialForm = {
  type: "Hotel",
  amount: 0,
  // Environment Note: Business Central license restricts dates to specific months (Nov, Dec, Jan, Feb)
  date: "2026-01-15",
  description: "",
};

export function ExpensesPage({ searchQuery }) {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter((exp) => {
      const type = String(exp.expensetype || exp.type || "").toLowerCase();
      const desc = String(exp.description || "").toLowerCase();
      const id = String(exp.expenseid || "").toLowerCase();
      return type.includes(q) || desc.includes(q) || id.includes(q);
    });
  }, [expenses, searchQuery]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchExpenses();
        setExpenses(data || []);
      } catch (err) {
        console.error("Failed to load expenses:", err);
      }
    };
    loadData();
  }, []);

  const saveExpense = async () => {
    if (!form.amount || !form.type) return;
    setLoading(true);
    setError("");
    try {
      const result = await createExpense(form);
      setExpenses((prev) => [...prev, result]);
      setForm(initialForm);
    } catch (err) {
      setError("Failed to save expense.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await syncExpensesFromInvoices();
      const data = await fetchExpenses();
      setExpenses(data || []);
    } catch (err) {
      setError("Failed to sync expenses from invoices.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
    count: expenses.length,
    avg: expenses.length > 0 ? (expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0) / expenses.length).toFixed(2) : 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Expenses <span className="text-rose-500">.</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Track and manage your operational costs and invoices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={loading}
            className="gap-2 h-12 px-6 border-slate-200 bg-white/50 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sync Invoices
          </Button>
          <Button variant="primary" className="gap-2 h-12 px-6 shadow-premium">
            <Plus className="h-5 w-5" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card 
          title="Total Outflow" 
          value={`$${stats.total.toLocaleString()}`} 
          hint="+2.4% from last week" 
          icon={TrendingDown} 
        />
        <Card 
          title="Expense Count" 
          value={stats.count} 
          hint="Processed invoices" 
          icon={FileText} 
        />
        <Card 
          title="Average Ticket" 
          value={`$${stats.avg}`} 
          hint="Per transaction" 
          icon={PieChart} 
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="Expenses Tracker"
            right={<StatusBadge value={`${filteredExpenses.length} Records`} />}
          >
          {error && (
            <div className="mb-4 text-xs text-rose-500 font-medium">
              {error}
            </div>
          )}
          <DataTable
            headers={["ID", "Type", "Description", "Amount", "Date"]}
            rows={filteredExpenses.map((exp, idx) => (
              <motion.tr
                key={exp.expenseid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">
                      {exp.expenseid}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {exp.date}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <Tag className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {exp.expensetype || exp.type}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-400">
                    {exp.description || "Operational cost"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-rose-600">
                      -${Number(exp.amount || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">USD</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" className="h-8 w-8 rounded-lg p-0">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="h-8 w-8 rounded-lg p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          />
        </Panel>
      </div>
        <div className="space-y-6">
          <Panel title="New Expense Entry">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Expense Type</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    value={form.type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                  >
                    <option value="Hotel">Hotel & Accommodation</option>
                    <option value="Transport">Transport & Logistics</option>
                    <option value="Flights">Airfare & Travel</option>
                    <option value="Marketing">Marketing & Ads</option>
                    <option value="Staff">Staff & Payroll</option>
                    <option value="Other">Miscellaneous</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white font-bold"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Date</label>
                  <Input
                    type="date"
                    className="h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Detailed Description</label>
                <textarea
                  className="w-full rounded-xl border border-transparent bg-slate-50/50 px-4 py-3 text-sm outline-none ring-brand-500/20 transition-all focus:bg-white focus:ring-4 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="What was this expense for?"
                />
              </div>

              <Button 
                onClick={saveExpense} 
                className="w-full h-14 text-lg shadow-premium mt-4" 
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Log Expense"
                )}
              </Button>
            </div>
          </Panel>

          {/* Quick Info Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-[2rem] bg-gradient-to-br from-rose-500 to-rose-600 p-8 text-white shadow-xl shadow-rose-500/20"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h4 className="mb-2 text-xl font-black">Financial Integrity</h4>
            <p className="text-sm leading-relaxed text-rose-100 opacity-90">
              Ensure all receipts are attached to physical records. This portal syncs directly with the central ledger.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
