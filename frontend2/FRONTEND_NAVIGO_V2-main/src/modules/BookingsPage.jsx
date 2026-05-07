import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  User, 
  MapPin, 
  DollarSign, 
  Plus, 
  Edit3, 
  MoreVertical, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Users,
  Briefcase
} from "lucide-react";
import { Button, DataTable, Input, Panel, Select, StatusBadge, Card } from "../components/ui";
import { fetchBookings, createBooking, fetchClients } from "../services/erpApi";

const initialForm = {
  clientNo: "",
  tripName: "",
  startDate: "2026-01-15",
  endDate: "2026-01-25",
  amount: 0,
  notes: "",
};

export function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bData, cData] = await Promise.all([
          fetchBookings(),
          fetchClients(),
        ]);
        setBookings(bData || []);
        setClients(cData || []);
      } catch (err) {
        console.error("Failed to load bookings data:", err);
      }
    };
    loadData();
  }, []);

  const saveBooking = async () => {
    if (!form.clientNo || !form.tripName || !form.startDate) return;
    setLoading(true);
    setError("");
    try {
      if (editingId) {
        setBookings((prev) =>
          prev.map((item) =>
            item.bookingid === editingId ? { ...item, ...form } : item
          )
        );
      } else {
        const result = await createBooking(form);
        setBookings((prev) => [...prev, result]);
      }
      setEditingId("");
      setForm(initialForm);
    } catch (err) {
      setError("Failed to save to Business Central.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (booking) => {
    setEditingId(booking.bookingid);
    setForm({
      clientNo: booking.clientno,
      tripName: booking.tripname,
      startDate: booking.startdate,
      endDate: booking.enddate,
      amount: booking.amount,
      notes: booking.notes,
    });
  };

  const filteredBookings = bookings.filter(b => 
    b.tripname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.bookingid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    revenue: bookings.reduce((acc, b) => acc + (Number(b.amount) || 0), 0),
    pending: bookings.filter(b => b.status === 'pending').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Bookings <span className="text-brand-500">.</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Manage trip reservations and client itineraries with ease.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="group relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-500" />
            <Input 
              placeholder="Search bookings..." 
              className="pl-10 w-64 bg-white/50 backdrop-blur-sm transition-all focus:w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" className="gap-2 px-6 shadow-premium">
            <Plus className="h-5 w-5" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card 
          title="Total Reservations" 
          value={stats.total} 
          hint="+12% from last month" 
          icon={Briefcase} 
        />
        <Card 
          title="Gross Revenue" 
          value={`$${stats.revenue.toLocaleString()}`} 
          hint="+8.4% growth" 
          icon={TrendingUp} 
        />
        <Card 
          title="Pending Approval" 
          value={stats.pending} 
          hint="Action required" 
          icon={Clock} 
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Table Section */}
        <div className="xl:col-span-2">
          <Panel
            title="Active Reservations"
            right={
              <StatusBadge value={`${filteredBookings.length} Bookings`} />
            }
          >
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}
            
            <DataTable
              headers={["Booking Details", "Client", "Status", "Amount", "Actions"]}
              rows={filteredBookings.map((booking, idx) => (
                <motion.tr
                  key={booking.bookingid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-500/20 text-brand-600 dark:from-brand-500/20 dark:to-brand-500/5 dark:text-brand-400">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{booking.tripname}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">{booking.bookingid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {clients.find((c) => (c.no || c.id) === booking.clientno)?.name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {clients.find((c) => (c.no || c.id) === booking.clientno)?.name || booking.clientno}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {booking.startdate}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <StatusBadge value={booking.status || "confirmed"} />
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        ${Number(booking.amount || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">USD</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" className="h-9 w-9 rounded-xl p-0 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20" onClick={() => startEdit(booking)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
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

        {/* Form Section */}
        <div className="space-y-6">
          <Panel 
            title={editingId ? "Edit Reservation" : "Create New Booking"}
            right={editingId && (
              <Button variant="ghost" size="sm" onClick={() => { setEditingId(""); setForm(initialForm); }}>
                Cancel
              </Button>
            )}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Customer Selection</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    value={form.clientNo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, clientNo: e.target.value }))
                    }
                  >
                    <option value="">Choose a client</option>
                    {clients.map((client) => (
                      <option
                        key={client.no || client.id}
                        value={client.no || client.id}
                      >
                        {client.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Trip Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    placeholder="Where are they going?"
                    value={form.tripName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tripName: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Check In</label>
                  <Input
                    type="date"
                    className="h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Check Out</label>
                  <Input
                    type="date"
                    className="h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Financials</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white font-bold"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Itinerary Notes</label>
                <textarea
                  className="w-full rounded-xl border border-transparent bg-slate-50/50 px-4 py-3 text-sm outline-none ring-brand-500/20 transition-all focus:bg-white focus:ring-4 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Special requests or itinerary details..."
                />
              </div>

              <Button 
                onClick={saveBooking} 
                className="w-full h-14 text-lg shadow-premium mt-4" 
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  editingId ? "Update Reservation" : "Confirm Booking"
                )}
              </Button>
            </div>
          </Panel>

          {/* Quick Info Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white shadow-xl shadow-brand-600/20"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Clock className="h-7 w-7" />
            </div>
            <h4 className="mb-2 text-xl font-black">Booking Policy</h4>
            <p className="text-sm leading-relaxed text-brand-100 opacity-90">
              BC license restricts dates to specific months (Nov, Dec, Jan, Feb). Please ensure all dates fall within these periods.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
