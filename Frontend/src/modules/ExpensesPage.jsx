import { useState, useEffect } from "react";
import { Button, DataTable, Input, Panel, Select } from "../components/ui";
import { fetchExpenses, createExpense } from "../services/erpApi";

const initialForm = {
  type: "Hotel",
  amount: 0,
  // Environment Note: Business Central license restricts dates to specific months (Nov, Dec, Jan, Feb)
  date: "2026-01-15",
  description: "",
};

export function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel
          title="Expenses Tracker"
          right={
            <p className="text-xs text-slate-500">{expenses.length} records</p>
          }
        >
          {error && (
            <div className="mb-4 text-xs text-rose-500 font-medium">
              {error}
            </div>
          )}
          <DataTable
            headers={["ID", "Type", "Description", "Amount", "Date"]}
            rows={expenses.map((exp) => (
              <tr
                key={exp.expenseid}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3 text-xs font-mono">{exp.expenseid}</td>
                <td className="px-2 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase dark:bg-slate-800">
                    {exp.type}
                  </span>
                </td>
                <td className="px-2 py-3 text-sm">{exp.description}</td>
                <td className="px-2 py-3 font-bold text-rose-600">
                  -${exp.amount}
                </td>
                <td className="px-2 py-3 text-xs">{exp.date}</td>
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
