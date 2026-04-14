import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  sendEmail,
  fetchQuoteLines,
  deleteQuote,
} from "../services/erpApi";

const initialForm = {
  clientNo: "",
  serviceCode: "",
  serviceCodes: [], // For multiple services
  discount_percent: 0,
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
  const [clientSearch, setClientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

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
      subtotal: ["subtotal", "sub_total"],
      discount_percent: [
        "discount_percent",
        "discount_percentage",
        "discountpercent",
        "discount_perc",
        "discount",
      ],
      discountAmount: ["discountamount", "discount_amount"],
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
      // If multiple services are selected, we pass them as serviceCodes
      const quoteData = { ...form };
      if (form.serviceCodes.length > 0) {
        quoteData.serviceCode = ""; // Clear singular if multiple are used
      }

      const result = await createQuote(quoteData);
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

  const handleDeleteQuote = async (quoteNo) => {
    if (!window.confirm(`Are you sure you want to delete quote ${quoteNo}?`))
      return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await deleteQuote(quoteNo);
      setQuotes((prev) => prev.filter((q) => q.quoteNo !== quoteNo));
      setMessage(`Quote ${quoteNo} deleted successfully.`);
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to delete quote";
      setError(`Delete Error: ${detail}`);
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
        // Environment Note: BC license restricts dates to specific months (Nov, Dec, Jan, Feb)
        invoiceDate: "2026-01-20",
        dueDate: "2026-02-20",
        status: "Open",
        currencyCode: quote.currencyCode || "USD",
      };
      await createInvoice(invoiceData);
      setMessage(`Invoice generated successfully for Quote ${quote.quoteNo}.`);
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Unknown error";
      setError(`Failed to generate invoice: ${detail}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (quote) => {
    let lines = [];
    try {
      lines = await fetchQuoteLines(quote.quoteNo);
    } catch (err) {
      console.error("Failed to fetch quote lines:", err);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("TRAVEL QUOTE", pageWidth / 2, 20, { align: "center" });

    // Agency Info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Smart Travel Agency", 14, 30);
    doc.text("123 Travel Avenue, Tourism City", 14, 35);

    // Quote Details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Quote No: ${quote.quoteNo}`, 14, 50);
    doc.text(`Date: ${quote.quoteDate || "N/A"}`, 14, 57);
    doc.text(`Valid Until: ${quote.validUntilDate || "N/A"}`, 14, 64);

    // Client Info
    const clientName =
      quote.clientName ||
      clients.find((c) => c.id === quote.clientNo || c.no === quote.clientNo)
        ?.name ||
      quote.clientNo ||
      "N/A";
    doc.text(`Client: ${clientName}`, 14, 75);

    // Services Table
    const tableRows =
      lines.length > 0
        ? lines.map((line) => [
            line.servicename ||
              line.service_name ||
              line.description ||
              line.servicecode ||
              "Travel Service",
            line.quantity || 1,
            `${line.unitprice || line.unit_price || 0} ${
              quote.currencyCode || "USD"
            }`,
            `${line.lineamount || line.line_amount || 0} ${
              quote.currencyCode || "USD"
            }`,
          ])
        : [
            [
              quote.serviceCode || "Travel Services",
              1,
              `${quote.subtotal || quote.totalAmount || 0} ${
                quote.currencyCode || "USD"
              }`,
              `${quote.subtotal || quote.totalAmount || 0} ${
                quote.currencyCode || "USD"
              }`,
            ],
          ];

    autoTable(doc, {
      startY: 85,
      head: [["Service Description", "Qty", "Unit Price", "Total"]],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(11);
    if (quote.discount_percent > 0) {
      doc.text(
        `Subtotal: ${quote.subtotal || 0} ${quote.currencyCode || "USD"}`,
        pageWidth - 80,
        finalY
      );
      doc.text(
        `Discount (${quote.discount_percent}%): -${quote.discountAmount || 0} ${
          quote.currencyCode || "USD"
        }`,
        pageWidth - 80,
        finalY + 7
      );
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text(
        `TOTAL: ${quote.totalAmount || 0} ${quote.currencyCode || "USD"}`,
        pageWidth - 80,
        finalY + 16
      );
    } else {
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text(
        `TOTAL: ${quote.totalAmount || 0} ${quote.currencyCode || "USD"}`,
        pageWidth - 80,
        finalY
      );
    }

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Thank you for choosing Smart Travel Agency!",
      pageWidth / 2,
      280,
      {
        align: "center",
      }
    );
    return doc;
  };

  const downloadPDF = async (quote) => {
    try {
      setMessage(`Generating PDF for Quote ${quote.quoteNo}...`);
      setError("");
      const doc = await generatePDF(quote);
      doc.save(`Quote_${quote.quoteNo}.pdf`);
      setMessage(`PDF for Quote ${quote.quoteNo} downloaded successfully.`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError(`Failed to generate PDF: ${err.message || "Internal Error"}`);
    }
  };

  const sendQuoteEmail = async (quote) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const client = clients.find(
        (c) => c.id === quote.clientNo || c.no === quote.clientNo
      );
      const to_email = client?.email;

      if (!to_email) {
        throw new Error(
          `Client ${
            client?.name || quote.clientNo
          } does not have an email address.`
        );
      }

      setMessage(`Preparing email for ${to_email}...`);
      const doc = await generatePDF(quote);
      const pdfBase64 = doc.output("datauristring");

      const emailData = {
        to_email: to_email,
        subject: `Your Travel Quote - ${quote.quoteNo}`,
        body: `Hello ${
          client?.name || "Valued Client"
        },\n\nPlease find attached the quote ${
          quote.quoteNo
        } for your travel request.\n\nThank you for choosing Smart Travel Agency!`,
        attachment_base64: pdfBase64,
        filename: `Quote_${quote.quoteNo}.pdf`,
      };

      await sendEmail(emailData);
      setMessage(`Quote ${quote.quoteNo} has been sent to ${to_email}.`);

      // Mark as Sent if it was Draft
      if (quote.status === "Draft") {
        await handleStatusChange(quote.quoteNo, "Sent");
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to send email";
      setError(`Mailing Error: ${detail}`);
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadPDF(quote)}
                        title="Download PDF"
                      >
                        PDF
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => sendQuoteEmail(quote)}
                        title="Send by Email"
                      >
                        Mail
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuote(quote.quoteNo)}
                        title="Delete Quote"
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        Del
                      </Button>
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
                          To Invoice
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
            Client Search
          </label>
          <Input
            placeholder="Search client..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
          <Select
            value={form.clientNo}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, clientNo: e.target.value }))
            }
          >
            <option value="">Select client</option>
            {clients
              .filter((c) =>
                c.name.toLowerCase().includes(clientSearch.toLowerCase())
              )
              .map((client) => (
                <option
                  key={client.no || client.id}
                  value={client.no || client.id}
                >
                  {client.name}
                </option>
              ))}
          </Select>

          <label className="text-[10px] uppercase font-bold text-slate-400">
            Service Search
          </label>
          <Input
            placeholder="Search service..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
          />
          <Select
            multiple
            value={form.serviceCodes}
            onChange={(e) => {
              const options = Array.from(
                e.target.selectedOptions,
                (opt) => opt.value
              );
              setForm((prev) => ({ ...prev, serviceCodes: options }));
            }}
            className="h-24"
          >
            {services
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                  s.serviceCode
                    .toLowerCase()
                    .includes(serviceSearch.toLowerCase())
              )
              .map((service) => (
                <option key={service.serviceCode} value={service.serviceCode}>
                  {service.serviceCode} - {service.name}
                </option>
              ))}
          </Select>
          <p className="text-[9px] text-slate-400 italic">
            Hold Ctrl/Cmd to select multiple
          </p>

          <label className="text-[10px] uppercase font-bold text-slate-400">
            Discount
          </label>
          <Select
            value={form.discount_percent}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                discount_percent: Number(e.target.value),
              }))
            }
          >
            <option value="0">No Discount</option>
            <option value="5">5% Discount</option>
            <option value="7">7% Discount</option>
            <option value="10">10% Discount</option>
            <option value="15">15% Discount (Max)</option>
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
