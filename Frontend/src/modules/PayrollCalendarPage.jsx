import { useMemo } from "react";
import { CalendarDays, Clock3, Users, Wallet } from "lucide-react";
import { Card, Panel, DataTable, StatusBadge } from "../components/ui";
import { buildPayrollCalendar } from "../data/payroll";

export function PayrollCalendarPage({ users = [], searchQuery }) {
  const schedule = useMemo(() => buildPayrollCalendar(users, 6), [users]);

  const filteredSchedule = useMemo(() => {
    if (!searchQuery) return schedule;
    const q = searchQuery.toLowerCase();
    return schedule.filter(
      (item) =>
        item.monthLabel.toLowerCase().includes(q) ||
        item.payrollDate.includes(q) ||
        item.breakdown.some(
          (entry) =>
            entry.role.toLowerCase().includes(q) ||
            entry.description.toLowerCase().includes(q)
        )
    );
  }, [schedule, searchQuery]);

  const nextPayroll = filteredSchedule[0];
  const annualProjection = useMemo(
    () => schedule.reduce((sum, item) => sum + item.totalPayroll, 0),
    [schedule]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Payroll Calendar
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Plans monthly payroll runs using the fixed DT amounts for admin,
          agent, finance, and HR roles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Next Payroll Date"
          value={nextPayroll?.payrollDate ?? "N/A"}
          hint={nextPayroll?.monthLabel ?? "No schedule available"}
          icon={CalendarDays}
        />
        <Card
          title="Next Payroll Total"
          value={`${nextPayroll?.totalPayroll?.toLocaleString?.() ?? 0} DT`}
          hint="Fixed monthly payroll"
          icon={Wallet}
        />
        <Card
          title="Employees Covered"
          value={nextPayroll?.employeeCount ?? users.length}
          hint="Users included in payroll"
          icon={Users}
        />
        <Card
          title="6-Month Projection"
          value={`${annualProjection.toLocaleString()} DT`}
          hint="Current schedule horizon"
          icon={Clock3}
        />
      </div>

      <Panel title="Upcoming Payroll Runs">
        <DataTable
          headers={["Month", "Payroll Date", "Employees", "Total", "Status"]}
          rows={filteredSchedule.map((item, index) => (
            <tr
              key={item.id}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              <td className="px-2 py-3 font-medium">{item.monthLabel}</td>
              <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                {item.payrollDate}
              </td>
              <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                {item.employeeCount}
              </td>
              <td className="px-2 py-3 font-semibold text-cyan-600 dark:text-cyan-400">
                {item.totalPayroll.toLocaleString()} DT
              </td>
              <td className="px-2 py-3">
                <StatusBadge value={index === 0 ? "pending" : "active"} />
              </td>
            </tr>
          ))}
        />
      </Panel>

      <Panel title="Role Breakdown">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(nextPayroll?.breakdown ?? []).map((entry) => (
            <div
              key={entry.code}
              className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"
            >
              <p className="text-sm font-medium capitalize text-slate-900 dark:text-white">
                {entry.role}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {entry.totalAmount.toLocaleString()} DT
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {entry.employeeCount} employees x {entry.amount.toLocaleString()} DT
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
