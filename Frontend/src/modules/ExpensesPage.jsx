import { useState, useEffect, useMemo } from "react";
import { Button, DataTable, Input, Panel, Select } from "../components/ui";
import {
  fetchExpenses,
  createExpense,
  syncExpensesFromInvoices,
} from "../services/erpApi";
import { RefreshCw } from "lucide-react";

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

  const normalizeExpense = (exp, index) => ({
    ...exp,
    id: exp.expenseId || exp.expenseid || exp.id || `temp-expense-${index}`,
    type: exp.expenseType || exp.expensetype || exp.type || "Other",
    amount: exp.amount,
    date: exp.date || exp.expenseDate || exp.expensedate,
    description: exp.description,
  });

  const normalizedExpenses = useMemo(
    () => expenses.map((exp, index) => normalizeExpense(exp, index)),
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    if (!searchQuery) return normalizedExpenses;
    const q = searchQuery.toLowerCase();
    return normalizedExpenses.filter((exp) => {
      const type = String(exp.type || "").toLowerCase();
      const desc = String(exp.description || "").toLowerCase();
      const id = String(exp.id || "").toLowerCase();
      return type.includes(q) || desc.includes(q) || id.includes(q);
    });
  }, [normalizedExpenses, searchQuery]);

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

  const typeToExpenseType = {
    Hotel: "Hotel",
    Transport: "Transport",
    Flights: "Flights",
    Marketing: "Marketing",
    Staff: "Staff",
    Refund: "Refund",
    Other: "Other",
  };

  const saveExpense = async () => {
    if (!form.amount || !form.type) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        expenseType: typeToExpenseType[form.type],
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
      };
      const result = await createExpense(payload);
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

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel
          title="Expenses Tracker"
          right={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                />
                Sync Invoices
              </Button>
              <p className="text-xs text-slate-500">
                {filteredExpenses.length} records
              </p>
            </div>
          }
        >
          {error && (
            <div className="mb-4 text-xs text-rose-500 font-medium">
              {error}
            </div>
          )}
          <DataTable
            headers={["ID", "Type", "Description", "Amount", "Date"]}
            rows={filteredExpenses.map((exp) => (
              <tr
                key={exp.id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                  {exp.id || "N/A"}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                      exp.type === "Refund"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {exp.type}
                  </span>
                </td>
                <td className="px-2 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {exp.description}
                </td>
                <td
                  className={`px-2 py-3 font-bold ${
                    exp.type === "Refund" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {exp.type === "Refund"
                    ? `+TND ${exp.amount}`
                    : `-TND ${exp.amount}`}
                </td>
                <td className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {exp.date}
                </td>
              </tr>
            ))}
          />
        </Panel>
      </div>
      <Panel title="Add New Expense">
        <div className="space-y-3">
          <Select
            value={form.type}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, type: e.target.value }))
            }
          >
            <option value="Hotel">Hotel</option>
            <option value="Transport">Transport</option>
            <option value="Flights">Flights</option>
            <option value="Marketing">Marketing</option>
            <option value="Staff">Staff</option>
            <option value="Refund">Refund</option>
            <option value="Other">Other</option>
          </Select>
          <Input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="Amount"
          />
          <Input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, date: e.target.value }))
            }
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Expense description"
          />
          <Button onClick={saveExpense} className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Save Expense"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
