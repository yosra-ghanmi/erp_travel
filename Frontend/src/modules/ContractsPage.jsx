import { useState, useRef } from "react";
import { Plus, Trash2, FileText, Upload, Download, Eye } from "lucide-react";
import {
  Button,
  DataTable,
  Input,
  Panel,
  StatusBadge,
  Modal,
  Select,
} from "../components/ui";

const initialContracts = [
  {
    id: "CON-001",
    employee: "Amina Atlas",
    type: "Full-time",
    expiryDate: "2027-12-31",
    status: "active",
    fileName: "amina_contract.pdf",
  },
  {
    id: "CON-002",
    employee: "Rayan Agent",
    type: "Contractor",
    expiryDate: "2026-06-15",
    status: "active",
    fileName: "rayan_contract.pdf",
  },
  {
    id: "CON-003",
    employee: "Salma Finance",
    type: "Full-time",
    expiryDate: "2028-01-10",
    status: "active",
    fileName: "salma_contract.pdf",
  },
];

export function ContractsPage({ searchQuery }) {
  const [contracts, setContracts] = useState(initialContracts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [form, setForm] = useState({
    employee: "",
    type: "Full-time",
    expiryDate: "",
    salary: "",
  });
  const fileInputRef = useRef(null);

  const filteredContracts = contracts.filter(
    (c) =>
      !searchQuery ||
      c.employee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = () => {
    if (!form.employee || !form.expiryDate) return;
    const newContract = {
      id: `CON-${String(contracts.length + 1).padStart(3, "0")}`,
      ...form,
      status: "active",
      fileName: `${form.employee.toLowerCase().replace(" ", "_")}_contract.pdf`,
    };
    setContracts((prev) => [...prev, newContract]);
    setIsModalOpen(false);
    setForm({ employee: "", type: "Full-time", expiryDate: "", salary: "" });
    alert(
      `Contract generated for ${form.employee}. You can now download the PDF.`
    );
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate import
    const newContract = {
      id: `CON-${String(contracts.length + 1).padStart(3, "0")}`,
      employee: file.name.split("_")[0] || "Unknown Employee",
      type: "Imported",
      expiryDate: new Date(Date.now() + 365 * 86400000)
        .toISOString()
        .split("T")[0],
      status: "active",
      fileName: file.name,
    };
    setContracts((prev) => [...prev, newContract]);
    setIsImportModalOpen(false);
    alert(`Successfully imported ${file.name}`);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this contract?")) {
      setContracts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Contracts
        </h2>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import PDF
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generate Contract
          </Button>
        </div>
      </div>

      <Panel title="Employee Contracts">
        <DataTable
          headers={[
            "Employee",
            "Contract Type",
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
                  <span className="font-medium">{contract.employee}</span>
                </div>
              </td>
              <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                {contract.type}
              </td>
              <td className="px-2 py-3 text-slate-600 dark:text-slate-400">
                {contract.expiryDate}
              </td>
              <td className="px-2 py-3">
                <StatusBadge value={contract.status} />
              </td>
              <td className="px-2 py-3">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" title="View PDF">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Download">
                    <Download className="h-3 w-3" />
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

      {/* Generate Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate New Contract"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Employee Name
            </label>
            <Input
              placeholder="e.g. John Doe"
              value={form.employee}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, employee: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Contract Type
            </label>
            <Select
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contractor">Contractor</option>
              <option value="Internship">Internship</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Monthly Salary
              </label>
              <Input
                type="number"
                placeholder="3000"
                value={form.salary}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, salary: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Expiry Date
              </label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate & Sign</Button>
          </div>
        </div>
      </Modal>

      {/* Import PDF Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Signed Contract"
      >
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
            <Upload className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-400">PDF files only (max 10MB)</p>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => fileInputRef.current.click()}
            >
              Select File
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
