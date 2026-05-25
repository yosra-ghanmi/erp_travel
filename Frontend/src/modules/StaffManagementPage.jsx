import { Plus, Trash2, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  IconButton,
  Input,
  Panel,
  Select,
  StatusBadge,
  Modal,
} from "../components/ui";

const blankStaff = { name: "", email: "", role: "agent" };

export function StaffManagementPage({
  users,
  setUsers,
  agencyId,
  searchQuery,
  role,
}) {
  const [form, setForm] = useState(blankStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const staffMembers = useMemo(() => {
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
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } catch (error) {
        console.error("Failed to delete member:", error);
        alert("Failed to delete member.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Panel title="System Users">
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
                <StatusBadge value={user.role === "admin" ? "vip" : "active"} />
                <span className="ml-2 text-xs text-slate-400 capitalize">
                  {user.role}
                </span>
              </td>
              <td className="px-2 py-3 text-xs font-mono text-slate-400">
                {user.agency_id}
              </td>
              <td className="px-2 py-3">
                <div className="flex gap-2">
                  <IconButton
                    icon={Pencil}
                    onClick={() => handleOpenModal(user)}
                    title="Edit User"
                  />
                  <IconButton
                    icon={Trash2}
                    variant="danger"
                    onClick={() => handleDelete(user.id)}
                    title="Remove User"
                  />
                </div>
              </td>
            </tr>
          ))}
        />
      </Panel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? "Edit User" : "Add New User"}
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
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : editingStaff
                ? "Update User"
                : "Invite Member"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
