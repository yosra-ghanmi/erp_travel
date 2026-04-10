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
  fetchPayments,
  createPayment,
  fetchInvoices,
  fetchClients,
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
        setInvoices(iData || []);
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

  const savePayment = async () => {
    if (!form.invoiceNo || !form.amount) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const selectedInvoice = invoices.find(
        (i) => (i.invoiceno || i.invoiceNo) === form.invoiceNo
      );
      const payload = {
        ...form,
        clientNo: selectedInvoice.clientno || selectedInvoice.clientNo,
        bookingId:
          selectedInvoice.reservationno || selectedInvoice.reservationNo || "",
      };
      const result = await createPayment(payload);
      setPayments((prev) => [...prev, result]);

      // Refresh invoices to update status
      const updatedInvoices = await fetchInvoices();
      setInvoices(updatedInvoices);

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
              ]}
              rows={invoices.map((inv) => {
                const iNo = inv.invoiceno || inv.invoiceNo;
                return (
                  <tr
                    key={iNo}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-2 py-3 text-xs font-mono">{iNo}</td>
                    <td className="px-2 py-3">
                      {inv.clientname ||
                        clients.find(
                          (c) =>
                            (c.no || c.id) === (inv.clientno || inv.clientNo)
                        )?.name ||
                        inv.clientno ||
                        inv.clientNo}
                    </td>
                    <td className="px-2 py-3 font-bold">
                      ${inv.totalamount || inv.totalAmount || 0}
                    </td>
                    <td className="px-2 py-3 text-emerald-600">
                      ${inv.amountpaid || inv.amountPaid || 0}
                    </td>
                    <td className="px-2 py-3 text-rose-600">
                      ${inv.balancedue || inv.balanceDue || 0}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge
                        value={(inv.status || "Open").toLowerCase()}
                      />
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
                  <option
                    key={inv.invoiceno || inv.invoiceNo}
                    value={inv.invoiceno || inv.invoiceNo}
                  >
                    {inv.invoiceno || inv.invoiceNo} - (Due: $
                    {inv.balancedue ||
                      inv.balanceDue ||
                      inv.totalamount ||
                      inv.totalAmount}
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
