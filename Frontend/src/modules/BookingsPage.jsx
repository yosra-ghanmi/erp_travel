import { useState, useEffect } from "react";
import { Button, DataTable, IconButton, Input, Panel, Select } from "../components/ui";
import { Pencil, Trash2 } from "lucide-react";
import {
  fetchBookings,
  createBooking,
  deleteBooking,
  fetchClients,
} from "../services/erpApi";

const initialForm = {
  clientNo: "",
  tripName: "",
  // Environment Note: BC license restricts dates to specific months (Nov, Dec, Jan, Feb)
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
        // Mock update
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

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to delete booking ${bookingId}?`)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((item) => item.bookingid !== bookingId));
      if (editingId === bookingId) {
        setEditingId("");
        setForm(initialForm);
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to delete booking";
      setError(`Delete Error: ${detail}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel
          title="Bookings Table"
          right={
            <p className="text-xs text-slate-500">{bookings.length} records</p>
          }
        >
          {error && (
            <div className="mb-4 text-xs text-rose-500 font-medium">
              {error}
            </div>
          )}
          <DataTable
            headers={[
              "ID",
              "Client",
              "Category",
              "Source Invoice",
              "Trip",
              "Dates",
              "Amount",
              "Actions",
            ]}
            rows={bookings.map((booking, idx) => (
              <tr
                key={booking.bookingid}
                className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/50 ${
                  idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-gray-50/50 dark:bg-slate-800/50"
                }`}
              >
                <td className="px-2 py-3 text-xs font-bold text-gray-900 dark:text-gray-100">
                  {booking.bookingid}
                </td>
                <td className="px-2 py-3 text-gray-700 dark:text-gray-300">
                  {clients.find((c) => (c.no || c.id) === booking.clientno)
                    ?.name || booking.clientno}
                </td>
                <td className="px-2 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                    {booking.bookingcategory || "Manual"}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                  {booking.sourceinvoiceno || "N/A"}
                </td>
                <td className="px-2 py-3 font-bold text-gray-900 dark:text-gray-100">{booking.tripname}</td>
                <td className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {booking.startdate} → {booking.enddate}
                </td>
                <td className="px-2 py-3 font-bold text-blue-600 dark:text-brand-400">${booking.amount}</td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <IconButton
                      icon={Pencil}
                      onClick={() => startEdit(booking)}
                      disabled={loading}
                      title="Edit"
                    />
                    <IconButton
                      icon={Trash2}
                      variant="danger"
                      onClick={() => handleDeleteBooking(booking.bookingid)}
                      disabled={loading}
                      title="Delete"
                    />
                  </div>
                </td>
              </tr>
            ))}
          />
        </Panel>
      </div>
      <Panel title={editingId ? "Edit Booking" : "Create Booking"}>
        <div className="space-y-3">
          <Select
            value={form.clientNo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, clientNo: e.target.value }))
            }
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option
                key={client.no || client.id}
                value={client.no || client.id}
              >
                {client.name}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Trip Name"
            value={form.tripName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tripName: e.target.value }))
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                Start Date
              </label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                End Date
              </label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>
          <Input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: e.target.value }))
            }
            placeholder="Amount"
          />
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-slate-500"
            rows={4}
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Booking Notes"
          />
          <Button onClick={saveBooking} className="w-full" disabled={loading}>
            {loading
              ? "Processing..."
              : editingId
              ? "Update Booking"
              : "Save Booking"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
