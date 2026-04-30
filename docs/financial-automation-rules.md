# Financial Automation Rules

## Scope
- Converts invoices to bookings when paid amount reaches at least 50% of invoice total.
- Creates provider payout expenses equal to 85% of fully paid invoice totals.
- Creates deductible agent commission expenses equal to 5% of fully paid invoices above 1000.
- Posts matching journal lines for automated expenses.
- Stores processing state and transaction logs in `python/ai_server/navigo.sqlite`.

## Booking Conversion
- Trigger: invoice payment status change or manual automation sync.
- Threshold: `amountPaid / totalAmount >= 0.50`.
- Expected result: booking exists with:
  - `bookingCategory = Invoice Conversion`
  - `sourceInvoiceNo = <invoiceNo>`
  - `automationReference = AUTO-INVOICE-50PCT`
- Business Central remains the primary source for threshold-triggered booking creation.
- The Python automation layer verifies the audit trail and creates a fallback booking only when required.

## Provider Payout
- Trigger: invoice status is `Paid` or `Fully Paid`.
- Amount: `totalAmount * 0.85`.
- Recipient: service-owning agency owner when available, otherwise agency code or service code fallback.
- Expense classification: `Provider Payout`.
- Journal posting:
  - Expense account: `70100`
  - Balancing account: `2910`

## Agent Commission
- Trigger: invoice status is `Paid` or `Fully Paid` and `totalAmount > 1000`.
- Amount: `totalAmount * 0.05`.
- Recipient: `agent_code` stored on the invoice.
- Expense classification: `Agent Commission`.
- Deductibility: `isDeductible = true`.
- Journal posting:
  - Expense account: `70200`
  - Balancing account: `2910`

## Duplicate Prevention
- Each automated operation uses a deterministic automation key:
  - `booking:<invoiceNo>`
  - `expense:<invoiceNo>:provider_payout`
  - `expense:<invoiceNo>:agent_commission`
- Keys are persisted in `financial_processing_state`.
- Existing BC bookings and BC expenses are checked before a new write is attempted.

## Error Handling And Rollback
- If expense creation succeeds but journal posting fails, the created BC expense is deleted.
- Failure events are logged with rollback status in `financial_transaction_logs`.
- Payment creation is not rolled back if downstream automation fails; only the automation unit is rolled back.

## Operational Entry Points
- Payment API: `POST /api/payments`
- Manual resync: `POST /api/expenses/sync-invoices`
- Webhook trigger: `POST /api/bc-webhook`
- Log review: `GET /api/financial-automation/logs`

## Coverage Command
- Install dependencies: `pip install -r python/ai_server/requirements.txt`
- Run tests: `python -m unittest python/ai_server/test_financial_automation_service.py`
- Run coverage:

```bash
coverage run -m unittest python/ai_server/test_financial_automation_service.py
coverage report -m
```
