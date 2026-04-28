import { useMemo, useState } from "react";
import {
  Button,
  DataTable,
  Input,
  Panel,
  Select,
  StatusBadge,
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
  }, [users, agencyId, searchQuery]);

  const inviteStaff = () => {
    if (!form.name || !form.email) return;
    setUsers((prev) => [
      ...prev,
      {
        id: `USR-${1000 + prev.length + 1}`,
        name: form.name,
        email: form.email,
        password: "123456",
        role: form.role,
        agency_id: agencyId,
      },
    ]);
    setForm(blankStaff);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel title="Staff Management">
          <DataTable
            headers={["Name", "Email", "Role", "Agency"]}
            rows={staffMembers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3">{user.name}</td>
                <td className="px-2 py-3">{user.email}</td>
                <td className="px-2 py-3">
                  <StatusBadge
                    value={user.role === "admin" ? "vip" : "active"}
                  />
                </td>
                <td className="px-2 py-3 text-xs">{user.agency_id}</td>
              </tr>
            ))}
          />
        </Panel>
      </div>
      <Panel title="Invite Staff">
        <div className="space-y-3">
          <Input
            placeholder="Full name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <Select
            value={form.role}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, role: e.target.value }))
            }
          >
            <option value="agent">Agent</option>
            <option value="admin">Agency Admin</option>
            <option value="finance">Finance</option>
          </Select>
          <Button onClick={inviteStaff} className="w-full">
            Create Account
          </Button>
        </div>
      </Panel>
    </div>
  );
}
