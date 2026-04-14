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
  fetchPayments,
  createPayment,
  fetchInvoices,
  fetchClients,
  sendEmail,
  fetchInvoiceLines,
  deleteInvoice,
} from "../services/erpApi";

const initialForm = {
  invoiceNo: "",
  amount: 0,
  method: "card",
  // Environment Note: Business Central license restricts dates to specific months (Nov, Dec, Jan, Feb)
  date: "2026-01-15",
};

export function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
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

  const normalizeInvoice = (i) =>
    normalize(i, {
      invoiceNo: ["invoiceno", "invoice_no", "no", "id"],
      clientNo: ["clientno", "client_no", "client_id"],
      clientName: ["clientname", "client_name", "name"],
      quoteNo: ["quoteno", "quote_no"],
      totalAmount: ["totalamount", "total_amount", "amount"],
      amountPaid: ["amountpaid", "amount_paid", "paid"],
      balanceDue: ["balancedue", "balance_due", "balance"],
      invoiceDate: ["invoicedate", "invoice_date", "date"],
      dueDate: ["duedate", "due_date", "due"],
      status: ["status"],
      currencyCode: ["currencycode", "currency_code", "currency"],
      serviceCode: ["servicecode", "service_code"],
    });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [pData, iData, cData] = await Promise.all([
          fetchPayments(),
          fetchInvoices(),
          fetchClients(),
        ]);
        setPayments(pData || []);
        const normalizedInvoices = (iData || []).map(normalizeInvoice);
        setInvoices(normalizedInvoices);
        setClients(cData || []);
      } catch (err) {
        console.error("Failed to load payments data:", err);
        setError("Failed to load data from Business Central.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const generateInvoicePDF = async (invoice) => {
    let lines = [];
    const iNo = invoice.invoiceNo;
    try {
      lines = await fetchInvoiceLines(iNo);
    } catch (err) {
      console.error("Failed to fetch invoice lines:", err);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const client = clients.find((c) => (c.no || c.id) === invoice.clientNo);

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("TRAVEL INVOICE", pageWidth / 2, 20, { align: "center" });

    // Agency Info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Smart Travel Agency", 14, 30);
    doc.text("123 Travel Avenue, Tourism City", 14, 35);

    // Invoice Details
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice No: ${iNo}`, 14, 50);
    doc.text(`Date: ${invoice.invoiceDate || "N/A"}`, 14, 57);
    doc.text(`Due Date: ${invoice.dueDate || "N/A"}`, 14, 64);
    if (invoice.quoteNo) {
      doc.text(`Quote No: ${invoice.quoteNo}`, 14, 71);
    }

    // Client Info
    doc.text(
      `Client: ${
        client?.name || invoice.clientName || invoice.clientNo || "N/A"
      }`,
      14,
      82
    );

    // Items Table
    const currency = invoice.currencyCode || "USD";
    const tableRows =
      lines.length > 0
        ? lines.map((line) => [
            line.servicename ||
              line.service_name ||
              line.description ||
              line.servicecode ||
              "Travel Service",
            line.quantity || 1,
            `${line.unitprice || line.unit_price || 0} ${currency}`,
            `${line.lineamount || line.line_amount || 0} ${currency}`,
          ])
        : [
            [
              invoice.serviceCode || "Travel Services",
              `1`,
              `${invoice.totalAmount || 0} ${currency}`,
              `${invoice.totalAmount || 0} ${currency}`,
            ],
          ];

    autoTable(doc, {
      startY: 92,
      head: [["Service", "Qty", "Unit Price", "Total"]],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(11);
    doc.text(
      `Total Amount: ${invoice.totalAmount || 0} ${currency}`,
      pageWidth - 80,
      finalY
    );
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(
      `Amount Paid: ${invoice.amountPaid || 0} ${currency}`,
      pageWidth - 80,
      finalY + 7
    );
    doc.setTextColor(244, 63, 94); // Rose
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text(
      `BALANCE DUE: ${invoice.balanceDue || 0} ${currency}`,
      pageWidth - 80,
      finalY + 16
    );

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", pageWidth / 2, 280, {
      align: "center",
    });

    return doc;
  };

  const downloadInvoicePDF = async (invoice) => {
    try {
      const iNo = invoice.invoiceNo;
      setMessage(`Generating PDF for Invoice ${iNo}...`);
      const doc = await generateInvoicePDF(invoice);
      doc.save(`Invoice_${iNo}.pdf`);
      setMessage(`PDF for Invoice ${iNo} downloaded successfully.`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF.");
    }
  };

  const sendInvoiceEmail = async (invoice) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const iNo = invoice.invoiceNo;
      const client = clients.find((c) => (c.no || c.id) === invoice.clientNo);
      const to_email = client?.email;

      if (!to_email) {
        throw new Error(
          `Client ${client?.name || "Unknown"} does not have an email address.`
        );
      }

      setMessage(`Preparing email for ${to_email}...`);
      const doc = await generateInvoicePDF(invoice);
      const pdfBase64 = doc.output("datauristring");

      const emailData = {
        to_email: to_email,
        subject: `Your Travel Invoice - ${iNo}`,
        body: `Hello ${
          client?.name || "Valued Client"
        },\n\nPlease find attached the invoice ${iNo} for your travel booking.\n\nThank you for choosing Smart Travel Agency!`,
        attachment_base64: pdfBase64,
        filename: `Invoice_${iNo}.pdf`,
      };

      await sendEmail(emailData);
      setMessage(`Invoice ${iNo} has been sent to ${to_email}.`);
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to send email";
      setError(`Mailing Error: ${detail}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceNo) => {
    if (
      !window.confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)
    )
      return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await deleteInvoice(invoiceNo);
      setInvoices((prev) => prev.filter((i) => i.invoiceNo !== invoiceNo));
      setMessage(`Invoice ${invoiceNo} deleted successfully.`);
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to delete invoice";
      setError(`Delete Error: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const savePayment = async () => {
    if (!form.invoiceNo || !form.amount) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const selectedInvoice = invoices.find(
        (i) => i.invoiceNo === form.invoiceNo
      );
      const payload = {
        ...form,
        clientNo: selectedInvoice.clientNo,
        bookingId: selectedInvoice.reservationNo || "",
      };
      const result = await createPayment(payload);
      setPayments((prev) => [...prev, result]);

      // Refresh invoices to update status
      const updatedInvoicesRes = await fetchInvoices();
      const normalizedInvoices = (updatedInvoicesRes || []).map(
        normalizeInvoice
      );
      setInvoices(normalizedInvoices);

      setForm(initialForm);
      setMessage("Payment recorded and invoice status updated.");
    } catch (err) {
      setError("Failed to save payment to Business Central.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="Invoices & Status"
            right={
              <p className="text-xs text-slate-500">
                {invoices.length} records
              </p>
            }
          >
            <DataTable
              headers={[
                "Invoice No.",
                "Client",
                "Total",
                "Paid",
                "Balance",
                "Status",
                "Actions",
              ]}
              rows={invoices.map((inv) => {
                const iNo = inv.invoiceNo;
                return (
                  <tr
                    key={iNo}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-2 py-3 text-xs font-mono">{iNo}</td>
                    <td className="px-2 py-3">
                      {inv.clientName ||
                        clients.find((c) => (c.no || c.id) === inv.clientNo)
                          ?.name ||
                        inv.clientNo}
                    </td>
                    <td className="px-2 py-3 font-bold">
                      ${inv.totalAmount || 0}
                    </td>
                    <td className="px-2 py-3 text-emerald-600">
                      ${inv.amountPaid || 0}
                    </td>
                    <td className="px-2 py-3 text-rose-600">
                      ${inv.balanceDue || 0}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge
                        value={(inv.status || "Open").toLowerCase()}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoicePDF(inv)}
                          title="Download PDF"
                        >
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendInvoiceEmail(inv)}
                          title="Send by Email"
                        >
                          Mail
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(inv.invoiceNo)}
                          title="Delete Invoice"
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          Del
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            />
          </Panel>
        </div>

        <Panel title="Record Payment">
          <div className="space-y-3">
            {error && (
              <div className="text-xs text-rose-500 font-medium">{error}</div>
            )}
            {message && (
              <div className="text-xs text-emerald-500 font-medium">
                {message}
              </div>
            )}
            <label className="text-[10px] uppercase font-bold text-slate-400">
              Select Invoice
            </label>
            <Select
              value={form.invoiceNo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, invoiceNo: e.target.value }))
              }
            >
              <option value="">Select Invoice</option>
              {invoices
                .filter(
                  (i) =>
                    (i.status || "Open").toLowerCase() !== "fully paid" &&
                    (i.status || "Open").toLowerCase() !== "paid"
                )
                .map((inv) => (
                  <option key={inv.invoiceNo} value={inv.invoiceNo}>
                    {inv.invoiceNo} - (Due: ${inv.balanceDue || inv.totalAmount}
                    )
                  </option>
                ))}
            </Select>

            <label className="text-[10px] uppercase font-bold text-slate-400">
              Amount to Pay
            </label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              placeholder="Amount Paid"
            />

            <label className="text-[10px] uppercase font-bold text-slate-400">
              Payment Method
            </label>
            <Select
              value={form.method}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, method: e.target.value }))
              }
            >
              <option value="card">Credit Card</option>
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
            </Select>

            <label className="text-[10px] uppercase font-bold text-slate-400">
              Payment Date
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
            />

            <Button onClick={savePayment} className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Save Payment"}
            </Button>
          </div>
        </Panel>
      </div>

      <Panel
        title="Payment History"
        right={
          <p className="text-xs text-slate-500">{payments.length} entries</p>
        }
      >
        <DataTable
          headers={["Payment ID", "Invoice No.", "Method", "Amount", "Date"]}
          rows={payments.map((payment) => {
            const pId = payment.paymentid || payment.paymentId || payment.id;
            const iNo = payment.invoiceno || payment.invoiceNo;
            return (
              <tr
                key={pId}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="px-2 py-3 text-xs font-mono">{pId}</td>
                <td className="px-2 py-3 text-xs font-mono">{iNo}</td>
                <td className="px-2 py-3 text-xs uppercase">
                  {payment.method}
                </td>
                <td className="px-2 py-3 font-bold text-emerald-600">
                  ${payment.amount}
                </td>
                <td className="px-2 py-3 text-xs">{payment.date}</td>
              </tr>
            );
          })}
        />
      </Panel>
    </div>
  );
}
