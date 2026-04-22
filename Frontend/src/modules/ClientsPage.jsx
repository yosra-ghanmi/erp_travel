import { useMemo, useState, useEffect } from "react";
import { Button, DataTable, Input, Panel, Select } from "../components/ui";
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
        // Mock update for now
        setClients((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...form } : item
          )
        );
      } else {
        // Real creation in Business Central
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
      setError("Failed to save to Business Central. Client added locally.");
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
  };

  const deleteClient = (clientId) => {
    if (!canDelete) return;
    setClients((prev) => prev.filter((client) => client.id !== clientId));
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
    <div className="grid gap-6 xl:grid-cols-3">
      <Panel
        title="Clients List"
        right={
          <p className="text-xs text-slate-500">{filtered.length} records</p>
        }
      >
        {error && (
          <div className="mb-4 text-xs text-rose-500 font-medium">{error}</div>
        )}
        <DataTable
          headers={["Client", "Country", "Actions"]}
          rows={filtered.map((client) => (
            <tr
              key={client.id}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              <td className="px-2 py-3">
                <p className="font-medium text-slate-900 dark:text-white">
                  {client.name}
                </p>
                <p className="text-xs text-slate-500">{client.email}</p>
              </td>
              <td className="px-2 py-3">{client.country}</td>
              <td className="px-2 py-3">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => selectClient(client)}>
                    Edit
                  </Button>
                  {canDelete ? (
                    <Button
                      variant="danger"
                      onClick={() => deleteClient(client.id)}
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        />
      </Panel>

      <Panel title={editingId ? "Edit Client" : "Add Client"}>
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
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <Input
            placeholder="Country"
            value={form.country}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, country: e.target.value }))
            }
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
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

      <Panel title="Client Profile">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Select a client from the table with Edit to open profile details.
          </p>
          {editingId ? (
            <>
              <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {form.name}
                </p>
                <p>{form.email}</p>
                <p>{form.phone}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Booking History
                </p>
                <div className="space-y-2">
                  {bookings
                    .filter((booking) => booking.clientId === editingId)
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700"
                      >
                        {booking.destination} ({booking.startDate}) -{" "}
                        {booking.status}
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
