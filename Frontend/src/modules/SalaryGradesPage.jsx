import { useMemo, useState } from "react";
import { Edit2, PlusCircle } from "lucide-react";
import { Button, DataTable, Input, Modal, Panel } from "../components/ui";
import { PAYROLL_ROLE_DEFINITIONS } from "../data/payroll";

export function SalaryGradesPage({ searchQuery }) {
  const [grades, setGrades] = useState(PAYROLL_ROLE_DEFINITIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [form, setForm] = useState({
    code: "",
    role: "",
    description: "",
    amount: "",
    currency: "DT",
  });

  const filteredGrades = useMemo(
    () =>
      grades.filter((grade) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          grade.code.toLowerCase().includes(q) ||
          grade.role.toLowerCase().includes(q) ||
          grade.description.toLowerCase().includes(q)
        );
      }),
    [grades, searchQuery]
  );

  const handleOpenModal = (grade = null) => {
    if (grade) {
      setEditingGrade(grade);
      setForm({
        code: grade.code,
        role: grade.role,
        description: grade.description,
        amount: String(grade.amount),
        currency: grade.currency,
      });
    } else {
      setEditingGrade(null);
      setForm({
        code: "",
        role: "",
        description: "",
        amount: "",
        currency: "DT",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.role || !form.description || !form.amount) return;

    const nextGrade = {
      code: form.code.trim().toUpperCase(),
      role: form.role.trim().toLowerCase(),
      description: form.description.trim(),
      amount: Number(form.amount),
      currency: form.currency.trim().toUpperCase() || "DT",
    };

    if (editingGrade) {
      setGrades((prev) =>
        prev.map((grade) =>
          grade.code === editingGrade.code ? nextGrade : grade
        )
      );
    } else {
      setGrades((prev) => [...prev, nextGrade]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Payroll
        </Button>
      </div>

      <Panel title="Monthly Payroll">
        <DataTable
          headers={[
            "Code",
            "Role",
            "Description",
            "Monthly Payroll",
            "Actions",
          ]}
          rows={filteredGrades.map((grade) => (
            <tr
              key={grade.code}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              <td className="px-2 py-3 font-medium">{grade.code}</td>
              <td className="px-2 py-3 capitalize">{grade.role}</td>
              <td className="px-2 py-3">{grade.description}</td>
              <td className="px-2 py-3">
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {grade.amount.toLocaleString()} {grade.currency}
                </span>
              </td>
              <td className="px-2 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleOpenModal(grade)}
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        />
      </Panel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGrade ? "Edit Payroll Grade" : "Add Payroll Grade"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Code
              </label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. SALES"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Role
              </label>
              <Input
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder="e.g. agent"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Monthly payroll description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount
              </label>
              <Input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Currency
              </label>
              <Input
                value={form.currency}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currency: e.target.value }))
                }
                placeholder="DT"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingGrade ? "Update Payroll" : "Add Payroll"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
