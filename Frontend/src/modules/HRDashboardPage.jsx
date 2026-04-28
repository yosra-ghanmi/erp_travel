import { useMemo } from "react";
import { Users, Banknote, FileText, ClipboardList } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Panel } from "../components/ui";

export function HRDashboardPage({ users, salaryGrades = [], contracts = [], searchQuery }) {
  const totalEmployees = useMemo(() => {
    return users.filter(u => u.role !== 'superadmin').length;
  }, [users]);

  const activeContracts = useMemo(() => {
    return contracts.filter(c => c.status === 'active').length;
  }, [contracts]);

  const totalPayroll = useMemo(() => {
    return salaryGrades.reduce((acc, grade) => acc + (grade.baseSalary || 0), 0);
  }, [salaryGrades]);

  // Mock data for chart
  const departmentDistribution = [
    { name: "Sales", count: users.filter(u => u.role === 'agent').length },
    { name: "Admin", count: users.filter(u => u.role === 'admin').length },
    { name: "Finance", count: users.filter(u => u.role === 'finance').length },
    { name: "HR", count: users.filter(u => u.role === 'hr').length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Employees"
          value={totalEmployees}
          hint="Global workforce"
          icon={Users}
        />
        <Card
          title="Monthly Payroll"
          value={`$${totalPayroll.toLocaleString()}`}
          hint="Estimated base salaries"
          icon={Banknote}
        />
        <Card
          title="Active Contracts"
          value={activeContracts || contracts.length}
          hint="Current labor agreements"
          icon={FileText}
        />
        <Card
          title="Open Positions"
          value={3}
          hint="Recruitment active"
          icon={ClipboardList}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Department Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentDistribution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#94a3b8"
                  strokeOpacity={0.15}
                />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recent HR Activity">
          <div className="space-y-4">
            {[
              { id: 1, action: "New Contract Signed", subject: "John Doe", date: "2 hours ago" },
              { id: 2, action: "Salary Grade Updated", subject: "Senior Agent", date: "5 hours ago" },
              { id: 3, action: "Employee Onboarded", subject: "Sarah Smith", date: "Yesterday" },
              { id: 4, action: "Performance Review", subject: "Finance Dept", date: "2 days ago" },
            ].map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activity.subject}</p>
                </div>
                <span className="text-xs text-slate-400">{activity.date}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
