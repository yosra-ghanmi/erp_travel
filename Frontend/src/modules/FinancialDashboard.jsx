import { useState, useEffect, useMemo } from "react";
import { Landmark, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import { Card, Panel } from "../components/ui";
import { fetchPayments, fetchExpenses } from "../services/erpApi";

export function FinancialDashboard() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pData, eData] = await Promise.all([
          fetchPayments(),
          fetchExpenses(),
        ]);
        setPayments(pData || []);
        setExpenses(eData || []);
      } catch (err) {
        console.error("Failed to load financial data:", err);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;

    // Monthly data for charts
    const monthMap = {};
    payments.forEach((p) => {
      const month = p.date?.substring(0, 7) || "Unknown";
      if (!monthMap[month])
        monthMap[month] = { month, revenue: 0, expenses: 0 };
      monthMap[month].revenue += p.amount;
    });
    expenses.forEach((e) => {
      const month = e.date?.substring(0, 7) || "Unknown";
      if (!monthMap[month])
        monthMap[month] = { month, revenue: 0, expenses: 0 };
      monthMap[month].expenses += e.amount;
    });

    const monthlyData = Object.values(monthMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // Expense type distribution
    const typeMap = {};
    expenses.forEach((e) => {
      const type = e.expensetype || e.type || "Other";
      typeMap[type] = (typeMap[type] || 0) + e.amount;
    });
    const expenseDistribution = Object.entries(typeMap).map(
      ([name, value]) => ({ name, value })
    );

    return {
      totalRevenue,
      totalExpenses,
      profit,
      monthlyData,
      expenseDistribution,
    };
  }, [payments, expenses]);

  const COLORS = ["#0ea5e9", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          hint="Total payments received"
        />
        <Card
          title="Total Expenses"
          value={`$${stats.totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          hint="Operating costs"
        />
        <Card
          title="Net Profit"
          value={`$${stats.profit.toLocaleString()}`}
          icon={TrendingUp}
          hint="Revenue minus expenses"
        />
        <Card
          title="Profit Margin"
          value={`${
            stats.totalRevenue > 0
              ? Math.round((stats.profit / stats.totalRevenue) * 100)
              : 0
          }%`}
          icon={Landmark}
          hint="Efficiency ratio"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue vs Expenses (Monthly)">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  strokeOpacity={0.1}
                />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
                <Bar
                  dataKey="expenses"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  name="Expenses"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Expense Distribution by Type">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.expenseDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {stats.expenseDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.COLORS?.length || index % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {stats.expenseDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % 5] }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {item.name} (${item.value.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
