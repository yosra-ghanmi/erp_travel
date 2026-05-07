import { useMemo, useState } from "react";
import {
  BadgePlus,
  Eye,
  EyeOff,
  LogIn,
  Pencil,
  Power,
  Trash2,
  Building2,
  Users,
  Calendar,
  Activity,
  Search,
  Plus,
  TrendingUp,
  MoreVertical,
  ShieldCheck,
  Globe,
  Briefcase
} from "lucide-react";
import {
  Button,
  DataTable,
  Input,
  Modal,
  Panel,
  Select,
  StatusBadge,
  Card
} from "../components/ui";
import { motion, AnimatePresence } from "framer-motion";

const blankAgency = {
  name: "",
  logo: "/logo-agency.png",
  owner_id: "",
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
  const [localSearch, setLocalSearch] = useState("");

  const filteredAgencies = useMemo(() => {
    const q = (localSearch || searchQuery || "").toLowerCase();
    if (!q) return agencies;
    return agencies.filter((agency) => {
      const name = String(agency.name || "").toLowerCase();
      const status = String(agency.subscription_status || "").toLowerCase();
      const owner = users.find((user) => user.id === agency.owner_id);
      const ownerName = String(owner?.name || "").toLowerCase();
      return name.includes(q) || status.includes(q) || ownerName.includes(q);
    });
  }, [agencies, searchQuery, localSearch, users]);

  const stats = useMemo(() => {
    const activeCount = agencies.filter(a => a.subscription_status === 'active').length;
    const totalBookings = bookings.length;
    return [
      { label: "Total Agencies", value: agencies.length, icon: Building2, color: "text-brand-500", trend: "Global" },
      { label: "Active Subs", value: activeCount, icon: ShieldCheck, color: "text-emerald-500", trend: `${Math.round((activeCount/agencies.length)*100)}% Rate` },
      { label: "Platform Bookings", value: totalBookings, icon: Calendar, iconColor: "text-amber-500", trend: "All Time" },
      { label: "System Health", value: "99.9%", icon: Activity, color: "text-indigo-500", trend: "Optimal" },
    ];
  }, [agencies, bookings]);

  const submitAgency = () => {
    if (!form.name || !form.owner_id) return;
    if (editingId && editingId !== "new") {
      onEditAgency(editingId, form);
    } else {
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
      subscription_status: agency.subscription_status,
    });
  };

  const adminUsers = users.filter((user) => user.role === "admin");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/20">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Platform Agencies
              </h1>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Super Admin View
                </span>
                <span>•</span>
                <span>{agencies.length} registered agencies</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setEditingId("new");
              setForm(blankAgency);
            }}
            className="h-11 rounded-xl bg-brand-500 px-6 font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Agency
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group hover:border-brand-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className={`rounded-2xl bg-slate-50 p-3 dark:bg-slate-900 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 ${stat.color || stat.iconColor}`} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {stat.trend}
                  </span>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {stat.value}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className={editingId ? "xl:col-span-2" : "xl:col-span-3"}>
          <Panel 
            title="Agency Directory"
            right={
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search agencies..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="h-9 w-64 rounded-xl border-slate-200 bg-slate-50 pl-10 text-xs font-medium focus:border-brand-500 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>
            }
          >
            <DataTable
              headers={[
                "Agency Name",
                "Owner / Admin",
                "Status",
                "Bookings",
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
                    className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-2">
                          <Building2 className="h-full w-full text-brand-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{agency.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">{agency.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${owner?.name}`} alt="" />
                        </div>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {owner?.name ?? "No Owner"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={subscriptionStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{totalBookings}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEdit(agency)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-brand-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleSubscription(agency.id)}
                          className={`h-8 w-8 p-0 ${subscriptionStatus === "active" ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onImpersonate(agency.id)}
                          className="h-8 w-8 p-0 text-brand-500 hover:bg-brand-50"
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                        {onDeleteAgency && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteAgency(agency.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
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
        </div>

        <AnimatePresence>
          {editingId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Panel 
                title={editingId === "new" ? "Register Agency" : "Update Agency"}
                right={
                  <Button variant="ghost" size="sm" onClick={() => setEditingId("")} className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Agency Name
                    </label>
                    <Input
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="e.g. Atlas Travel"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Primary Owner
                    </label>
                    <Select
                      value={form.owner_id}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, owner_id: event.target.value }))
                      }
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value="">Select owner</option>
                      {adminUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Logo Asset URL
                    </label>
                    <Input
                      value={form.logo}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, logo: event.target.value }))
                      }
                      placeholder="/assets/logos/agency-1.png"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Subscription
                    </label>
                    <Select
                      value={form.subscription_status}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          subscription_status: event.target.value,
                        }))
                      }
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value="active">Active Plan</option>
                      <option value="suspended">Suspended</option>
                    </Select>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button 
                      onClick={submitAgency}
                      className="h-12 w-full rounded-2xl shadow-premium font-black uppercase tracking-widest text-sm"
                    >
                      {editingId === "new" ? "Register Agency" : "Save Changes"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId("");
                        setForm(blankAgency);
                      }}
                      className="w-full h-11 text-xs font-bold uppercase tracking-widest text-slate-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={showCreds}
        onClose={() => setShowCreds(false)}
        title="Security Credentials"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <p className="text-xs font-bold leading-relaxed">
              SECURITY ALERT: Save these credentials now. This is the only time the generated password will be visible.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agency</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{credData?.agency_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin ID</p>
                <p className="font-mono text-sm font-bold text-brand-500">{credData?.user_id}</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login Email</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{credData?.email}</p>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temporary Password</p>
              <div className="mt-1 flex items-center justify-between rounded-xl bg-white p-3 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="font-mono text-sm font-black tracking-widest text-slate-900 dark:text-white">
                  {showPassword ? credData?.password : "\u2022".repeat(12)}
                </p>
                <button
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowCreds(false)}
            className="h-12 w-full rounded-2xl shadow-premium font-black uppercase tracking-widest text-sm"
          >
            I've Saved the Credentials
          </Button>
        </div>
      </Modal>
    </div>
  );
}
