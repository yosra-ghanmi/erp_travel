import { useState } from "react";
import { Plus, Trash2, Edit2, DollarSign } from "lucide-react";
import { Button, DataTable, Input, Panel, Modal } from "../components/ui";
import {
  createSalaryGrade,
  updateSalaryGrade,
  deleteSalaryGrade,
} from "../services/erpApi";

export function SalaryGradesPage({
  salaryGrades = [],
  setSalaryGrades,
  searchQuery,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    baseSalary: "",
    bonus: "",
    taxRate: "",
  });

  const filteredGrades = salaryGrades.filter(
    (g) =>
      !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (grade = null) => {
    if (grade) {
      setEditingGrade(grade);
      setForm({
        name: grade.name,
        baseSalary: grade.baseSalary,
        bonus: grade.bonus,
        taxRate: grade.taxRate,
      });
    } else {
      setEditingGrade(null);
      setForm({ name: "", baseSalary: "", bonus: "", taxRate: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.baseSalary) return;
    setIsLoading(true);

    try {
      const payload = {
        ...form,
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus),
        taxRate: Number(form.taxRate),
      };

      if (editingGrade) {
        await updateSalaryGrade(editingGrade.id, payload);
        setSalaryGrades((prev) =>
          prev.map((g) => (g.id === editingGrade.id ? { ...g, ...payload } : g))
        );
      } else {
        const result = await createSalaryGrade(payload);
        setSalaryGrades((prev) => [...prev, result]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save salary grade:", error);
      alert("Failed to save salary grade. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this salary grade?")) {
      try {
        await deleteSalaryGrade(id);
        setSalaryGrades((prev) => prev.filter((g) => g.id !== id));
      } catch (error) {
        console.error("Failed to delete salary grade:", error);
        alert("Failed to delete salary grade.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Salary Grades
        </h2>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Grade
        </Button>
      </div>

      <Panel title="Salary Grade Definitions">
        <DataTable
          headers={[
            "Grade Name",
            "Base Salary",
            "Bonus",
            "Tax Rate",
            "Total",
            "Actions",
          ]}
          rows={filteredGrades.map((grade) => (
            <tr
              key={grade.id}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              <td className="px-2 py-3 font-medium">{grade.name}</td>
              <td className="px-2 py-3">
                ${grade.baseSalary.toLocaleString()}
              </td>
              <td className="px-2 py-3">${grade.bonus.toLocaleString()}</td>
              <td className="px-2 py-3">{grade.taxRate}%</td>
              <td className="px-2 py-3 font-bold text-cyan-600 dark:text-cyan-400">
                ${(grade.baseSalary + grade.bonus).toLocaleString()}
              </td>
              <td className="px-2 py-3">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(grade)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(grade.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Panel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGrade ? "Edit Salary Grade" : "Add New Salary Grade"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Grade Name
            </label>
            <Input
              placeholder="e.g. Senior Agent"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Base Salary
              </label>
              <Input
                type="number"
                placeholder="4500"
                value={form.baseSalary}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, baseSalary: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Bonus
              </label>
              <Input
                type="number"
                placeholder="500"
                value={form.bonus}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bonus: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tax Rate %
            </label>
            <Input
              type="number"
              placeholder="20"
              value={form.taxRate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, taxRate: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingGrade ? "Update Grade" : "Create Grade"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
