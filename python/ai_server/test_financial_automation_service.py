import json
import os
import tempfile
import unittest
import gc

from financial_automation_service import FinancialAutomationService


class FakeClient:
    def __init__(self):
        self.bookings = []
        self.expenses = []
        self.journals = []
        self.invoices = {}
        self.services = {}
        self.fail_journal = False

    def secure_get(self, entity_type, entity_id=None, filters=None, order_by=None, top=None):
        if entity_type == "invoices":
            if entity_id:
                invoice = self.invoices.get(entity_id)
                return [invoice] if invoice else []
            return list(self.invoices.values())
        if entity_type == "services":
            service = self.services.get(entity_id)
            return [service] if service else []
        if entity_type == "bookings":
            if filters:
                invoice_no = filters[0].split("'")[1]
                return [b for b in self.bookings if b.get("sourceInvoiceNo") == invoice_no]
            return self.bookings
        if entity_type == "expenses":
            if filters:
                automation_key = filters[0].split("'")[1]
                return [e for e in self.expenses if e.get("automationKey") == automation_key]
            return self.expenses
        return []

    def secure_create(self, entity_type, payload, id_field=None):
        payload = dict(payload)
        if entity_type == "bookings":
            self.bookings.append(payload)
            return payload
        if entity_type == "expenses":
            self.expenses.append(payload)
            return payload
        if entity_type == "payments":
            return payload
        raise AssertionError(f"Unexpected create entity: {entity_type}")

    def secure_post(self, entity_type, payload):
        if entity_type != "journal_lines":
            raise AssertionError(f"Unexpected post entity: {entity_type}")
        if self.fail_journal:
            raise RuntimeError("Journal posting failed")
        payload = dict(payload)
        self.journals.append(payload)
        return payload

    def secure_update(self, entity_type, entity_id, payload, use_etag=True):
        if entity_type != "expenses":
            raise AssertionError(f"Unexpected update entity: {entity_type}")
        for expense in self.expenses:
            if expense.get("expenseId") == entity_id:
                expense.update(payload)
                return expense
        raise AssertionError("Expense not found for update")

    def secure_delete(self, entity_type, entity_id):
        if entity_type != "expenses":
            raise AssertionError(f"Unexpected delete entity: {entity_type}")
        before = len(self.expenses)
        self.expenses = [e for e in self.expenses if e.get("expenseId") != entity_id]
        return len(self.expenses) != before


class FinancialAutomationServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test.sqlite")
        self.agencies_file = os.path.join(self.temp_dir.name, "agencies.json")
        with open(self.agencies_file, "w", encoding="utf-8") as handle:
            json.dump(
                [
                    {
                        "agency_id": "AG-001",
                        "name": "Smart Travel Agency",
                        "owner_id": "OWNER-001",
                    }
                ],
                handle,
            )
        self.service = FinancialAutomationService(
            db_path=self.db_path,
            agencies_file=self.agencies_file,
        )
        self.client = FakeClient()
        self.client.services["SVC-001"] = {
            "code": "SVC-001",
            "agency_code": "AG-001",
            "price": 1500,
        }

    def tearDown(self):
        self.service = None
        gc.collect()
        self.temp_dir.cleanup()

    def test_partial_payment_over_threshold_creates_booking_only(self):
        invoice = {
            "invoiceNo": "INV-001",
            "clientNo": "CL-001",
            "status": "Partial",
            "totalAmount": 1000,
            "amountPaid": 500,
            "Agency_Code": "AG-001",
            "agent_code": "USR-1",
        }

        result = self.service.process_invoice(self.client, invoice, trigger_source="test")

        self.assertEqual(result["booking"]["status"], "created")
        self.assertEqual(result["providerPayout"]["status"], "not_applicable")
        self.assertEqual(result["agentCommission"]["status"], "not_applicable")
        self.assertEqual(len(self.client.bookings), 1)
        self.assertEqual(self.client.bookings[0]["sourceInvoiceNo"], "INV-001")

    def test_fully_paid_invoice_creates_payout_and_commission_once(self):
        invoice = {
            "invoiceNo": "INV-002",
            "clientNo": "CL-001",
            "serviceCode": "SVC-001",
            "status": "Fully Paid",
            "totalAmount": 2000,
            "amountPaid": 2000,
            "Agency_Code": "AG-001",
            "agent_code": "USR-200",
        }

        first = self.service.process_invoice(self.client, invoice, trigger_source="test")
        second = self.service.process_invoice(self.client, invoice, trigger_source="test")

        self.assertEqual(first["providerPayout"]["status"], "created")
        self.assertEqual(first["agentCommission"]["status"], "created")
        self.assertEqual(second["providerPayout"]["status"], "skipped")
        self.assertEqual(second["agentCommission"]["status"], "skipped")
        self.assertEqual(len(self.client.expenses), 2)
        self.assertEqual(len(self.client.journals), 2)
        expense_types = {e["expenseType"] for e in self.client.expenses}
        self.assertEqual(expense_types, {"Provider Payout", "Agent Commission"})
        commission = next(e for e in self.client.expenses if e["expenseType"] == "Agent Commission")
        self.assertTrue(commission["isDeductible"])
        self.assertEqual(commission["status"], "Posted")

    def test_failed_journal_rolls_back_expense(self):
        self.client.fail_journal = True
        invoice = {
            "invoiceNo": "INV-003",
            "clientNo": "CL-001",
            "serviceCode": "SVC-001",
            "status": "Fully Paid",
            "totalAmount": 1200,
            "amountPaid": 1200,
            "Agency_Code": "AG-001",
            "agent_code": "USR-300",
        }

        result = self.service.process_invoice(self.client, invoice, trigger_source="test")

        self.assertEqual(result["providerPayout"]["status"], "failed")
        self.assertEqual(result["providerPayout"]["rollback"], "rolled_back")
        self.assertEqual(result["agentCommission"]["status"], "failed")
        self.assertEqual(result["agentCommission"]["rollback"], "rolled_back")
        self.assertEqual(self.client.expenses, [])
        logs = self.service.get_recent_logs(limit=10)
        self.assertTrue(any(log["status"] == "failed" for log in logs))


if __name__ == "__main__":
    unittest.main()
