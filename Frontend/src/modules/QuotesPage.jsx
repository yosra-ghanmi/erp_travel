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
  fetchQuotes,
  createQuote,
  updateQuoteStatus,
  fetchClients,
  fetchServices,
  createInvoice,
} from "../services/erpApi";

const initialForm = {
  clientNo: "",
  serviceCode: "",
  // Environment Note: Business Central license restricts dates to specific months (Nov, Dec, Jan, Feb)
  quoteDate: "2026-01-15",
  validUntilDate: "2026-02-15",
  status: "Draft",
};

export function QuotesPage({ agencyId }) {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const normalize = (item, fields) => {
    const normalized = { ...item };
    Object.keys(fields).forEach((key) => {
      const variations = fields[key];
      for (const v of variations) {
        if (item[v] !== undefined) {
          normalized[key] = item[v];
          break;
        }
        if (item[v.toLowerCase()] !== undefined) {
          normalized[key] = item[v.toLowerCase()];
          break;
        }
      }
    });
    return normalized;
  };

  const normalizeQuote = (q) =>
    normalize(q, {
      quoteNo: ["quoteno", "quote_no", "no", "id"],
      clientNo: ["clientno", "client_no", "client_id"],
      clientName: ["clientname", "client_name", "name"],
      serviceCode: ["servicecode", "service_code"],
      totalAmount: ["totalamount", "total_amount", "amount"],
      currencyCode: ["currencycode", "currency_code", "currency"],
      quoteDate: ["quotedate", "quote_date", "date"],
      validUntilDate: ["validuntildate", "valid_until_date", "valid_until"],
      status: ["status"],
    });

  const normalizeService = (s) =>
    normalize(s, {
      serviceCode: ["code", "servicecode", "service_code"],
      name: ["name", "servicename", "service_name"],
    });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          fetchQuotes(),
          fetchClients(),
          fetchServices(),
        ]);

        const [qRes, cRes, sRes] = results;

        if (qRes.status === "fulfilled") {
          const normalizedQuotes = (qRes.value || []).map(normalizeQuote);
          setQuotes(normalizedQuotes);
        } else {
          const reason = qRes.reason;
          const detail =
            reason.response?.data?.detail || reason.message || "Unknown error";
          console.error("Quotes fetch failed:", reason);
          setError(`Quotes: ${detail}`);
        }

        if (cRes.status === "fulfilled") {
          setClients(cRes.value || []);
        }

        if (sRes.status === "fulfilled") {
          const normalizedServices = (sRes.value || []).map(normalizeService);
          setServices(normalizedServices);
        }
      } catch (err) {
        console.error("Failed to load quotes data:", err);
        setError(`System Error: ${err.message || err.toString()}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveQuote = async () => {
    if (!form.clientNo) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await createQuote(form);
      const normalizedResult = normalizeQuote(result);
      setQuotes((prev) => [...prev, normalizedResult]);
      setForm(initialForm);
      setMessage("Quote created successfully in Business Central.");
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to save quote";
      setError(`Failed to save quote: ${detail}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (quoteNo, newStatus) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await updateQuoteStatus(quoteNo, newStatus);
      const normalizedResult = normalizeQuote(result);

      setQuotes((prev) =>
        prev.map((q) =>
          q.quoteNo === quoteNo || q.quoteno === quoteNo ? normalizedResult : q
        )
      );
      setMessage(`Quote ${quoteNo} marked as ${newStatus}.`);

      if (newStatus === "Accepted") {
        // Automatically suggest creating an invoice
        setMessage(
          `Quote ${quoteNo} accepted! You can now generate an invoice.`
        );
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Unknown error";
      setError(`Failed to update quote status: ${detail}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (quote) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const invoiceData = {
        quoteNo: quote.quoteNo,
        clientNo: quote.clientNo,
        serviceCode: quote.serviceCode,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        status: "Open",
        currencyCode: quote.currencyCode || "USD",
      };
      await createInvoice(invoiceData);
      setMessage(`Invoice generated successfully for Quote ${quote.quoteNo}.`);
    } catch (err) {
      setError("Failed to generate invoice.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel
          title="Quotes Management"
          right={
            <p className="text-xs text-slate-500">{quotes.length} records</p>
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
            headers={["No.", "Client", "Amount", "Status", "Actions"]}
            rows={quotes.map((quote) => {
              const qNo = quote.quoteNo;
              const status = quote.status || "Draft";
              return (
                <tr
                  key={qNo}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="px-2 py-3 text-xs font-mono">{qNo}</td>
                  <td className="px-2 py-3">
                    {quote.clientName ||
                      clients.find((c) => c.id === quote.clientNo)?.name ||
                      quote.clientNo}
                  </td>
                  <td className="px-2 py-3 font-bold">
                    {quote.totalAmount || 0} {quote.currencyCode || "USD"}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge value={status.toLowerCase()} />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex gap-2">
                      {status === "Draft" && (
                        <Button
                          variant="ghost"
                          onClick={() => handleStatusChange(qNo, "Sent")}
                        >
                          Send
                        </Button>
                      )}
                      {status === "Sent" && (
                        <>
                          <Button
                            variant="success"
                            onClick={() => handleStatusChange(qNo, "Accepted")}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleStatusChange(qNo, "Rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {status === "Accepted" && (
                        <Button
                          variant="primary"
                          onClick={() => generateInvoice(quote)}
                        >
                          Generate Invoice
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          />
        </Panel>
      </div>
      <Panel title="Create New Quote">
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
            Linked Service (Optional)
          </label>
          <Select
            value={form.serviceCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, serviceCode: e.target.value }))
            }
          >
            <option value="">None</option>
            {services.map((service) => (
              <option key={service.serviceCode} value={service.serviceCode}>
                {service.serviceCode} - {service.name}
              </option>
            ))}
          </Select>

          <label className="text-[10px] uppercase font-bold text-slate-400">
            Quote Date
          </label>
          <Input
            type="date"
            value={form.quoteDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, quoteDate: e.target.value }))
            }
          />

          <label className="text-[10px] uppercase font-bold text-slate-400">
            Valid Until
          </label>
          <Input
            type="date"
            value={form.validUntilDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, validUntilDate: e.target.value }))
            }
          />

          <Button
            onClick={saveQuote}
            className="w-full"
            disabled={loading || !form.clientNo}
          >
            {loading ? "Processing..." : "Create Quote"}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
