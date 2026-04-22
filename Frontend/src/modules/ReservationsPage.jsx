import { useState, useEffect, useMemo } from "react";
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
  fetchClients,
  fetchServices,
} from "../services/erpApi";

export function BookingsPage({
  agencyId,
  reservations: propsReservations,
  bookings: propsBookings,
  clients: propsClients,
  services: propsServices,
  searchQuery,
}) {
  const [reservations, setReservations] = useState(propsReservations || []);
  const [clients, setClients] = useState(propsClients || []);
  const [services, setServices] = useState(propsServices || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (propsReservations) setReservations(propsReservations);
  }, [propsReservations]);

  useEffect(() => {
    if (propsClients) setClients(propsClients);
  }, [propsClients]);

  useEffect(() => {
    if (propsServices) setServices(propsServices);
  }, [propsServices]);

  // Combine both TravelReservations and TravelBookings for a complete list
  const allBookings = useMemo(() => {
    const mappedReservations = reservations.map((res) => {
      const getVal = (keys) => {
        for (const k of keys) {
          if (res[k] !== undefined) return res[k];
          if (res[k.toLowerCase()] !== undefined) return res[k.toLowerCase()];
        }
        return "";
      };

      const cNo = getVal(["clientId", "clientno", "client_no", "clientNo"]);
      const clientName =
        getVal(["clientName", "clientname", "client_name", "name"]) ||
        clients.find((c) => (c.no || c.id) === cNo)?.name ||
        cNo;

      const sCode = getVal([
        "serviceId",
        "servicecode",
        "service_code",
        "serviceCode",
        "code",
      ]);
      const serviceName =
        getVal(["servicename", "service_name", "serviceName"]) ||
        services.find((s) => (s.code || s.id) === sCode)?.name ||
        sCode;

      return {
        ...res,
        displayId: res.id || res.reservationNo || res.reservationno,
        displayType: "Service",
        displayDate: res.at || res.reservationDate || res.reservationdate,
        clientName,
        serviceName,
      };
    });

    const mappedBookings = (propsBookings || []).map((bk) => {
      const getVal = (keys) => {
        for (const k of keys) {
          if (bk[k] !== undefined) return bk[k];
          if (bk[k.toLowerCase()] !== undefined) return bk[k.toLowerCase()];
        }
        return "";
      };

      const cNo = getVal(["clientId", "clientno", "client_no", "clientNo"]);
      const clientName =
        getVal(["clientName", "clientname", "client_name", "name"]) ||
        clients.find((c) => (c.no || c.id) === cNo)?.name ||
        cNo;

      return {
        ...bk,
        displayId: bk.id || bk.bookingId || bk.bookingid,
        displayType: "Trip",
        displayDate: bk.startDate || bk.startdate,
        clientName,
        serviceName: bk.destination || bk.tripName || bk.tripname,
      };
    });

    return [...mappedReservations, ...mappedBookings].sort(
      (a, b) => new Date(b.displayDate) - new Date(a.displayDate)
    );
  }, [reservations, propsBookings, clients, services]);

  const filteredBookings = useMemo(() => {
    if (!searchQuery) return allBookings;
    const q = searchQuery.toLowerCase();
    return allBookings.filter((res) => {
      const id = String(res.displayId || "").toLowerCase();
      const client = String(res.clientName || "").toLowerCase();
      const service = String(res.serviceName || "").toLowerCase();
      const type = String(res.displayType || "").toLowerCase();
      const status = String(res.status || "").toLowerCase();

      return (
        id.includes(q) ||
        client.includes(q) ||
        service.includes(q) ||
        type.includes(q) ||
        status.includes(q)
      );
    });
  }, [allBookings, searchQuery]);

  return (
    <div className="w-full">
      <Panel
        title="Bookings Table"
        right={
          <p className="text-xs text-slate-500">
            {filteredBookings.length} records
          </p>
        }
      >
        {error && (
          <div className="mb-4 text-xs text-rose-500 font-medium">{error}</div>
        )}
        {message && (
          <div className="mb-4 text-xs text-emerald-500 font-medium">
            {message}
          </div>
        )}
        <DataTable
          headers={["ID", "Type", "Client", "Service/Trip", "Date", "Status"]}
          rows={filteredBookings.map((res) => {
            const id = res.displayId;
            const type = res.displayType;
            const cName = res.clientName;
            const sName = res.serviceName;
            const rDate = res.displayDate;
            const status = res.status || "Confirmed";

            return (
              <tr
                key={id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3 text-xs font-mono">{id}</td>
                <td className="px-2 py-3 text-xs">
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-medium ${
                      type === "Service"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                    }`}
                  >
                    {type}
                  </span>
                </td>
                <td className="px-2 py-3">{cName}</td>
                <td className="px-2 py-3">{sName}</td>
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
  );
}
