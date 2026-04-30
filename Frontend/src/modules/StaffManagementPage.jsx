import { Plus, Trash2, Edit2, Mail, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  Input,
  Panel,
  Select,
  StatusBadge,
  Modal,
} from "../components/ui";
import { createStaff, updateStaff, deleteStaff } from "../services/erpApi";

const blankStaff = { name: "", email: "", role: "agent" };

export function StaffManagementPage({
  users,
  setUsers,
  staff = [],
  setStaff,
  agencyId,
  searchQuery,
  role,
}) {
  const [form, setForm] = useState(blankStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [isLoading, setIsLoading] = useState(false);

  const staffMembers = useMemo(() => {
    // If HR, show all users except superadmins. If not HR, filter by agencyId.
    const list = users.filter((user) => {
      if (role === "hr") return user.role !== "superadmin";
      return user.agency_id === agencyId && user.role !== "superadmin";
    });
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
    );
  }, [users, agencyId, searchQuery, role]);

  const bcEmployees = useMemo(() => {
    if (!searchQuery) return staff;
    const q = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.jobTitle && s.jobTitle.toLowerCase().includes(q))
    );
  }, [staff, searchQuery]);

  const handleOpenModal = (staffItem = null) => {
    if (staffItem) {
      setEditingStaff(staffItem);
      setForm({
        name: staffItem.name,
        email: staffItem.email,
        role: staffItem.role || staffItem.jobTitle || "agent",
      });
    } else {
      setEditingStaff(null);
      setForm(blankStaff);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setIsLoading(true);

    try {
      if (activeTab === "users") {
        if (editingStaff) {
          setUsers((prev) =>
            prev.map((u) => (u.id === editingStaff.id ? { ...u, ...form } : u))
          );
        } else {
          setUsers((prev) => [
            ...prev,
            {
              id: `USR-${1000 + prev.length + 1}`,
              ...form,
              password: "123456",
              agency_id: agencyId,
            },
          ]);
        }
      } else {
        // BC Employees
        const payload = {
          firstName: form.name.split(" ")[0],
          lastName: form.name.split(" ").slice(1).join(" "),
          email: form.email,
          jobTitle: form.role,
          status: "active",
        };

        if (editingStaff) {
          await updateStaff(editingStaff.id, payload);
          setStaff((prev) =>
            prev.map((s) =>
              s.id === editingStaff.id
                ? { ...s, ...payload, name: form.name }
                : s
            )
          );
        } else {
          const result = await createStaff(payload);
          setStaff((prev) => [...prev, result]);
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save staff:", error);
      alert("Failed to save staff.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        if (activeTab === "users") {
          setUsers((prev) => prev.filter((u) => u.id !== id));
        } else {
          await deleteStaff(id);
          setStaff((prev) => prev.filter((s) => s.id !== id));
        }
      } catch (error) {
        console.error("Failed to delete member:", error);
        alert("Failed to delete member.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Staff Management
        </h2>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-4">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              System Users
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "employees"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              BC Employees
            </button>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === "users" ? "User" : "Employee"}
          </Button>
        </div>
      </div>

      {activeTab === "users" ? (
        <Panel title="System Access Accounts">
          <DataTable
            headers={["Name", "Email", "Role", "Agency", "Actions"]}
            rows={staffMembers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </div>
                </td>
                <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                  {user.email}
                </td>
                <td className="px-2 py-3">
                  <StatusBadge
                    value={user.role === "admin" ? "vip" : "active"}
                  />
                  <span className="ml-2 text-xs text-slate-400 capitalize">
                    {user.role}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs font-mono text-slate-400">
                  {user.agency_id}
                </td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenModal(user)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          />
        </Panel>
      ) : (
        <Panel title="Business Central Employees">
          <DataTable
            headers={["ID", "Name", "Job Title", "Status", "Agency", "Actions"]}
            rows={bcEmployees.map((emp) => (
              <tr
                key={emp.id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3 text-xs font-mono text-slate-400">
                  {emp.id}
                </td>
                <td className="px-2 py-3">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {emp.name}
                  </div>
                  <div className="text-xs text-slate-500">{emp.email}</div>
                </td>
                <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                  {emp.jobTitle}
                </td>
                <td className="px-2 py-3">
                  <StatusBadge
                    value={emp.status === "active" ? "active" : "inactive"}
                  />
                </td>
                <td className="px-2 py-3 text-xs font-mono text-slate-400">
                  {emp.agency_id}
                </td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="danger" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          />
        </Panel>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <Input
              placeholder="e.g. Amina Atlas"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <Input
              placeholder="e.g. amina@agency.com"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Assigned Role
            </label>
            <Select
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role: e.target.value }))
              }
            >
              <option value="agent">Agent</option>
              <option value="admin">Agency Admin</option>
              <option value="finance">Finance</option>
              <option value="hr">HR Manager</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingStaff ? "Update Staff" : "Invite Member"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
