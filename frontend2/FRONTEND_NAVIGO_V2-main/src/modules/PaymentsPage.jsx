import { useMemo, useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Button,
  DataTable,
  Input,
  Panel,
  Select,
  StatusBadge,
  Card,
} from "../components/ui";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  FileText,
  Download,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  ArrowUpRight,
  FileDown,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export function PaymentsPage({ searchQuery }) {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  const filteredInvoices = useMemo(() => {
    const q = (localSearch || searchQuery || "").toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const iNo = String(inv.invoiceNo || "").toLowerCase();
      const client = String(inv.clientName || "").toLowerCase();
      const status = String(inv.status || "").toLowerCase();
      return iNo.includes(q) || client.includes(q) || status.includes(q);
    });
  }, [invoices, searchQuery, localSearch]);

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const totalPending = invoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);
    const paidCount = invoices.filter(i => (i.status || "").toLowerCase().includes("paid")).length;
    
    return [
      { label: "Total Revenue", value: `$${Math.round(totalRevenue).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", trend: "+12.5%" },
      { label: "Pending Balance", value: `$${Math.round(totalPending).toLocaleString()}`, icon: Clock, color: "text-amber-500", trend: "Action Req" },
      { label: "Paid Invoices", value: paidCount, icon: CheckCircle2, color: "text-brand-500", trend: "High Rate" },
      { label: "Total Invoices", value: invoices.length, icon: FileText, color: "text-indigo-500", trend: "Stable" },
    ];
  }, [payments, invoices]);

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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/20">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Payments & Billing
              </h1>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Financial Core
                </span>
                <span>•</span>
                <span>{invoices.length} Invoices Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center -space-x-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 w-10 rounded-xl border-2 border-white bg-slate-100 dark:border-slate-900 dark:bg-slate-800"
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`}
                alt="Avatar"
                className="h-full w-full rounded-xl"
              />
            </div>
          ))}
          <div className="z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-brand-500 text-[10px] font-black text-white dark:border-slate-900">
            +12
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group hover:border-brand-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className={`rounded-2xl bg-slate-50 p-3 dark:bg-slate-900 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {stat.trend}
                  </span>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {stat.value}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="Invoices & Status"
            right={
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="h-9 w-64 rounded-xl border-slate-200 bg-slate-50 pl-10 text-xs font-medium focus:border-brand-500 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>
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
              rows={filteredInvoices.map((inv) => {
                const iNo = inv.invoiceNo;
                return (
                  <tr
                    key={iNo}
                    className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                          <FileText className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                          {iNo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {inv.clientName ||
                          clients.find((c) => (c.no || c.id) === inv.clientNo)
                            ?.name ||
                          inv.clientNo}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        ${Number(inv.totalAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-emerald-600">
                      <span className="text-sm font-bold">
                        ${Number(inv.amountPaid || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-black text-rose-500">
                        ${Number(inv.balanceDue || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        value={(inv.status || "Open").toLowerCase()}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoicePDF(inv)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-brand-500"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendInvoiceEmail(inv)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-brand-500"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <div className="mx-1 h-4 w-[1px] bg-slate-200 dark:bg-slate-700 self-center" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(inv.invoiceNo)}
                          className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            />
          </Panel>
        </div>

        <Panel
          title="Record Payment"
          right={
            <div className="rounded-full bg-brand-50 px-2 py-1 dark:bg-brand-900/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">
                New Entry
              </span>
            </div>
          }
        >
          <div className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-500 dark:bg-rose-900/20"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-500 dark:bg-emerald-900/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Select Invoice
              </label>
              <Select
                value={form.invoiceNo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, invoiceNo: e.target.value }))
                }
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="">Choose an invoice...</option>
                {invoices
                  .filter(
                    (i) =>
                      (i.status || "Open").toLowerCase() !== "fully paid" &&
                      (i.status || "Open").toLowerCase() !== "paid"
                  )
                  .map((inv) => (
                    <option key={inv.invoiceNo} value={inv.invoiceNo}>
                      {inv.invoiceNo} - Balance: $
                      {inv.balanceDue || inv.totalAmount}
                    </option>
                  ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Amount to Pay
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 font-black dark:border-slate-800 dark:bg-slate-900"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Method
                </label>
                <Select
                  value={form.method}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, method: e.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Date
                </label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>

            <Button
              onClick={savePayment}
              className="mt-4 h-12 w-full rounded-2xl shadow-premium font-black uppercase tracking-widest text-sm"
              disabled={loading || !form.invoiceNo || !form.amount}
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent Transactions"
        right={
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            <History className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {payments.length} Records
            </span>
          </div>
        }
      >
        <DataTable
          headers={["Transaction", "Invoice", "Method", "Amount", "Date"]}
          rows={payments.map((payment) => {
            const pId = payment.paymentid || payment.paymentId || payment.id;
            const iNo = payment.invoiceno || payment.invoiceNo;
            return (
              <tr
                key={pId}
                className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-brand-50 p-2 dark:bg-brand-900/20">
                      <Wallet className="h-4 w-4 text-brand-500" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                      {pId}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-xs font-bold text-slate-500">
                  {iNo}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                      {payment.method}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-sm font-black">
                      ${Number(payment.amount).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-bold text-slate-500">
                    {payment.date}
                  </span>
                </td>
              </tr>
            );
          })}
        />
      </Panel>
    </div>
  );
}
