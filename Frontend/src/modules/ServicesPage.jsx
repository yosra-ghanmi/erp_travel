import { useMemo, useState, useEffect } from "react";
import {
  Button,
  DataTable,
  Input,
  Panel,
  Select,
  StatusBadge,
} from "../components/ui";
import {
  createReservation,
  createService,
  deleteService,
  fetchReservations,
  fetchServices,
} from "../services/erpApi";

const blankService = { name: "", category: "Transfer", price: 0, active: true };

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
}) {
  const [form, setForm] = useState(blankService);
  const [editingId, setEditingId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(
    clients[0]?.id ?? ""
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const startEdit = (service) => {
    if (!hasPermission("services", "update")) return;
    setEditingId(service.id);
    setForm({
      name: service.name,
      category: service.category,
      price: service.price,
      active: service.active,
    });
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
        setMessage("Service updated successfully");
      } else {
        // Real creation in Business Central
        const payload = {
          name: form.name,
          serviceType: form.category,
          price: Number(form.price),
          currencyCode: "USD",
        };
        const result = await createService(payload);
        const newService = {
          id: result.code || result.id || `SV-${Date.now()}`,
          agency_id: agencyId,
          ...form,
          price: Number(form.price),
        };
        setServices((prev) => [...prev, newService]);
        setMessage("Service created successfully in Business Central");
      }
      setEditingId("");
      setForm(blankService);
    } catch (err) {
      console.error("BC Save failed:", err);
      setError("Failed to save to Business Central. Service added locally.");
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
      setMessage(`Service ${serviceId} deleted from Business Central`);
    } catch (err) {
      console.error("BC Delete failed:", err);
      setError(
        "Failed to delete from Business Central. Service removed locally."
      );
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
    }
  };

  const agencyServices = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    return services.filter((service) => service.agency_id === agencyId);
  }, [services, agencyId]);

  const agencyUsage = useMemo(() => {
    if (!serviceUsage || !Array.isArray(serviceUsage)) return [];
    return serviceUsage.filter((usage) => usage.agency_id === agencyId);
  }, [serviceUsage, agencyId]);

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
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel
          title={canManage ? "Services Management" : "Services Catalog"}
          right={
            <p className="text-xs text-slate-500">
              {agencyServices.length} services
            </p>
          }
        >
          {error && (
            <div className="mb-4 text-xs text-rose-500 font-medium">
              {error}
            </div>
          )}
          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <Select
              value={selectedClientId}
              onChange={(event) => setSelectedClientId(event.target.value)}
            >
              <option value="">Select client to use service</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
            {message ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                {message}
              </p>
            ) : null}
          </div>
          <DataTable
            headers={["Service", "Category", "Price", "Status", "Actions"]}
            rows={agencyServices.map((service) => (
              <tr
                key={service.id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {service.name}
                  </p>
                  <p className="text-xs text-slate-500">{service.id}</p>
                </td>
                <td className="px-2 py-3">{service.category}</td>
                <td className="px-2 py-3">${service.price}</td>
                <td className="px-2 py-3">
                  <StatusBadge
                    value={service.active ? "active" : "suspended"}
                  />
                </td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      onClick={() => assignService(service.id)}
                      disabled={!selectedClientId}
                    >
                      Use
                    </Button>
                    {canManage ? (
                      <Button
                        variant="ghost"
                        onClick={() => startEdit(service)}
                      >
                        Edit
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button
                        variant="danger"
                        onClick={() => removeService(service.id)}
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
      </div>
      <Panel title="Service Form">
        {canManage ? (
          <div className="space-y-3">
            <Input
              placeholder="Service name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <Select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
            >
              <option value="Transfer">Transfer</option>
              <option value="Documentation">Documentation</option>
              <option value="Insurance">Insurance</option>
              <option value="Comfort">Comfort</option>
            </Select>
            <Input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, price: event.target.value }))
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, active: event.target.checked }))
                }
              />
              Active service
            </label>
            <Button onClick={saveService} className="w-full" disabled={loading}>
              {loading
                ? "Processing..."
                : editingId
                ? "Update Service"
                : "Create Service"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>You can use services for clients and bookings.</p>
            <p>Only Agency Admin can create, update, or delete services.</p>
            <p>Total usage entries: {agencyUsage.length}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
