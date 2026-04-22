import { useMemo, useState, useEffect } from "react";
import {
  Button,
  DataTable,
  Input,
  Panel,
  Select,
  StatusBadge,
} from "../components/ui";
import { Wrench } from "lucide-react";
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
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q)
    );
  }, [services, agencyId, role, searchQuery]);

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
                  <div className="flex items-center gap-3">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Wrench className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {service.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {service.id}
                      </p>
                    </div>
                  </div>
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
            <div className="flex flex-col gap-2 py-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Category
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer group">
                  <input
                    type="radio"
                    name="serviceCategory"
                    className="w-4 h-4 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    checked={form.category === "Activity"}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, category: "Activity" }))
                    }
                  />
                  <span
                    className={
                      form.category === "Activity"
                        ? "text-slate-900 font-medium dark:text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  >
                    Activity
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer group">
                  <input
                    type="radio"
                    name="serviceCategory"
                    className="w-4 h-4 border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    checked={form.category === "Hotel"}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, category: "Hotel" }))
                    }
                  />
                  <span
                    className={
                      form.category === "Hotel"
                        ? "text-slate-900 font-medium dark:text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  >
                    Hotel
                  </span>
                </label>
              </div>
            </div>
            <Input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, price: event.target.value }))
              }
            />
            <Input
              placeholder="Location"
              value={form.location}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
            />
            <textarea
              placeholder="Service description"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Image URL"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
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
