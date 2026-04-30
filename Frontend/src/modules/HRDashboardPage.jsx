import { useMemo, useState } from "react";
import {
  Users,
  Banknote,
  FileText,
  ClipboardList,
  TrendingUp,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Panel, Button, Modal, Input } from "../components/ui";

export function HRDashboardPage({
  users,
  staff = [],
  salaryGrades = [],
  contracts = [],
  searchQuery,
}) {
  const [isHiringModalOpen, setIsHiringModalOpen] = useState(false);
  const [hiringForm, setHiringForm] = useState({
    title: "",
    department: "",
    priority: "Medium",
  });

  const totalEmployees = useMemo(() => {
    return staff.length || users.filter((u) => u.role !== "superadmin").length;
  }, [staff, users]);

  const activeContracts = useMemo(() => {
    return contracts.filter((c) => c.status === "active").length;
  }, [contracts]);

  const totalPayroll = useMemo(() => {
    return salaryGrades.reduce(
      (acc, grade) => acc + (grade.baseSalary || 0),
      0
    );
  }, [salaryGrades]);

  // Use staff if available, else fallback to users
  const departmentDistribution = useMemo(() => {
    if (staff.length > 0) {
      const depts = {};
      staff.forEach((s) => {
        const dept = s.jobTitle || "Other";
        depts[dept] = (depts[dept] || 0) + 1;
      });
      return Object.entries(depts).map(([name, count]) => ({ name, count }));
    }

    return [
      { name: "Sales", count: users.filter((u) => u.role === "agent").length },
      { name: "Admin", count: users.filter((u) => u.role === "admin").length },
      {
        name: "Finance",
        count: users.filter((u) => u.role === "finance").length,
      },
      { name: "HR", count: users.filter((u) => u.role === "hr").length },
    ];
  }, [staff, users]);

  const handleHiringSubmit = () => {
    if (!hiringForm.title) return;
    alert(
      `Recruitment started for ${hiringForm.title} in ${hiringForm.department}`
    );
    setIsHiringModalOpen(false);
    setHiringForm({ title: "", department: "", priority: "Medium" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          HR Overview
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Payroll Calendar
          </Button>
          <Button
            onClick={() => setIsHiringModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Start Hiring
          </Button>
        </div>
      </div>

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
              {
                id: 1,
                action: "New Contract Signed",
                subject: "John Doe",
                date: "2 hours ago",
              },
              {
                id: 2,
                action: "Salary Grade Updated",
                subject: "Senior Agent",
                date: "5 hours ago",
              },
              {
                id: 3,
                action: "Employee Onboarded",
                subject: "Sarah Smith",
                date: "Yesterday",
              },
              {
                id: 4,
                action: "Performance Review",
                subject: "Finance Dept",
                date: "2 days ago",
              },
            ].map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activity.subject}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{activity.date}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Modal
        isOpen={isHiringModalOpen}
        onClose={() => setIsHiringModalOpen(false)}
        title="Start New Recruitment"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Position Title
            </label>
            <Input
              placeholder="e.g. Senior Travel Agent"
              value={hiringForm.title}
              onChange={(e) =>
                setHiringForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Department
            </label>
            <Input
              placeholder="e.g. Sales"
              value={hiringForm.department}
              onChange={(e) =>
                setHiringForm((prev) => ({
                  ...prev,
                  department: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsHiringModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleHiringSubmit}>Launch Posting</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
