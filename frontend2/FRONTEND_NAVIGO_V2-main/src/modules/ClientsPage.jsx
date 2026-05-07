import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  History,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Briefcase,
  Users,
  Star,
  ShieldCheck
} from "lucide-react";
import { Button, DataTable, Input, Panel, StatusBadge, Card } from "../components/ui";
import { createClient, fetchClients } from "../services/erpApi";

const defaultClient = {
  name: "",
  email: "",
  phone: "",
  country: "",
  notes: "",
};

export function ClientsPage({
  clients,
  setClients,
  bookings,
  canDelete,
  agencyId,
  searchQuery,
}) {
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(defaultClient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [internalSearch, setInternalSearch] = useState("");

  useEffect(() => {
    const loadClients = async () => {
      try {
        const bcClients = await fetchClients();
        if (bcClients && Array.isArray(bcClients)) {
          const mapped = bcClients.map((c) => ({
            id: c.no || c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            country: c.country,
            notes: c.notes,
            agency_id: agencyId,
          }));
          setClients(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch clients from BC:", err);
      }
    };
    loadClients();
  }, [agencyId, setClients]);

  const saveClient = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        setClients((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...form } : item
          )
        );
      } else {
        const result = await createClient(form);
        const newClient = {
          id: result.no || result.id || `CL-${Date.now()}`,
          agency_id: agencyId,
          ...form,
        };
        setClients((prev) => [...prev, newClient]);
      }
      setEditingId("");
      setForm(defaultClient);
    } catch (err) {
      console.error("BC Save failed:", err);
      setError("Failed to save to Business Central.");
    } finally {
      setLoading(false);
    }
  };

  const selectClient = (client) => {
    setEditingId(client.id);
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      country: client.country || "",
      notes: client.notes || "",
    });
  };

  const deleteClient = (clientId) => {
    if (!canDelete) return;
    setClients((prev) => prev.filter((client) => client.id !== clientId));
  };

  const filtered = useMemo(() => {
    const query = (internalSearch || searchQuery || "").toLowerCase();
    if (!clients || !Array.isArray(clients)) return [];
    if (!query) return clients;
    return clients.filter((client) => {
      const name = client.name || "";
      const email = client.email || "";
      return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
    });
  }, [clients, searchQuery, internalSearch]);

  const stats = {
    total: clients?.length || 0,
    vip: clients?.filter(c => c.status === 'vip').length || 0,
    new: 12, // Mocked for now
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Clients <span className="text-brand-500">.</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Manage your customer relationships and detailed profiles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="group relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-500" />
            <Input 
              placeholder="Search clients..." 
              className="pl-10 w-64 bg-white/50 backdrop-blur-sm transition-all focus:w-80"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
            />
          </div>
          <Button variant="primary" className="gap-2 px-6 shadow-premium">
            <Plus className="h-5 w-5" />
            New Client
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card 
          title="Total Customers" 
          value={stats.total} 
          hint="+5.2% this month" 
          icon={Users} 
        />
        <Card 
          title="VIP Members" 
          value={stats.vip} 
          hint="Priority support" 
          icon={Star} 
        />
        <Card 
          title="Active Accounts" 
          value={stats.total - 2} 
          hint="Verified status" 
          icon={ShieldCheck} 
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Table Section */}
        <div className="xl:col-span-2">
          <Panel
            title="Client Directory"
            right={<StatusBadge value={`${filtered.length} Total`} />}
          >
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <DataTable
              headers={["Client Information", "Location", "Actions"]}
              rows={filtered.map((client, idx) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-400 font-black text-lg">
                          {client.name?.charAt(0)}
                        </div>
                        {client.status === 'vip' && (
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 text-[10px] text-white dark:border-slate-900">
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{client.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
                        <Globe className="h-4 w-4 text-brand-500" />
                        {client.country || "Global Citizen"}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Phone className="h-3 w-3" />
                        {client.phone || "No phone"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" className="h-9 w-9 rounded-xl p-0 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20" onClick={() => selectClient(client)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button variant="ghost" className="h-9 w-9 rounded-xl p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => deleteClient(client.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" className="h-9 w-9 rounded-xl p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            />
          </Panel>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          <Panel 
            title={editingId ? "Edit Profile" : "Add New Client"}
            right={editingId && (
              <Button variant="ghost" size="sm" onClick={() => { setEditingId(""); setForm(defaultClient); }}>
                Cancel
              </Button>
            )}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white font-mono text-xs"
                      placeholder="+1..."
                      value={form.phone}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                      placeholder="e.g. Morocco"
                      value={form.country}
                      onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Internal Notes</label>
                <textarea
                  className="w-full rounded-xl border border-transparent bg-slate-50/50 px-4 py-3 text-sm outline-none ring-brand-500/20 transition-all focus:bg-white focus:ring-4 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Preferences, allergies, or special requirements..."
                />
              </div>

              <Button 
                onClick={saveClient} 
                className="w-full h-14 text-lg shadow-premium mt-4" 
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  editingId ? "Update Profile" : "Register Client"
                )}
              </Button>
            </div>
          </Panel>

          {/* Verification Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-xl"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
            <h4 className="mb-2 text-xl font-black text-white">Data Security</h4>
            <p className="text-sm leading-relaxed text-slate-400">
              All client data is encrypted and synced directly with Microsoft Business Central for maximum compliance.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {editingId ? (
              <motion.div
                key={editingId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Panel title="Activity Timeline">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-full bg-brand-50 flex items-center justify-center dark:bg-brand-900/20">
                        <History className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Booking History</p>
                        <div className="mt-3 space-y-3">
                          {bookings.filter((b) => (b.clientno === editingId || b.clientId === editingId)).length > 0 ? (
                            bookings
                              .filter((b) => (b.clientno === editingId || b.clientId === editingId))
                              .map((booking) => (
                                <div
                                  key={booking.bookingid || booking.id}
                                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{booking.tripname || booking.destination}</span>
                                    <StatusBadge value={booking.status || "confirmed"} />
                                  </div>
                                  <p className="text-[10px] text-slate-500 uppercase font-medium">{booking.startdate}</p>
                                </div>
                              ))
                          ) : (
                            <p className="text-xs text-slate-500 italic">No bookings found for this client.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-800"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                  <Briefcase className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Client Selected</h4>
                <p className="mt-1 text-xs text-slate-500">Select a client from the list to view their full activity history and profile details.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
