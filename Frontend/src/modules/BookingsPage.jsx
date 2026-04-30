import { useState, useEffect } from "react";
import { Button, DataTable, Input, Panel, Select } from "../components/ui";
import { fetchBookings, createBooking, fetchClients } from "../services/erpApi";

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
            rows={bookings.map((booking) => (
              <tr
                key={booking.bookingid}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3 text-xs font-mono">
                  {booking.bookingid}
                </td>
                <td className="px-2 py-3">
                  {clients.find((c) => (c.no || c.id) === booking.clientno)
                    ?.name || booking.clientno}
                </td>
                <td className="px-2 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {booking.bookingcategory || "Manual"}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs font-mono">
                  {booking.sourceinvoiceno || "N/A"}
                </td>
                <td className="px-2 py-3 font-medium">{booking.tripname}</td>
                <td className="px-2 py-3 text-xs">
                  {booking.startdate} → {booking.enddate}
                </td>
                <td className="px-2 py-3 font-bold">${booking.amount}</td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => startEdit(booking)}>
                      Edit
                    </Button>
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
              <label className="text-[10px] uppercase font-bold text-slate-400">
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
              <label className="text-[10px] uppercase font-bold text-slate-400">
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
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
