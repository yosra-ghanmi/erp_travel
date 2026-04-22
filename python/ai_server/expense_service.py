from typing import List, Optional
from models import Expense, ExpenseType, TravelInvoice, TravelService
from datetime import date

class ExpenseService:
    @staticmethod
    def calculate_provider_payout(service: TravelService, invoice_id: str) -> Expense:
        """
        Provider Payout (The 85% Rule):
        85% of the service price must be recorded as an "Account Payable" to the provider.
        """
        amount = (service.price or 0.0) * 0.85
        return Expense(
            source_invoice_id=invoice_id,
            recipient_id=service.code or "UNKNOWN_PROVIDER", # In a real scenario, this would be a Provider ID
            expense_type=ExpenseType.PROVIDER_PAYOUT,
            amount=amount,
            date=date.today(),
            description=f"85% Payout for service {service.name} ({service.code})",
            status="Pending"
        )

    @staticmethod
    def calculate_agent_commission(invoice: TravelInvoice, agent_id: str) -> Optional[Expense]:
        """
        Agent Commission (The 5% Rule):
        Trigger: An invoice reaches "Fully Paid" status.
        Condition: Only apply if the Invoice Total > 1000.
        Logic: Calculate 5% of the total invoice value as an expense/payout for the responsible Agent.
        """
        if invoice.status != "Paid":
            return None
        
        if (invoice.total_amount or 0.0) <= 1000:
            return None

        amount = (invoice.total_amount or 0.0) * 0.05
        return Expense(
            source_invoice_id=invoice.invoice_no,
            recipient_id=agent_id,
            expense_type=ExpenseType.AGENT_COMMISSION,
            amount=amount,
            date=date.today(),
            description=f"5% Agent Commission for Invoice {invoice.invoice_no}",
            status="Pending"
        )

    @staticmethod
    def process_invoice_payouts(invoice: TravelInvoice, services: List[TravelService]) -> List[Expense]:
        """Calculate payouts for all services in an invoice."""
        expenses = []
        for service in services:
            expense = ExpenseService.calculate_provider_payout(service, invoice.invoice_no or "UNKNOWN")
            expenses.append(expense)
        return expenses
