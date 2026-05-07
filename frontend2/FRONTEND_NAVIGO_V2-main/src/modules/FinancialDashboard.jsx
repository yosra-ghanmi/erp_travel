import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  Wallet,
  ArrowRight,
} from "lucide-react";
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
  Area,
  AreaChart,
} from "recharts";
import { Card, Panel, Button, StatusBadge, DataTable } from "../components/ui";
import { fetchPayments, fetchExpenses } from "../services/erpApi";

export function FinancialDashboard() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [pData, eData] = await Promise.all([
          fetchPayments(),
          fetchExpenses(),
        ]);
        setPayments(pData || []);
        setExpenses(eData || []);
      } catch (err) {
        console.error("Failed to load financial data:", err);
      } finally {
        setLoading(false);
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

    const monthlyData = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        ...item,
        displayMonth: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2y' })
      }));

    // Expense type distribution
    const typeMap = {};
    expenses.forEach((e) => {
      const type = e.expensetype || e.type || "Other";
      typeMap[type] = (typeMap[type] || 0) + e.amount;
    });
    const expenseDistribution = Object.entries(typeMap).map(
      ([name, value]) => ({ name, value })
    );

    // Recent combined transactions
    const combined = [
      ...payments.map(p => ({ ...p, type: 'payment' })),
      ...expenses.map(e => ({ ...e, type: 'expense' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    return {
      totalRevenue,
      totalExpenses,
      profit,
      monthlyData,
      expenseDistribution,
      recentTransactions: combined
    };
  }, [payments, expenses]);

  const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6"];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 p-1"
    >
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track your agency's financial performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="primary" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          hint="Total income received"
        />
        <Card
          title="Total Expenses"
          value={`$${stats.totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
          hint="Operational expenditures"
        />
        <Card
          title="Net Profit"
          value={`$${stats.profit.toLocaleString()}`}
          icon={TrendingUp}
          hint="Overall profit margin"
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

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Revenue vs Expenses Chart */}
        <div className="xl:col-span-2">
          <Panel 
            title="Financial Performance" 
            right={
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Revenue
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  Expenses
                </div>
              </div>
            }
          >
            <div className="h-[400px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="displayMonth" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium dark:border-slate-800 dark:bg-slate-900">
                            <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{payload[0].payload.month}</p>
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                                <span className="font-bold text-slate-900 dark:text-white">${entry.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorExp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Expense Distribution */}
        <Panel title="Expense Distribution">
          <div className="relative h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.expenseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.expenseDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-premium dark:border-slate-800 dark:bg-slate-900">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {payload[0].name}: ${payload[0].value.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">${stats.totalExpenses.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Total Spent</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {stats.expenseDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ${item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Recent Transactions Section */}
      <Panel 
        title="Recent Transactions" 
        right={
          <Button variant="ghost" className="text-brand-600 dark:text-brand-400">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      >
        <DataTable
          headers={["Transaction", "Date", "Category", "Amount", "Status"]}
          rows={stats.recentTransactions.map((tx, idx) => (
            <motion.tr 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    tx.type === 'payment' 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' 
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                  }`}>
                    {tx.type === 'payment' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{tx.description || tx.type === 'payment' ? 'Client Payment' : 'Service Expense'}</p>
                    <p className="text-xs text-slate-500 uppercase">{tx.type}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                {new Date(tx.date).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">{tx.category || tx.expensetype || 'General'}</span>
              </td>
              <td className="px-4 py-4">
                <span className={`font-bold ${tx.type === 'payment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'payment' ? '+' : '-'}${tx.amount?.toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-4">
                <StatusBadge value={tx.status || (tx.type === 'payment' ? 'paid' : 'confirmed')} />
              </td>
            </motion.tr>
          ))}
        />
      </Panel>
    </motion.div>
  );
}
