import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Edit2, FileText } from "lucide-react";
import {
  Button,
  Card,
  DataTable,
  Panel,
  StatusBadge,
  Modal,
  Select,
  Input,
} from "../components/ui";
import {
  createContract,
  updateContract,
  deleteContract,
  fetchStaff,
} from "../services/erpApi";

const blankForm = {
  employeeNo: "",
  startDate: "",
  endDate: "",
  status: "Draft",
};

const normalizeContractRecord = (contract) => ({
  ...contract,
  id:
    contract.contractNo ??
    contract.contractno ??
    contract.id ??
    `CT-${Date.now()}`,
  contractNo:
    contract.contractNo ??
    contract.contractno ??
    contract.id ??
    `CT-${Date.now()}`,
  employeeNo:
    contract.employeeNo ?? contract.employeeno ?? contract.staffId ?? "",
  startDate: contract.startDate ?? contract.startdate ?? "",
  endDate: contract.endDate ?? contract.enddate ?? contract.expiryDate ?? "",
  expiryDate: contract.endDate ?? contract.enddate ?? contract.expiryDate ?? "",
  status: String(contract.status ?? "draft").toLowerCase(),
});

const toContractStatusLabel = (status) => {
  const normalized = String(status ?? "Draft").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const LICENSE_ALLOWED_MONTHS = new Set([1, 2, 11, 12]);
const LICENSE_MONTHS_MESSAGE =
  "Business Central allows contract dates only in January, February, November, or December.";

const isAllowedContractDate = (dateValue) => {
  if (!dateValue) return true;
  const month = new Date(dateValue).getMonth() + 1;
  return LICENSE_ALLOWED_MONTHS.has(month);
};

const getContractValidationMessage = (form) => {
  if (!form.employeeNo || !form.startDate) {
    return "Employee and start date are required.";
  }
  if (form.endDate && form.endDate < form.startDate) {
    return "Expiry date must be on or after the start date.";
  }
  if (
    !isAllowedContractDate(form.startDate) ||
    !isAllowedContractDate(form.endDate)
  ) {
    return LICENSE_MONTHS_MESSAGE;
  }
  return "";
};

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.detail || error?.message || fallbackMessage;

const normalizeStaffMember = (member) => {
  const employeeNo = member.no ?? member.employeeNo ?? member.id ?? "";
  const firstName = member.firstname ?? member.firstName ?? "";
  const lastName = member.lastname ?? member.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: employeeNo,
    label: fullName || member.fullname || member.fullName || employeeNo,
  };
};

const normalizeUserMember = (member) => ({
  id: member.id ?? "",
  label: member.name ?? member.email ?? member.id ?? "",
});

export function ContractsPage({
  contracts = [],
  users = [],
  setContracts,
  searchQuery,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [formMessage, setFormMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bcStaff, setBcStaff] = useState([]);

  useEffect(() => {
    fetchStaff()
      .then((data) => setBcStaff(data || []))
      .catch((err) => console.error("Failed to fetch BC staff:", err));
  }, []);

  const staffOptions = useMemo(
    () => users.map(normalizeUserMember).filter((member) => member.id),
    [users]
  );

  const resolveEmployeeName = (employeeNo) => {
    const member = bcStaff.find(
      (m) => (m.no ?? m.employeeNo ?? m.id) === employeeNo
    );
    if (member) return normalizeStaffMember(member).label;
    return users.find((u) => u.id === employeeNo)?.name ?? employeeNo;
  };

  const contractStats = useMemo(() => {
    const today = new Date();
    const nextThirtyDays = new Date(today);
    nextThirtyDays.setDate(today.getDate() + 30);

    return {
      total: contracts.length,
      active: contracts.filter((contract) => contract.status === "active")
        .length,
      draft: contracts.filter((contract) => contract.status === "draft").length,
      expiringSoon: contracts.filter((contract) => {
        if (!contract.expiryDate) return false;
        const endDate = new Date(contract.expiryDate);
        return endDate >= today && endDate <= nextThirtyDays;
      }).length,
    };
  }, [contracts]);

  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus =
      statusFilter === "all" ? true : contract.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      contract.contractNo?.toLowerCase().includes(q) ||
      resolveEmployeeName(contract.employeeNo).toLowerCase().includes(q) ||
      contract.status?.toLowerCase().includes(q)
    );
  });

  const handleOpenModal = (contract = null) => {
    if (contract) {
      setEditingContract(contract);
      setForm({
        employeeNo: contract.employeeNo ?? "",
        startDate: contract.startDate ?? "",
        endDate: contract.endDate ?? contract.expiryDate ?? "",
        status: toContractStatusLabel(contract.status),
      });
    } else {
      setEditingContract(null);
      setForm(blankForm);
    }
    setFormMessage("");
    setIsModalOpen(true);
  };

  const handleDateChange = (field, value) => {
    if (!value || isAllowedContractDate(value)) {
      setForm((prev) => ({ ...prev, [field]: value }));
      setFormMessage("");
      return;
    }
    setFormMessage(LICENSE_MONTHS_MESSAGE);
  };

  const handleSave = async () => {
    const validationMessage = getContractValidationMessage(form);
    if (validationMessage) {
      setFormMessage(validationMessage);
      return;
    }
    setFormMessage("");
    setIsLoading(true);

    try {
      const payload = {
        contractNo:
          editingContract?.contractNo ??
          `CT-${Date.now().toString().slice(-8)}`,
        employeeNo: form.employeeNo,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      };

      if (editingContract) {
        const result = await updateContract(editingContract.id, payload);
        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === editingContract.id
              ? normalizeContractRecord(result)
              : contract
          )
        );
      } else {
        const result = await createContract(payload);
        setContracts((prev) => [...prev, normalizeContractRecord(result)]);
      }

      setIsModalOpen(false);
      setForm(blankForm);
      setFormMessage("");
    } catch (error) {
      console.error("Failed to save contract:", error);
      alert(getErrorMessage(error, "Failed to save contract."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contract?")) {
      try {
        await deleteContract(id);
        setContracts((prev) => prev.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Failed to delete contract:", error);
        alert("Failed to delete contract.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Contracts
        </h2>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
          disabled={staffOptions.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add Contract
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Contracts"
          value={contractStats.total}
          hint="All employee contracts"
          icon={FileText}
        />
        <Card
          title="Active"
          value={contractStats.active}
          hint="Currently in force"
          icon={FileText}
        />
        <Card
          title="Draft"
          value={contractStats.draft}
          hint="Pending activation"
          icon={Edit2}
        />
        <Card
          title="Expiring Soon"
          value={contractStats.expiringSoon}
          hint="Ending within 30 days"
          icon={Trash2}
        />
      </div>

      <Panel
        title="Employee Contracts"
        right={
          <Select
            className="min-w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </Select>
        }
      >
        <DataTable
          headers={[
            "Contract No",
            "Employee",
            "Start Date",
            "Expiry Date",
            "Status",
            "Actions",
          ]}
          rows={filteredContracts.map((contract) => (
            <tr
              key={contract.id}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{contract.contractNo}</span>
                </div>
              </td>
              <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                {resolveEmployeeName(contract.employeeNo)}
              </td>
              <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                {contract.startDate}
              </td>
              <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                {contract.expiryDate}
              </td>
              <td className="px-2 py-3">
                <StatusBadge value={contract.status} />
              </td>
              <td className="px-2 py-3">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Edit"
                    onClick={() => handleOpenModal(contract)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(contract.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        />
      </Panel>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingContract ? "Edit Contract" : "Create Contract"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Employee
            </label>
            <Select
              value={form.employeeNo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, employeeNo: e.target.value }))
              }
            >
              <option value="">Select employee</option>
              {staffOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Start Date
              </label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Expiry Date
              </label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Allowed months: January, February, November, December.
          </p>
          {formMessage ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">
              {formMessage}
            </p>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <Select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : editingContract
                ? "Update Contract"
                : "Create Contract"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
