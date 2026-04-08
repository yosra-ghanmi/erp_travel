import { useState, useEffect } from "react";
import {
  Button,
  DataTable,
  Input,
  Panel,
  Select,
  StatusBadge,
} from "../components/ui";
import {
  fetchReservations,
  createReservation,
  fetchClients,
  fetchServices,
} from "../services/erpApi";

const initialForm = {
  clientNo: "",
  serviceCode: "",
  // Environment Note: Business Central license restricts dates to specific months (Nov, Dec, Jan, Feb)
  reservationDate: "2026-01-15",
  status: "Pending",
};

export function BookingsPage({ agencyId }) {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rData, cData, sData] = await Promise.all([
          fetchReservations(),
          fetchClients(),
          fetchServices(),
        ]);
        console.log("Reservations loaded from BC:", rData);
        setReservations(rData || []);
        setClients(cData || []);
        setServices(sData || []);
      } catch (err) {
        console.error("Failed to load bookings data:", err);
        setError("Failed to load data from Business Central.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveReservation = async () => {
    if (!form.clientNo || !form.serviceCode) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await createReservation(form);
      setReservations((prev) => [...prev, result]);
      setForm(initialForm);
      setMessage("Booking created successfully in Business Central.");
    } catch (err) {
      setError("Failed to save booking to Business Central.");
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
            <p className="text-xs text-slate-500">
              {reservations.length} records
            </p>
          }
        >
          {error && (
            <div className="mb-4 text-xs text-rose-500 font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 text-xs text-emerald-500 font-medium">
              {message}
            </div>
          )}
          <DataTable
            headers={["ID", "Client", "Service", "Date", "Status"]}
            rows={reservations.map((res) => {
              // Flexible key matching
              const getVal = (keys) => {
                for (const k of keys) {
                  if (res[k] !== undefined) return res[k];
                  if (res[k.toLowerCase()] !== undefined)
                    return res[k.toLowerCase()];
                }
                return "";
              };

              const id = getVal([
                "reservationno",
                "reservation_no",
                "reservationNo",
                "no",
                "id",
              ]);
              const cNo = getVal(["clientno", "client_no", "clientNo"]);
              const cName = getVal([
                "clientname",
                "client_name",
                "clientName",
                "name",
              ]);
              const sCode = getVal([
                "servicecode",
                "service_code",
                "serviceCode",
                "code",
              ]);
              const sName = getVal([
                "servicename",
                "service_name",
                "serviceName",
              ]);
              const rDate = getVal([
                "reservationdate",
                "reservation_date",
                "reservationDate",
                "date",
              ]);
              const status = getVal(["status"]) || "Pending";

              return (
                <tr
                  key={id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="px-2 py-3 text-xs font-mono">{id}</td>
                  <td className="px-2 py-3">
                    {cName ||
                      clients.find((c) => (c.no || c.id) === cNo)?.name ||
                      cNo}
                  </td>
                  <td className="px-2 py-3">
                    {sName ||
                      services.find((s) => (s.code || s.id) === sCode)?.name ||
                      sCode}
                  </td>
                  <td className="px-2 py-3 text-xs">{rDate}</td>
                  <td className="px-2 py-3">
                    <StatusBadge value={status.toLowerCase()} />
                  </td>
                </tr>
              );
            })}
          />
        </Panel>
      </div>
      <Panel title="Create Booking">
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-slate-400">
            Client
          </label>
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

          <label className="text-[10px] uppercase font-bold text-slate-400">
            Service
          </label>
          <Select
            value={form.serviceCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, serviceCode: e.target.value }))
            }
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option
                key={service.code || service.id}
                value={service.code || service.id}
              >
                {service.name}
              </option>
            ))}
          </Select>

          <label className="text-[10px] uppercase font-bold text-slate-400">
            Booking Date
          </label>
          <Input
            type="date"
            value={form.reservationDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reservationDate: e.target.value }))
            }
          />

          <label className="text-[10px] uppercase font-bold text-slate-400">
            Status
          </label>
          <Select
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="Pending">Pending</option>
            <option value="Program Designed">Program Designed</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>

          <Button
            onClick={saveReservation}
            className="w-full"
            disabled={loading || !form.clientNo || !form.serviceCode}
          >
            {loading ? "Processing..." : "Save Booking"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
