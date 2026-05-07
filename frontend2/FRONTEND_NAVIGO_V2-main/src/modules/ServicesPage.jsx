import { useMemo, useState, useEffect } from "react";
import {
  Button,
  DataTable,
  Input,
  Panel,
  Select,
  StatusBadge,
  Card,
} from "../components/ui";
import { 
  Wrench, 
  TrendingUp, 
  Package, 
  MapPin, 
  DollarSign, 
  MoreVertical, 
  Plus, 
  Search,
  Activity,
  Hotel,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createReservation,
  createService,
  deleteService,
  fetchReservations,
  fetchServices,
} from "../services/erpApi";

const blankService = {
  name: "",
  category: "Activity",
  price: 0,
  active: true,
  location: "",
  description: "",
  imageUrl: "",
};

export function ServicesPage({
  role,
  agencyId,
  services,
  setServices,
  serviceUsage,
  setServiceUsage,
  users,
  clients,
  hasPermission,
  pushNotification,
  searchQuery,
}) {
  const [form, setForm] = useState(blankService);
  const [editingId, setEditingId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(
    clients[0]?.id ?? ""
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        const [bcServices, bcReservations] = await Promise.all([
          fetchServices(),
          fetchReservations(),
        ]);

        if (bcServices && Array.isArray(bcServices)) {
          const mapped = bcServices.map((s) => ({
            id: s.code || s.id,
            name: s.name,
            category: s.servicetype || "Other",
            price: Number(s.price) || 0,
            active: true,
            agency_id: agencyId,
            location: s.location || "",
            description: s.description || "",
            imageUrl: s.image_url || "",
          }));
          setServices(mapped);
        }

        if (bcReservations && Array.isArray(bcReservations)) {
          const mappedUsage = bcReservations.map((r) => ({
            id: r.reservationno || r.id,
            agency_id: agencyId,
            serviceId: r.servicecode,
            serviceName: r.servicename,
            clientId: r.clientno,
            clientName: r.clientname,
            status: r.status,
            at: r.reservationdate,
          }));
          setServiceUsage(mappedUsage);
        }
      } catch (err) {
        console.error("Failed to fetch data from BC:", err);
      }
    };
    loadServices();
  }, [agencyId, setServices, setServiceUsage]);

  const stats = useMemo(() => {
    const list = services || [];
    const active = list.filter(s => s.active).length;
    const avgPrice = list.length ? list.reduce((acc, s) => acc + s.price, 0) / list.length : 0;
    const categories = new Set(list.map(s => s.category)).size;

    return [
      { label: "Total Services", value: list.length, icon: Package, color: "text-brand-500", trend: "+12%" },
      { label: "Active Services", value: active, icon: CheckCircle2, color: "text-emerald-500", trend: "Stable" },
      { label: "Avg. Price", value: `$${Math.round(avgPrice)}`, icon: DollarSign, color: "text-amber-500", trend: "+5%" },
      { label: "Categories", value: categories, icon: Activity, color: "text-indigo-500", trend: "Diverse" },
    ];
  }, [services]);

  const startEdit = (service) => {
    if (!hasPermission("services", "update")) return;
    setEditingId(service.id);
    setForm({
      name: service.name,
      category: service.category,
      price: service.price,
      active: service.active,
      location: service.location || "",
      description: service.description || "",
      imageUrl: service.imageUrl || "",
    });
  };

  const notifyAdmins = (message) => {
    if (role !== "superadmin") return;

    // In a real app, this would be handled by the backend pushing notifications.
    // For this simulation, we'll update the localStorage for all admin users.
    users
      .filter((u) => u.role === "admin")
      .forEach((admin) => {
        const key = `erp_notifications_${admin.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const newNotif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          message,
          read: false,
        };
        localStorage.setItem(
          key,
          JSON.stringify([newNotif, ...existing].slice(0, 8))
        );
      });

    // Also notify current session (if superadmin wants to see their own updates in notifications)
    if (pushNotification) pushNotification(message);
  };

  const saveService = async () => {
    if (!hasPermission("services", "create") || !form.name) return;
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        // Mock update for now
        setServices((prev) =>
          prev.map((service) =>
            service.id === editingId
              ? { ...service, ...form, price: Number(form.price) }
              : service
          )
        );
        const msg = `Service ${form.name} updated by Superadmin`;
        setMessage("Service updated successfully");
        notifyAdmins(msg);
      } else {
        // Real creation in Business Central
        const payload = {
          name: form.name,
          serviceType: form.category,
          price: Number(form.price),
          currencyCode: "USD",
          location: form.location,
          description: form.description,
        };
        const result = await createService(payload);
        const newService = {
          id: result.code || result.id || `SV-${Date.now()}`,
          agency_id: agencyId,
          ...form,
          price: Number(form.price),
        };
        setServices((prev) => [...prev, newService]);
        const msg = `New service ${form.name} created by Superadmin`;
        setMessage("Service created successfully in Business Central");
        notifyAdmins(msg);
      }
      setEditingId("");
      setForm(blankService);
    } catch (err) {
      console.error("BC Save failed:", err);
      const errorMsg =
        err.response?.data?.detail || err.message || "Unknown error";
      setError(
        `Failed to save to Business Central: ${errorMsg}. Service added locally.`
      );
      if (!editingId) {
        const fallbackId = `SV-${200 + (services?.length || 0) + 1}`;
        setServices((prev) => [
          ...prev,
          {
            id: fallbackId,
            agency_id: agencyId,
            ...form,
            price: Number(form.price),
          },
        ]);
        const msg = `New service ${form.name} created locally (BC Sync failed)`;
        notifyAdmins(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeService = async (serviceId) => {
    if (!hasPermission("services", "delete")) return;
    try {
      await deleteService(serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      const msg = `Service ${serviceId} deleted by Superadmin`;
      setMessage(`Service ${serviceId} deleted from Business Central`);
      notifyAdmins(msg);
    } catch (err) {
      console.error("BC Delete failed:", err);
      setError(
        "Failed to delete from Business Central. Service removed locally."
      );
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      const msg = `Service ${serviceId} removed locally (BC Sync failed)`;
      notifyAdmins(msg);
    }
  };

  const agencyServices = useMemo(() => {
    let list = services || [];
    if (role !== "superadmin") {
      list = list.filter((service) => service.agency_id === agencyId);
    }
    const q = (localSearch || searchQuery || "").toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q)
    );
  }, [services, agencyId, role, searchQuery, localSearch]);

  const agencyUsage = useMemo(() => {
    if (!serviceUsage || !Array.isArray(serviceUsage)) return [];
    if (role === "superadmin") return serviceUsage;
    return serviceUsage.filter((usage) => usage.agency_id === agencyId);
  }, [serviceUsage, agencyId, role]);

  const assignService = async (serviceId) => {
    if (!hasPermission("services", "use") || !selectedClientId) return;
    setLoading(true);
    setError("");
    try {
      const payload = {
        clientNo: selectedClientId,
        serviceCode: serviceId,
        // Environment Note: Business Central license restricts dates to specific months (Nov, Dec, Jan, Feb)
        reservationDate: "2026-01-15",
        status: "Pending",
      };
      const result = await createReservation(payload);
      setServiceUsage((prev) => [
        ...prev,
        {
          id: result.reservationNo || result.id || `RES-${Date.now()}`,
          agency_id: agencyId,
          serviceId: result.serviceCode || serviceId,
          clientId: result.clientNo || selectedClientId,
          status: result.status || "Pending",
          at: result.reservationDate || payload.reservationDate,
        },
      ]);
      setMessage(
        `Service ${serviceId} assigned successfully to client ${selectedClientId}`
      );
    } catch (err) {
      console.error("Reservation creation failed:", err);
      setError("Failed to create reservation in Business Central.");
    } finally {
      setLoading(false);
    }
  };

  const canManage = hasPermission("services", "create");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Services <span className="text-brand-500">.</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Manage your service catalog and client reservations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 dark:border-slate-900 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {agencyServices.length} active offerings
          </p>
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
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
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
        <div className="xl:col-span-2 space-y-6">
          <Panel
            title={
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white tracking-tight">
                    {canManage ? "Service Inventory" : "Service Catalog"}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {agencyServices.length} items listed
                  </p>
                </div>
              </div>
            }
            right={
              <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search services..."
                    className="w-64 pl-10 h-10 bg-slate-50/50 border-transparent focus:bg-white transition-all"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                  />
                </div>
                {canManage && (
                  <Button className="h-10 px-4 rounded-xl flex items-center gap-2 shadow-premium" onClick={() => {
                    setEditingId("");
                    setForm(blankService);
                  }}>
                    <Plus className="h-4 w-4" />
                    <span>New Service</span>
                  </Button>
                )}
              </div>
            }
          >
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold"
              >
                <AlertCircle className="h-5 w-5" />
                {error}
              </motion.div>
            )}

            <div className="mb-6 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-1/2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Quick Reservation</p>
                <Select
                  value={selectedClientId}
                  onChange={(event) => setSelectedClientId(event.target.value)}
                  className="h-12 bg-white dark:bg-slate-800"
                >
                  <option value="">Select client to assign service</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Select>
              </div>
              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DataTable
              headers={["Service Information", "Category", "Price", "Status", ""]}
              rows={agencyServices.map((service) => (
                <tr
                  key={service.id}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      {service.imageUrl ? (
                        <div className="relative">
                          <img
                            src={service.imageUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                          />
                          <div className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${service.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 group-hover:from-brand-50 group-hover:to-brand-100 group-hover:text-brand-500 transition-colors">
                          <Wrench className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                          {service.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          ID: {service.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {service.category === "Hotel" ? (
                        <Hotel className="h-3.5 w-3.5 text-indigo-500" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-brand-500" />
                      )}
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{service.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-slate-900 dark:text-white">
                    ${service.price}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      value={service.active ? "active" : "suspended"}
                      className="rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="success"
                        className="h-9 px-3 rounded-xl text-xs font-bold"
                        onClick={() => assignService(service.id)}
                        disabled={!selectedClientId}
                      >
                        Assign
                      </Button>
                      {canManage && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800"
                            onClick={() => startEdit(service)}
                          >
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel 
            title={
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-brand-500" />
                <span>{editingId ? "Edit Service" : "New Service"}</span>
              </div>
            }
          >
            {canManage ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Service Name</label>
                    <Input
                      placeholder="e.g. VIP Airport Transfer"
                      value={form.name}
                      className="h-12 bg-slate-50/50 border-transparent focus:bg-white transition-all rounded-xl"
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Category</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Activity", "Hotel"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                          className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 transition-all ${
                            form.category === cat
                              ? "border-brand-500 bg-brand-50/50 text-brand-600 dark:bg-brand-900/20"
                              : "border-slate-100 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900"
                          }`}
                        >
                          {cat === "Hotel" ? <Hotel size={16} /> : <Activity size={16} />}
                          <span className="text-sm font-bold">{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Price (USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="number"
                          className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white transition-all rounded-xl font-bold"
                          value={form.price}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, price: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white transition-all rounded-xl"
                          placeholder="City/Region"
                          value={form.location}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, location: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
                    <textarea
                      placeholder="Service details and inclusions..."
                      className="w-full rounded-xl border-transparent bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:bg-white dark:bg-slate-900/50 dark:text-slate-200 min-h-[100px]"
                      value={form.description}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-1">Cover Image URL</label>
                    <Input
                      placeholder="https://images.unsplash.com/..."
                      value={form.imageUrl}
                      className="h-12 bg-slate-50/50 border-transparent focus:bg-white transition-all rounded-xl"
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                      }
                    />
                  </div>

                  <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-slate-200 text-brand-500 focus:ring-brand-500"
                      checked={form.active}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, active: event.target.checked }))
                      }
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Active Listing</p>
                      <p className="text-[10px] text-slate-400 font-medium">Available for new reservations</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-3">
                  {editingId && (
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-14 rounded-2xl"
                      onClick={() => {
                        setEditingId("");
                        setForm(blankService);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={saveService} 
                    className="flex-[2] h-14 rounded-2xl shadow-premium text-lg" 
                    disabled={loading}
                  >
                    {loading
                      ? "Processing..."
                      : editingId
                      ? "Update Service"
                      : "Create Service"}
                  </Button>
                </div>

                {editingId && (
                  <Button
                    variant="danger"
                    className="w-full h-12 rounded-xl opacity-50 hover:opacity-100 transition-opacity text-xs font-black uppercase tracking-widest"
                    onClick={() => removeService(editingId)}
                  >
                    Delete Service Permanently
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Management Restricted</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-[200px] mx-auto">
                    Only Agency Administrators can modify the service catalog.
                  </p>
                </div>
                <div className="pt-4 w-full">
                  <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-left border border-brand-100 dark:border-brand-900/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-1">Activity Log</p>
                    <p className="text-xs font-medium text-brand-800 dark:text-brand-200">
                      Total usage entries: {agencyUsage.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
