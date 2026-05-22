import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Play,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/authCore";
import { Card, Panel, Button, DataTable, StatusBadge } from "../components/ui";
import {
  generateMonthlyPayroll,
  fetchPayrollEntries,
  fetchPayrollSummary,
  postPayroll,
} from "../services/erpApi";

const ITEMS_PER_PAGE = 10;

export function PayrollGenerator() {
  const { role } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [payrollEntries, setPayrollEntries] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [isGenerating, isGeneratingSet] = useState(false);
  const [isPosting, isPostingSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Format date for input
  const monthValue = useMemo(() => {
    return selectedMonth.toISOString().split("T")[0].slice(0, 7);
  }, [selectedMonth]);

  const monthLabel = useMemo(() => {
    return selectedMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth]);

  // Load payroll entries when month or page changes
  useEffect(() => {
    const loadPayrollData = async () => {
      if (!selectedMonth) return;
      setIsLoading(true);
      setError("");
      try {
        const [entries, summary] = await Promise.all([
          fetchPayrollEntries(
            selectedMonth.toISOString().split("T")[0],
            currentPage,
            ITEMS_PER_PAGE
          ),
          fetchPayrollSummary(selectedMonth.toISOString().split("T")[0]),
        ]);
        setPayrollEntries(entries.entries || []);
        setPayrollSummary(summary);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load payroll data");
        setPayrollEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayrollData();
  }, [selectedMonth, currentPage]);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split("-");
    setSelectedMonth(new Date(year, parseInt(month) - 1, 1));
    setCurrentPage(1);
  };

  const handleGeneratePayroll = async () => {
    if (role !== "HR" && role !== "Admin") {
      setError("Only HR Manager or Admin can generate payroll");
      return;
    }

    isGeneratingSet(true);
    setError("");
    setSuccess("");

    try {
      const result = await generateMonthlyPayroll(
        selectedMonth.toISOString().split("T")[0]
      );
      setSuccess(
        `Payroll generated successfully for ${result.entries_created} employees.`
      );

      // Reload payroll data
      const entries = await fetchPayrollEntries(
        selectedMonth.toISOString().split("T")[0],
        1,
        ITEMS_PER_PAGE
      );
      const summary = await fetchPayrollSummary(
        selectedMonth.toISOString().split("T")[0]
      );
      setPayrollEntries(entries.entries || []);
      setPayrollSummary(summary);
      setCurrentPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate payroll");
    } finally {
      isGeneratingSet(false);
    }
  };

  const handlePostPayroll = async () => {
    if (role !== "HR" && role !== "Admin") {
      setError("Only HR Manager or Admin can post payroll");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to post this payroll to the general ledger? This action cannot be undone."
      )
    ) {
      return;
    }

    isPostingSet(true);
    setError("");
    setSuccess("");

    try {
      await postPayroll(selectedMonth.toISOString().split("T")[0]);
      setSuccess("Payroll posted successfully to the general ledger.");

      // Reload payroll data
      const entries = await fetchPayrollEntries(
        selectedMonth.toISOString().split("T")[0],
        currentPage,
        ITEMS_PER_PAGE
      );
      const summary = await fetchPayrollSummary(
        selectedMonth.toISOString().split("T")[0]
      );
      setPayrollEntries(entries.entries || []);
      setPayrollSummary(summary);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post payroll");
    } finally {
      isPostingSet(false);
    }
  };

  const handleExportCSV = () => {
    if (payrollEntries.length === 0) {
      setError("No payroll data to export");
      return;
    }

    const headers = [
      "Employee No.",
      "Employee Name",
      "Job Title",
      "Base Salary",
      "Commission",
      "Gross Salary",
      "Tax Deduction",
      "Other Deductions",
      "Net Salary",
      "Status",
    ];

    const rows = payrollEntries.map((entry) => [
      entry.employeeNo || "",
      entry.employeeName || "",
      entry.jobTitle || "",
      entry.baseSalary?.toFixed(2) || "0.00",
      entry.totalCommission?.toFixed(2) || "0.00",
      entry.grossSalary?.toFixed(2) || "0.00",
      entry.taxDeduction?.toFixed(2) || "0.00",
      entry.otherDeductions?.toFixed(2) || "0.00",
      entry.netSalary?.toFixed(2) || "0.00",
      entry.status || "",
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute(
      "download",
      `Payroll_${monthLabel.replace(" ", "_")}.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const paginationInfo = useMemo(() => {
    if (!payrollSummary) return { total: 0, pages: 0 };
    const total = payrollSummary.total_entries || 0;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    return { total, pages };
  }, [payrollSummary]);

  const isPayrollGenerated = payrollEntries.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Payroll Generation
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate monthly payroll for all active employees. Select a month,
          click Generate Payroll, review the summary, and post to the general
          ledger.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900 dark:text-red-200">
              {error}
            </h3>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-green-900 dark:text-green-200">
              {success}
            </h3>
          </div>
        </div>
      )}

      {/* Month Selection and Generate Button */}
      <Panel>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Month
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-400" />
              <input
                type="month"
                value={monthValue}
                onChange={handleMonthChange}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Current selection: {monthLabel}
            </p>
          </div>

          <Button
            onClick={handleGeneratePayroll}
            disabled={
              isGenerating ||
              isLoading ||
              !role ||
              (role !== "HR" && role !== "Admin")
            }
            className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate Payroll
              </>
            )}
          </Button>
        </div>
      </Panel>

      {/* Summary Cards */}
      {payrollSummary && isPayrollGenerated && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Total Employees"
            value={paginationInfo.total}
            hint="Active employees in payroll"
            icon={() => <span className="text-2xl">👥</span>}
          />
          <Card
            title="Total Gross Salary"
            value={
              `${payrollSummary.total_gross?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} DT` || "0.00 DT"
            }
            hint="Gross salary for all employees"
            icon={() => <span className="text-2xl">💰</span>}
          />
          <Card
            title="Total Deductions"
            value={
              `${payrollSummary.total_deductions?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} DT` || "0.00 DT"
            }
            hint="Taxes and other deductions"
            icon={() => <span className="text-2xl">📊</span>}
          />
          <Card
            title="Total Net Salary"
            value={
              `${payrollSummary.total_net?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} DT` || "0.00 DT"
            }
            hint="Amount to be paid"
            icon={() => <span className="text-2xl">✓</span>}
          />
        </div>
      )}

      {/* Payroll Entries Table */}
      {isPayrollGenerated && (
        <Panel title={`Payroll Details - ${monthLabel}`}>
          <div className="space-y-4">
            <DataTable
              headers={[
                "Employee No.",
                "Employee Name",
                "Base Pay",
                "Commission",
                "Gross Salary",
                "Deductions",
                "Net Amount",
                "Status",
              ]}
              rows={
                isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-2 py-8 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : payrollEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-2 py-8 text-center text-slate-500"
                    >
                      No payroll entries found
                    </td>
                  </tr>
                ) : (
                  payrollEntries.map((entry) => (
                    <tr
                      key={entry.entryNo}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-2 py-3 text-sm font-medium">
                        {entry.employeeNo}
                      </td>
                      <td className="px-2 py-3 text-sm">
                        {entry.employeeName}
                      </td>
                      <td className="px-2 py-3 text-sm">
                        {entry.baseSalary?.toFixed(2)} DT
                      </td>
                      <td className="px-2 py-3 text-sm">
                        {entry.totalCommission?.toFixed(2)} DT
                      </td>
                      <td className="px-2 py-3 text-sm font-semibold">
                        {entry.grossSalary?.toFixed(2)} DT
                      </td>
                      <td className="px-2 py-3 text-sm">
                        {(
                          entry.taxDeduction + (entry.otherDeductions || 0)
                        ).toFixed(2)}{" "}
                        DT
                      </td>
                      <td className="px-2 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                        {entry.netSalary?.toFixed(2)} DT
                      </td>
                      <td className="px-2 py-3 text-sm">
                        <StatusBadge value={entry.status} />
                      </td>
                    </tr>
                  ))
                )
              }
            />

            {/* Pagination */}
            {paginationInfo.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Page {currentPage} of {paginationInfo.pages} (
                  {paginationInfo.total} entries)
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1 text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(paginationInfo.pages, currentPage + 1)
                      )
                    }
                    disabled={currentPage === paginationInfo.pages}
                    className="flex items-center gap-1 px-3 py-1 text-sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Action Buttons */}
      {isPayrollGenerated && (
        <Panel>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportCSV}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
            >
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
            <Button
              onClick={handlePostPayroll}
              disabled={isPosting || !isPayrollGenerated}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPosting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Post to General Ledger
                </>
              )}
            </Button>
          </div>
        </Panel>
      )}

      {/* Empty State */}
      {!isPayrollGenerated && !isLoading && (
        <Panel>
          <div className="py-12 text-center">
            <Calendar className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              No Payroll Generated
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Select a month and click "Generate Payroll" to create payroll
              entries for all active employees.
            </p>
            {role && (role === "HR" || role === "Admin") && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                You have permission to generate payroll.
              </p>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
