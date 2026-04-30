import { useMemo, useState } from "react";
import {
  BadgePlus,
  Eye,
  EyeOff,
  LogIn,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import {
  Button,
  DataTable,
  Input,
  Modal,
  Panel,
  Select,
  StatusBadge,
} from "../components/ui";

const blankAgency = {
  name: "",
  logo: "/logo-agency.png",
  owner_id: "",
  admin_email: "",
  subscription_status: "active",
};

export function ManageAgenciesPage({
  agencies,
  users,
  bookings,
  onToggleSubscription,
  onAddAgency,
  onEditAgency,
  onDeleteAgency,
  onImpersonate,
  searchQuery,
}) {
  const [form, setForm] = useState(blankAgency);
  const [editingId, setEditingId] = useState("");
  const [showCreds, setShowCreds] = useState(false);
  const [credData, setCredData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const filteredAgencies = useMemo(() => {
    if (!searchQuery) return agencies;
    const q = searchQuery.toLowerCase();
    return agencies.filter((agency) => {
      const name = String(agency.name || "").toLowerCase();
      const status = String(agency.subscription_status || "").toLowerCase();
      const owner = users.find((user) => user.id === agency.owner_id);
      const ownerName = String(owner?.name || "").toLowerCase();
      return name.includes(q) || status.includes(q) || ownerName.includes(q);
    });
  }, [agencies, searchQuery, users]);

  const submitAgency = () => {
    if (editingId && editingId !== "new") {
      if (!form.name || !form.owner_id) return;
      onEditAgency(editingId, form);
    } else {
      if (!form.name || !form.admin_email) return;
      onAddAgency(form, (newAgencyData) => {
        if (newAgencyData) {
          setCredData(newAgencyData);
          setShowCreds(true);
        }
      });
    }
    setEditingId("");
    setForm(blankAgency);
  };

  const startEdit = (agency) => {
    setEditingId(agency.id);
    setForm({
      name: agency.name,
      logo: agency.logo,
      owner_id: agency.owner_id,
      admin_email: "",
      subscription_status: agency.subscription_status,
    });
  };

  const adminUsers = users.filter((user) => user.role === "admin");

  return (
    <div className="space-y-5">
      <Panel
        title="Manage Agencies"
        right={
          <Button
            onClick={() => {
              setEditingId("new");
              setForm(blankAgency);
            }}
            className="bg-cyan-700 hover:bg-cyan-800"
          >
            <BadgePlus className="mr-1 h-4 w-4" />+ Add New Agency
          </Button>
        }
      >
        <DataTable
          headers={[
            "Agency Name",
            "Owner",
            "Subscription Status",
            "Total Bookings",
            "Actions",
          ]}
          rows={filteredAgencies.map((agency) => {
            const owner = users.find((user) => user.id === agency.owner_id);
            const totalBookings = bookings.filter(
              (booking) => booking.agency_id === agency.id
            ).length;
            const subscriptionStatus = agency.subscription_status;
            return (
              <tr
                key={agency.id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3 font-medium">{agency.name}</td>
                <td className="px-2 py-3">{owner?.name ?? "-"}</td>
                <td className="px-2 py-3">
                  <StatusBadge value={subscriptionStatus} />
                </td>
                <td className="px-2 py-3 text-center">{totalBookings}</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => startEdit(agency)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={
                        subscriptionStatus === "active" ? "danger" : "success"
                      }
                      onClick={() => onToggleSubscription(agency.id)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => onImpersonate(agency.id)}
                    >
                      <LogIn className="h-4 w-4" />
                    </Button>
                    {onDeleteAgency && (
                      <Button
                        variant="danger"
                        onClick={() => onDeleteAgency(agency.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        />
      </Panel>

      {editingId ? (
        <Panel title={editingId === "new" ? "Add Agency" : "Edit Agency"}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Agency Name
              </p>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Enter agency name"
              />
            </div>
            {editingId === "new" ? (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Admin Session Email
                </p>
                <Input
                  type="email"
                  value={form.admin_email}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      admin_email: event.target.value,
                    }))
                  }
                  placeholder="admin@agency.com"
                />
              </div>
            ) : (
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Owner
                </p>
                <Select
                  value={form.owner_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      owner_id: event.target.value,
                    }))
                  }
                >
                  <option value="">Select owner</option>
                  {adminUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Logo URL
              </p>
              <Input
                value={form.logo}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, logo: event.target.value }))
                }
                placeholder="/logo-youragency.png"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Subscription Status
              </p>
              <Select
                value={form.subscription_status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    subscription_status: event.target.value,
                  }))
                }
              >
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={submitAgency}>
              {editingId === "new" ? "Create Agency" : "Save Agency"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditingId("");
                setForm(blankAgency);
              }}
            >
              Cancel
            </Button>
          </div>
        </Panel>
      ) : null}

      <Modal
        isOpen={showCreds}
        onClose={() => setShowCreds(false)}
        title="Agency Admin Credentials"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Save these credentials securely. This is the only time the password
            will be shown.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Agency
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {credData?.agency_name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Admin ID
              </p>
              <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                {credData?.user_id}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Email
              </p>
              <p className="text-sm text-slate-900 dark:text-white">
                {credData?.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Temporary Password
              </p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  {showPassword ? credData?.password : "\u2022".repeat(10)}
                </p>
                <button
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowCreds(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
