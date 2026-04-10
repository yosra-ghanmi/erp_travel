import { BarChart3, CalendarClock, Users2, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Panel } from "../components/ui";

export function DashboardPage({
  bookings,
  clients,
  payments,
  revenueSeries,
  activityFeed,
}) {
  // Use payments for total revenue calculation if available, otherwise fallback to bookings amount
  const revenue =
    payments?.length > 0
      ? payments.reduce(
          (sum, payment) =>
            sum + (payment.status === "paid" ? payment.amount : 0),
          0
        )
      : bookings.reduce(
          (sum, booking) =>
            sum + (booking.status === "canceled" ? 0 : booking.amount || 0),
          0
        );

  const confirmedBookings = bookings.filter((booking) => {
    const status = (booking.status || "").toLowerCase();
    return status === "confirmed" || status === "paid" || status === "accepted";
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Bookings"
          value={bookings.length}
          hint="All time bookings"
          icon={BarChart3}
        />
        <Card
          title="Revenue"
          value={`$${revenue.toLocaleString()}`}
          hint="From active payments"
          icon={Wallet}
        />
        <Card
          title="Active Clients"
          value={clients.filter((client) => client.status !== "lead").length}
          hint="CRM active clients"
          icon={Users2}
        />
        <Card
          title="Confirmed Bookings"
          value={confirmedBookings}
          hint="Bookings ready to go"
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue Over Time">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  strokeOpacity={0.15}
                />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Bookings Analytics">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  strokeOpacity={0.15}
                />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Recent Activity Feed">
          <div className="space-y-3">
            {activityFeed.map((activity) => (
              <div
                key={activity.id}
                className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800"
              >
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {activity.message}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activity.at}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
