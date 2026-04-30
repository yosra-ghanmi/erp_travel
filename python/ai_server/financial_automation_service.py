import json
import logging
import os
import sqlite3
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Tuple

from models import Expense, ExpenseType, TravelInvoice

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "navigo.sqlite")
AGENCIES_FILE = os.path.join(BASE_DIR, "agencies.json")


class FinancialAutomationService:
    PROVIDER_PAYOUT_GL = "70100"
    AGENT_COMMISSION_GL = "70200"
    ACCRUAL_GL = "2910"

    def __init__(self, db_path: Optional[str] = None, agencies_file: Optional[str] = None):
        self.db_path = db_path or DB_PATH
        self.agencies_file = agencies_file or AGENCIES_FILE
        self.ensure_tables()

    def ensure_tables(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS financial_processing_state (
                    operation_key TEXT PRIMARY KEY,
                    invoice_no TEXT NOT NULL,
                    operation_type TEXT NOT NULL,
                    entity_id TEXT,
                    status TEXT NOT NULL,
                    message TEXT,
                    payload_json TEXT,
                    processed_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS financial_transaction_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_time TEXT NOT NULL,
                    invoice_no TEXT,
                    operation_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    trigger_source TEXT NOT NULL,
                    entity_id TEXT,
                    message TEXT,
                    details_json TEXT
                )
                """
            )
            conn.commit()

    def _load_agencies(self) -> List[Dict]:
        if not os.path.exists(self.agencies_file):
            return []
        try:
            with open(self.agencies_file, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception as exc:
            logger.warning(f"Failed to load agencies file: {exc}")
            return []

    def _lookup_agency_owner(self, agency_code: Optional[str]) -> Optional[str]:
        if not agency_code:
            return None
        for agency in self._load_agencies():
            if agency.get("agency_id") == agency_code or agency.get("id") == agency_code:
                return agency.get("owner_id")
        return None

    def _read_state(self, operation_key: str) -> Optional[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM financial_processing_state WHERE operation_key = ?",
                (operation_key,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def _upsert_state(
        self,
        operation_key: str,
        invoice_no: str,
        operation_type: str,
        status: str,
        entity_id: Optional[str] = None,
        message: str = "",
        payload: Optional[Dict] = None,
    ) -> None:
        now = datetime.utcnow().isoformat()
        payload_json = json.dumps(payload or {}, default=str)
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO financial_processing_state
                    (operation_key, invoice_no, operation_type, entity_id, status, message, payload_json, processed_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(operation_key) DO UPDATE SET
                    entity_id = excluded.entity_id,
                    status = excluded.status,
                    message = excluded.message,
                    payload_json = excluded.payload_json,
                    updated_at = excluded.updated_at
                """,
                (
                    operation_key,
                    invoice_no,
                    operation_type,
                    entity_id,
                    status,
                    message,
                    payload_json,
                    now,
                    now,
                ),
            )
            conn.commit()

    def _log(
        self,
        invoice_no: Optional[str],
        operation_type: str,
        status: str,
        trigger_source: str,
        message: str,
        entity_id: Optional[str] = None,
        details: Optional[Dict] = None,
    ) -> None:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO financial_transaction_logs
                    (event_time, invoice_no, operation_type, status, trigger_source, entity_id, message, details_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    datetime.utcnow().isoformat(),
                    invoice_no,
                    operation_type,
                    status,
                    trigger_source,
                    entity_id,
                    message,
                    json.dumps(details or {}, default=str),
                ),
            )
            conn.commit()

    def get_recent_logs(self, limit: int = 100) -> List[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM financial_transaction_logs
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            )
            return [dict(row) for row in cursor.fetchall()]

    def _is_fully_paid(self, invoice: TravelInvoice) -> bool:
        status = (invoice.status or "").strip().lower()
        return status in ("paid", "fully paid")

    def _paid_ratio(self, invoice: TravelInvoice) -> float:
        total = float(invoice.total_amount or 0)
        paid = float(invoice.amount_paid or 0)
        if total <= 0:
            return 0.0
        return paid / total

    def _find_existing_booking(self, client, invoice_no: str) -> Optional[Dict]:
        try:
            results = client.secure_get("bookings", filters=[f"sourceInvoiceNo eq '{invoice_no}'"])
            return results[0] if results else None
        except Exception:
            return None

    def _find_existing_expense(self, client, automation_key: str) -> Optional[Dict]:
        try:
            results = client.secure_get("expenses", filters=[f"automationKey eq '{automation_key}'"])
            return results[0] if results else None
        except Exception:
            return None

    def _resolve_service_owner(self, client, invoice: TravelInvoice) -> Tuple[Optional[str], Optional[str]]:
        agency_code = invoice.agency_code
        if invoice.service_code:
            try:
                service_results = client.secure_get("services", entity_id=invoice.service_code)
                if service_results:
                    service = service_results[0]
                    agency_code = service.get("agency_code") or service.get("Agency_Code") or agency_code
            except Exception as exc:
                logger.warning(f"Unable to resolve service owner for {invoice.invoice_no}: {exc}")

        owner_id = self._lookup_agency_owner(agency_code)
        recipient_id = owner_id or agency_code or invoice.service_code or "UNKNOWN_OWNER"
        return recipient_id, agency_code

    def _build_booking_payload(self, invoice: TravelInvoice) -> Dict:
        today = date.today()
        return {
            "bookingId": f"BK-AUTO-{invoice.invoice_no}",
            "clientNo": invoice.client_no,
            "tripName": f"Invoice Conversion {invoice.invoice_no}",
            "startDate": today.isoformat(),
            "endDate": (today + timedelta(days=14)).isoformat(),
            "amount": invoice.total_amount or 0,
            "notes": f"Automatically created from invoice {invoice.invoice_no} after reaching 50% payment.",
            "bookingCategory": "Invoice Conversion",
            "sourceInvoiceNo": invoice.invoice_no,
            "automationReference": "AUTO-INVOICE-50PCT",
        }

    def _ensure_booking_for_threshold(self, client, invoice: TravelInvoice, trigger_source: str) -> Dict:
        if self._paid_ratio(invoice) < 0.5 or not invoice.invoice_no:
            return {"status": "not_applicable"}

        operation_key = f"booking:{invoice.invoice_no}"
        state = self._read_state(operation_key)
        if state and state.get("status") == "success":
            return {"status": "skipped", "reason": "already_processed", "bookingId": state.get("entity_id")}

        existing = self._find_existing_booking(client, invoice.invoice_no)
        if existing:
            self._upsert_state(
                operation_key,
                invoice.invoice_no,
                "booking_conversion",
                "success",
                entity_id=existing.get("bookingid") or existing.get("bookingId"),
                message="Booking already exists for invoice threshold conversion.",
                payload=existing,
            )
            self._log(
                invoice.invoice_no,
                "booking_conversion",
                "success",
                trigger_source,
                "Booking already existed for invoice conversion.",
                entity_id=existing.get("bookingid") or existing.get("bookingId"),
                details=existing,
            )
            return {"status": "skipped", "reason": "existing_booking", "booking": existing}

        payload = self._build_booking_payload(invoice)
        created = client.secure_create("bookings", payload)
        booking_id = created.get("bookingId") or created.get("bookingid")
        self._upsert_state(
            operation_key,
            invoice.invoice_no,
            "booking_conversion",
            "success",
            entity_id=booking_id,
            message="Created booking from invoice threshold.",
            payload=created,
        )
        self._log(
            invoice.invoice_no,
            "booking_conversion",
            "success",
            trigger_source,
            "Created booking from invoice threshold.",
            entity_id=booking_id,
            details=created,
        )
        return {"status": "created", "booking": created}

    def _build_expense_payload(
        self,
        invoice: TravelInvoice,
        expense_id: str,
        expense_type: ExpenseType,
        recipient_id: str,
        amount: float,
        ledger_account_no: str,
        is_deductible: bool,
        automation_key: str,
        description: str,
        agency_code: Optional[str],
    ) -> Dict:
        expense = Expense(
            expenseId=expense_id,
            sourceInvoiceId=invoice.invoice_no,
            recipientId=recipient_id,
            expenseType=expense_type,
            amount=round(amount, 2),
            date=date.today(),
            description=description,
            status="Pending",
            documentReference=invoice.invoice_no,
            ledgerAccountNo=ledger_account_no,
            ledgerPostingStatus="Pending",
            isDeductible=is_deductible,
            automationKey=automation_key,
            agent_code=invoice.agent_code,
            Agency_Code=agency_code or invoice.agency_code,
        )
        return json.loads(expense.model_dump_json(by_alias=True))

    def _build_journal_payload(self, expense_payload: Dict) -> Dict:
        return {
            "journalTemplateName": "GENERAL",
            "journalBatchName": "AUTOFIN",
            "accountType": "G/L Account",
            "accountNo": expense_payload["ledgerAccountNo"],
            "postingDate": expense_payload["date"],
            "documentNo": expense_payload["expenseId"],
            "description": expense_payload["description"],
            "amount": expense_payload["amount"],
            "balAccountType": "G/L Account",
            "balAccountNo": self.ACCRUAL_GL,
            "Agency_Code": expense_payload.get("Agency_Code"),
        }

    def _create_expense_and_post(
        self,
        client,
        invoice: TravelInvoice,
        trigger_source: str,
        expense_type: ExpenseType,
        amount: float,
        recipient_id: str,
        ledger_account_no: str,
        is_deductible: bool,
        automation_key: str,
        description: str,
        agency_code: Optional[str],
    ) -> Dict:
        if not invoice.invoice_no or amount <= 0:
            return {"status": "not_applicable"}

        state = self._read_state(automation_key)
        if state and state.get("status") == "success":
            return {"status": "skipped", "reason": "already_processed", "expenseId": state.get("entity_id")}

        existing = self._find_existing_expense(client, automation_key)
        if existing:
            expense_id = existing.get("expenseid") or existing.get("expenseId")
            self._upsert_state(
                automation_key,
                invoice.invoice_no,
                expense_type.value.lower().replace(" ", "_"),
                "success",
                entity_id=expense_id,
                message="Expense already exists in Business Central.",
                payload=existing,
            )
            return {"status": "skipped", "reason": "existing_expense", "expense": existing}

        expense_id = f"EXP-{invoice.invoice_no}-{automation_key.split(':')[-1].upper()}"
        expense_payload = self._build_expense_payload(
            invoice=invoice,
            expense_id=expense_id,
            expense_type=expense_type,
            recipient_id=recipient_id,
            amount=amount,
            ledger_account_no=ledger_account_no,
            is_deductible=is_deductible,
            automation_key=automation_key,
            description=description,
            agency_code=agency_code,
        )

        created_expense = None
        try:
            created_expense = client.secure_create("expenses", expense_payload)
            journal_payload = self._build_journal_payload(expense_payload)
            journal_entry = client.secure_post("journal_lines", journal_payload)

            client.secure_update(
                "expenses",
                expense_id,
                {
                    "status": "Posted",
                    "ledgerPostingStatus": "Posted",
                    "ledgerAccountNo": ledger_account_no,
                    "documentReference": invoice.invoice_no,
                },
            )

            self._upsert_state(
                automation_key,
                invoice.invoice_no,
                expense_type.value.lower().replace(" ", "_"),
                "success",
                entity_id=expense_id,
                message="Expense created and journal line posted.",
                payload={"expense": created_expense, "journal": journal_entry},
            )
            self._log(
                invoice.invoice_no,
                expense_type.value.lower().replace(" ", "_"),
                "success",
                trigger_source,
                "Expense created and journal line posted.",
                entity_id=expense_id,
                details={"expense": created_expense, "journal": journal_entry},
            )
            return {"status": "created", "expense": created_expense, "journal": journal_entry}
        except Exception as exc:
            rollback_status = "not_needed"
            if created_expense:
                try:
                    client.secure_delete("expenses", expense_id)
                    rollback_status = "rolled_back"
                except Exception as rollback_exc:
                    rollback_status = f"rollback_failed: {rollback_exc}"

            self._upsert_state(
                automation_key,
                invoice.invoice_no,
                expense_type.value.lower().replace(" ", "_"),
                "failed",
                entity_id=expense_id,
                message=str(exc),
                payload={"expensePayload": expense_payload, "rollback": rollback_status},
            )
            self._log(
                invoice.invoice_no,
                expense_type.value.lower().replace(" ", "_"),
                "failed",
                trigger_source,
                str(exc),
                entity_id=expense_id,
                details={"expensePayload": expense_payload, "rollback": rollback_status},
            )
            return {"status": "failed", "error": str(exc), "rollback": rollback_status}

    def process_invoice(self, client, invoice_data: Dict, trigger_source: str = "manual") -> Dict:
        invoice = TravelInvoice(**invoice_data)
        result = {
            "invoiceNo": invoice.invoice_no,
            "booking": self._ensure_booking_for_threshold(client, invoice, trigger_source),
            "providerPayout": {"status": "not_applicable"},
            "agentCommission": {"status": "not_applicable"},
        }

        if not self._is_fully_paid(invoice):
            return result

        recipient_id, owner_agency_code = self._resolve_service_owner(client, invoice)
        result["providerPayout"] = self._create_expense_and_post(
            client=client,
            invoice=invoice,
            trigger_source=trigger_source,
            expense_type=ExpenseType.PROVIDER_PAYOUT,
            amount=(invoice.total_amount or 0) * 0.85,
            recipient_id=recipient_id,
            ledger_account_no=self.PROVIDER_PAYOUT_GL,
            is_deductible=False,
            automation_key=f"expense:{invoice.invoice_no}:provider_payout",
            description=f"85% provider payout for invoice {invoice.invoice_no}",
            agency_code=owner_agency_code or invoice.agency_code,
        )

        if invoice.agent_code and (invoice.total_amount or 0) > 1000:
            result["agentCommission"] = self._create_expense_and_post(
                client=client,
                invoice=invoice,
                trigger_source=trigger_source,
                expense_type=ExpenseType.AGENT_COMMISSION,
                amount=(invoice.total_amount or 0) * 0.05,
                recipient_id=invoice.agent_code,
                ledger_account_no=self.AGENT_COMMISSION_GL,
                is_deductible=True,
                automation_key=f"expense:{invoice.invoice_no}:agent_commission",
                description=f"5% deductible agent commission for invoice {invoice.invoice_no}",
                agency_code=invoice.agency_code,
            )

        return result

    def process_all_invoices(self, client, trigger_source: str = "manual") -> Dict:
        invoices_raw = client.secure_get("invoices")
        results = [self.process_invoice(client, inv, trigger_source=trigger_source) for inv in invoices_raw]
        return {
            "status": "success",
            "processedInvoices": len(results),
            "results": results,
        }
