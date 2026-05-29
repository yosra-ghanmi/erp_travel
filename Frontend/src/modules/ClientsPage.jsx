import { useMemo, useState, useEffect } from "react";
import { Button, DataTable, IconButton, Input, Panel, Select, StatusBadge } from "../components/ui";
import { Pencil, Trash2 } from "lucide-react";
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
  reservations,
  services,
  canDelete,
  agencyId,
  searchQuery,
  pushNotification,
}) {
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(defaultClient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
    if (!form.name || !form.email) {
      setError("Name and email are required.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        // Mock update for now
        setClients((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...form } : item
          )
        );
        setMessage("Client updated successfully.");
        if (pushNotification)
          pushNotification("Client updated successfully.", {
            category: "success",
          });
      } else {
        // Real creation in Business Central
        const result = await createClient(form);
        const newClient = {
          id: result.no || result.id || `CL-${Date.now()}`,
          agency_id: agencyId,
          ...form,
        };
        setClients((prev) => [...prev, newClient]);
        setMessage("Client created successfully.");
        if (pushNotification)
          pushNotification("Client created successfully.", {
            category: "success",
          });
      }
      setEditingId("");
      setForm(defaultClient);
    } catch (err) {
      console.error("BC Save failed:", err);
      setError("Failed to save client. Please try again.");
      if (pushNotification)
        pushNotification("Failed to save client.", { category: "error" });
      if (!editingId) {
        const fallbackId = `CL-${1000 + (clients?.length || 0) + 1}`;
        setClients((prev) => [
          ...prev,
          { id: fallbackId, agency_id: agencyId, ...form },
        ]);
      }
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
    setError("");
    setMessage("");
  };

  const handleDeleteClient = (clientId) => {
    if (!canDelete) return;
    setClients((prev) => prev.filter((client) => client.id !== clientId));
    setMessage("Client deleted successfully.");
    setError("");
    if (pushNotification)
      pushNotification("Client deleted successfully.", { category: "success" });
  };

  const filtered = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((client) => {
      const name = client.name || "";
      const email = client.email || "";
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
  }, [clients, searchQuery]);

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
      <div className="flex-1 xl:w-1/3 min-w-0">
        <Panel
          className="h-full flex flex-col"
          title="Clients List"
          right={
            <p className="text-xs text-slate-500">{filtered.length} records</p>
          }
        >
          {error && (
            <div className="mb-4 text-xs text-rose-500 font-medium">{error}</div>
          )}
          {message && (
            <div className="mb-4 text-sm text-emerald-600 font-medium">{message}</div>
          )}
          <div className="flex-1 overflow-y-auto max-h-[600px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <DataTable
              headers={["Client", "Country", "Actions"]}
              rows={filtered.map((client, idx) => (
                <tr
                  key={client.id}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/50 ${
                    idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-gray-50/50 dark:bg-slate-800/50"
                  }`}
                >
                  <td className="px-2 py-3">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>
                  </td>
                  <td className="px-2 py-3 text-gray-600 dark:text-gray-300">{client.country}</td>
                  <td className="px-2 py-3">
                    <div className="flex gap-2">
                      <IconButton
                        icon={Pencil}
                        onClick={() => selectClient(client)}
                        disabled={loading}
                        title="Edit"
                      />
                      {canDelete && (
                        <IconButton
                          icon={Trash2}
                          variant="danger"
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={loading}
                          title="Delete"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            />
          </div>
        </Panel>
      </div>

      <div className="flex-1 xl:w-1/3">
        <Panel className="h-full" title={editingId ? "Edit Client" : "Add Client"}>
          <div className="space-y-3">
            <Input
              placeholder="Full name"
              className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              placeholder="Email"
              className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <Input
              placeholder="Phone"
              className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
            <Input
              placeholder="Country"
              className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
              value={form.country}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, country: e.target.value }))
              }
            />
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
              rows={4}
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Notes"
            />
            <Button onClick={saveClient} className="w-full" disabled={loading}>
              {loading
                ? "Processing..."
                : editingId
                ? "Update Client"
                : "Create Client"}
            </Button>
          </div>
        </Panel>
      </div>

      <div className="flex-1 xl:w-1/3">
        <Panel className="h-full" title="Client Profile">
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Select a client from the table with Edit to open profile details.
            </p>
            {editingId ? (
              <>
                <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-slate-900/50">
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {form.name}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">{form.email}</p>
                  <p className="text-gray-500 dark:text-gray-400">{form.phone}</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <p className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                    Booking History
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      const filteredBookings = bookings.filter((booking) => {
                        return (
                          String(booking.clientId) === String(editingId) ||
                          String(booking.clientNo) === String(editingId) ||
                          String(booking.clientno) === String(editingId)
                        );
                      });
                      const filteredReservations = reservations.filter(
                        (reservation) => {
                          return (
                            String(reservation.clientId) === String(editingId) ||
                            String(reservation.clientNo) === String(editingId) ||
                            String(reservation.clientno) === String(editingId)
                          );
                        }
                      );

                      if (
                        filteredBookings.length === 0 &&
                        filteredReservations.length === 0
                      ) {
                        return (
                          <p className="py-4 text-center text-xs text-gray-400">
                            No bookings found for this client.
                          </p>
                        );
                      }

                      return (
                        <>
                          {filteredBookings.map((b) => (
                            <div
                              key={b.id || b.bookingId || b.bookingid}
                              className="rounded-lg border border-gray-100 p-2 dark:border-slate-700"
                            >
                              <div className="flex justify-between">
                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                  {b.tripName || b.tripname || "Trip"}
                                </span>
                                <span className="text-xs font-bold text-emerald-600">
                                  ${b.amount}
                                </span>
                              </div>
                              <p className="text-[10px] font-medium text-gray-400">
                                {b.startDate || b.startdate} →{" "}
                                {b.endDate || b.enddate}
                              </p>
                            </div>
                          ))}
                          {filteredReservations.map((r) => (
                            <div
                              key={r.id || r.reservationNo || r.reservationno}
                              className="rounded-lg border border-gray-100 p-2 dark:border-slate-700"
                            >
                              <div className="flex justify-between">
                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                  {r.serviceName || r.servicename || "Service"}
                                </span>
                                <StatusBadge value={r.status} />
                              </div>
                              <p className="text-[10px] font-medium text-gray-400">
                                {r.at || r.reservationDate || r.reservationdate}
                              </p>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-slate-700">
                <div className="mb-4 h-12 w-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                  <Pencil className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold italic">
                  No client selected
                </p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
