import { useState, useEffect, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import {
  Filter,
  ArrowUpRight,
  Download,
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/authCore";
import { Card, Panel, Button } from "../components/ui";
import { fetchPayments, fetchExpenses, sendEmail } from "../services/erpApi";
import { PayrollGenerator } from "./PayrollGenerator";

export function FinancialDashboard() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reportRange, setReportRange] = useState("last_30_days");
  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const revenueChartRef = useRef(null);
  const expenseChartRef = useRef(null);
  const { users, role } = useAuth();

  const reportRanges = [
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "year_to_date", label: "Year to Date" },
  ];

  const getRangeBounds = (key) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (key) {
      case "this_month":
        start.setDate(1);
        break;
      case "last_month":
        start.setMonth(now.getMonth() - 1, 1);
        end.setMonth(now.getMonth(), 0);
        break;
      case "year_to_date":
        start.setMonth(0, 1);
        break;
      default:
        start.setDate(now.getDate() - 29);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const filterByDate = (items) => {
    const { start, end } = getRangeBounds(reportRange);
    return items.filter((item) => {
      const date = item.date ? new Date(item.date) : null;
      return (
        date instanceof Date && !isNaN(date) && date >= start && date <= end
      );
    });
  };

  const filteredPayments = useMemo(
    () => filterByDate(payments),
    [payments, reportRange]
  );
  const filteredExpenses = useMemo(
    () => filterByDate(expenses),
    [expenses, reportRange]
  );

  const reportStats = useMemo(() => {
    const totalRevenue = filteredPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const totalExpenses = filteredExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );
    const profit = totalRevenue - totalExpenses;

    const monthMap = {};
    filteredPayments.forEach((p) => {
      const month = p.date?.substring(0, 7) || "Unknown";
      if (!monthMap[month])
        monthMap[month] = { month, revenue: 0, expenses: 0 };
      monthMap[month].revenue += p.amount;
    });
    filteredExpenses.forEach((e) => {
      const month = e.date?.substring(0, 7) || "Unknown";
      if (!monthMap[month])
        monthMap[month] = { month, revenue: 0, expenses: 0 };
      monthMap[month].expenses += e.amount;
    });

    const monthlyData = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        ...item,
        displayMonth: new Date(item.month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
      }));

    const typeMap = {};
    filteredExpenses.forEach((e) => {
      const type = e.expensetype || e.type || "Other";
      typeMap[type] = (typeMap[type] || 0) + e.amount;
    });

    return {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin:
        totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0,
      monthlyData,
      expenseDistribution: Object.entries(typeMap).map(([name, value]) => ({
        name,
        value,
      })),
    };
  }, [filteredPayments, filteredExpenses, reportRange]);

  const COLORS = ["#0ea5e9", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6"];

  const exportCsv = () => {
    const rows = [
      ["metric", "value"],
      ["date_range", reportRange.replace(/_/g, " ")],
      ["total_revenue", reportStats.totalRevenue],
      ["total_expenses", reportStats.totalExpenses],
      ["net_profit", reportStats.profit],
      ["profit_margin", `${reportStats.profitMargin}%`],
    ];
    const csv = rows.map((line) => line.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-report-${reportRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setReportMessage("Report exported as CSV.");
    setReportError("");
  };

  const getSvgDataUrl = async (svgElement) => {
    if (!svgElement) return null;
    const clonedSvg = svgElement.cloneNode(true);
    if (!clonedSvg.getAttribute("xmlns")) {
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const width = svgElement.clientWidth || 700;
        const height = svgElement.clientHeight || 400;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png"));
        } else {
          reject(new Error("Canvas context unavailable"));
        }
        URL.revokeObjectURL(url);
      };
      image.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      image.src = url;
    });
  };

  const createReportPdf = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(18);
    doc.text("Periodic Finance Report", 40, 40);
    doc.setFontSize(11);
    doc.text(`Date Range: ${reportRange.replace(/_/g, " ")}`, 40, 65);

    const summaryLines = [
      `Total Revenue: $${reportStats.totalRevenue.toLocaleString()}`,
      `Total Expenses: $${reportStats.totalExpenses.toLocaleString()}`,
      `Net Profit: $${reportStats.profit.toLocaleString()}`,
      `Profit Margin: ${reportStats.profitMargin}%`,
    ];

    summaryLines.forEach((line, index) => {
      doc.text(line, 40, 90 + index * 16);
    });

    let currentY = 90 + summaryLines.length * 16 + 16;
    doc.text("Expense distribution:", 40, currentY);
    currentY += 16;
    reportStats.expenseDistribution.forEach((item) => {
      doc.text(`- ${item.name}: $${item.value.toLocaleString()}`, 48, currentY);
      currentY += 14;
    });

    const revenueSvg = revenueChartRef.current?.querySelector("svg");
    const expenseSvg = expenseChartRef.current?.querySelector("svg");
    const revenueImage = await getSvgDataUrl(revenueSvg).catch(() => null);
    const expenseImage = await getSvgDataUrl(expenseSvg).catch(() => null);

    if (revenueImage) {
      if (currentY + 190 > 820) {
        doc.addPage();
        currentY = 40;
      }
      doc.addImage(revenueImage, "PNG", 40, currentY, 520, 180);
      currentY += 190;
    }

    if (expenseImage) {
      if (currentY + 190 > 820) {
        doc.addPage();
        currentY = 40;
      }
      doc.addImage(expenseImage, "PNG", 40, currentY, 520, 180);
      currentY += 190;
    }

    return doc;
  };

  const exportPdf = async () => {
    try {
      const doc = await createReportPdf();
      doc.save(`finance-report-${reportRange}.pdf`);
      setReportMessage("Report exported as PDF.");
      setReportError("");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      setReportError("Unable to generate PDF report with charts.");
    }
  };

  const handleSendToSuperadmin = async () => {
    setReportError("");
    setReportMessage("");
    setIsSendingReport(true);

    try {
      const superadminEmails = users
        .filter((user) => user.role === "superadmin")
        .map((user) => user.email)
        .filter(Boolean);

      if (!superadminEmails.length) {
        throw new Error("No superadmin email addresses found.");
      }

      const doc = await createReportPdf();
      const pdfBase64 = doc.output("datauristring");
      const subject = `Periodic Finance Report (${reportRange.replace(
        /_/g,
        " "
      )})`;
      const body = `A finance report has been generated for the selected range.\n\nTotal Revenue: $${reportStats.totalRevenue.toLocaleString()}\nTotal Expenses: $${reportStats.totalExpenses.toLocaleString()}\nNet Profit: $${reportStats.profit.toLocaleString()}\nProfit Margin: ${
        reportStats.profitMargin
      }%`;

      await Promise.all(
        superadminEmails.map((to_email) =>
          sendEmail({
            to_email,
            subject,
            body,
            attachment_base64: pdfBase64,
            filename: `finance-report-${reportRange}.pdf`,
          })
        )
      );

      setReportMessage(
        `Report sent to superadmin (${superadminEmails.join(", ")}).`
      );
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to send report.";
      setReportError(detail);
      console.error(err);
    } finally {
      setIsSendingReport(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pData, eData] = await Promise.all([
          fetchPayments(),
          fetchExpenses(),
        ]);
        setPayments(pData || []);
        setExpenses(eData || []);
      } catch (err) {
        console.error("Failed to load financial data:", err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Financial Overview
        </button>
        <button
          onClick={() => setActiveTab("payroll")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "payroll"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Payroll Management
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Financial Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generate periodic financial reports for superadmin review.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Report period</span>
              </div>
              <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
                {reportRanges.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReportRange(option.value)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      reportRange === option.value
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={exportCsv} className="gap-2">
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="ghost" onClick={exportPdf} className="gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
              {role === "finance" && (
                <Button
                  variant="primary"
                  onClick={handleSendToSuperadmin}
                  disabled={isSendingReport}
                  className="gap-2"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {isSendingReport ? "Sending..." : "Send to Superadmin"}
                </Button>
              )}
            </div>
          </div>

          {(reportMessage || reportError) && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              {reportMessage && (
                <p className="text-emerald-600">{reportMessage}</p>
              )}
              {reportError && <p className="text-rose-500">{reportError}</p>}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Total Revenue"
              value={`$${reportStats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              hint="Total payments received"
            />
            <Card
              title="Total Expenses"
              value={`$${reportStats.totalExpenses.toLocaleString()}`}
              icon={TrendingDown}
              hint="Operating costs"
            />
            <Card
              title="Net Profit"
              value={`$${reportStats.profit.toLocaleString()}`}
              icon={TrendingUp}
              hint="Revenue minus expenses"
            />
            <Card
              title="Profit Margin"
              value={`${reportStats.profitMargin}%`}
              icon={Landmark}
              hint="Efficiency ratio"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Revenue vs Expenses (Monthly)">
              <div ref={revenueChartRef} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportStats.monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#94a3b8"
                      strokeOpacity={0.1}
                    />
                    <XAxis dataKey="displayMonth" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="revenue"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                    <Bar
                      dataKey="expenses"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      name="Expenses"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Expense Distribution by Type">
              <div ref={expenseChartRef} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportStats.expenseDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                    >
                      {reportStats.expenseDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {reportStats.expenseDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {item.name} (${item.value.toLocaleString()})
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* Payroll Tab */}
      {activeTab === "payroll" && <PayrollGenerator />}
    </div>
  );
}
