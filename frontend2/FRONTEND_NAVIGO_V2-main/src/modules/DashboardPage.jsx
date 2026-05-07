import { useMemo } from "react";
import { BarChart3, CalendarClock, Users2, Wallet, TrendingUp, ArrowUpRight, Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Card, Panel } from "../components/ui";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-premium backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <p className="mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-brand-600 dark:text-brand-400">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardPage({
  bookings,
  clients,
  payments,
  revenueSeries,
  activityFeed,
  searchQuery,
}) {
  const filteredActivity = useMemo(() => {
    if (!searchQuery) return activityFeed;
    const q = searchQuery.toLowerCase();
    return activityFeed.filter((activity) => {
      const msg = (activity.message || "").toLowerCase();
      const at = (activity.at || "").toLowerCase();
      return msg.includes(q) || at.includes(q);
    });
  }, [activityFeed, searchQuery]);

  const revenue = useMemo(() => {
    return payments?.length > 0
      ? payments.reduce((sum, p) => sum + (p.status === "paid" ? p.amount : 0), 0)
      : bookings.reduce((sum, b) => sum + (b.status === "canceled" ? 0 : b.amount || 0), 0);
  }, [payments, bookings]);

  const confirmedBookings = useMemo(() => {
    return bookings.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "confirmed" || s === "paid" || s === "accepted";
    }).length;
  }, [bookings]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Bookings"
          value={bookings.length}
          hint="+12.5% from last month"
          icon={BarChart3}
        />
        <Card
          title="Total Revenue"
          value={`$${revenue.toLocaleString()}`}
          hint="+8.2% from last month"
          icon={Wallet}
        />
        <Card
          title="Active Clients"
          value={clients.filter((c) => c.status !== "lead").length}
          hint="+4 new this week"
          icon={Users2}
        />
        <Card
          title="Success Rate"
          value={`${Math.round((confirmedBookings / (bookings.length || 1)) * 100)}%`}
          hint="Based on confirmations"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel 
            title="Revenue Performance" 
            right={
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">
                <ArrowUpRight className="h-3 w-3" />
                Growth: 14%
              </div>
            }
          >
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#94a3b8"
                    strokeOpacity={0.1}
                  />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Recent Activity">
          <div className="space-y-4">
            {filteredActivity.length > 0 ? (
              filteredActivity.map((activity, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={activity.id}
                  className="group relative flex gap-4 rounded-2xl border border-transparent bg-slate-50 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-soft dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
                    <Sparkles className="h-5 w-5 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {activity.message}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {activity.at}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <p className="text-sm font-medium text-slate-400">
                  No recent activities found
                </p>
              </div>
            )}
            <button className="w-full rounded-xl border-2 border-slate-100 py-3 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
              View All Activity
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
