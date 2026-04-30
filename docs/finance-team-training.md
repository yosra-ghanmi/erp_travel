# Finance Team Training Notes

## What Changed
- Invoices that cross 50% paid are automatically tied to confirmed bookings.
- Fully paid invoices now generate provider payout expenses automatically.
- Fully paid invoices above 1000 also generate deductible agent commission expenses.
- Every automated action is logged for review.

## Daily Workflow
- Review invoice payment status in the payments screen.
- Review converted bookings in the bookings screen.
- Review generated expenses in the expenses screen.
- Review automation logs through the backend endpoint when troubleshooting is needed.

## How To Recognize Auto-Converted Bookings
- `Booking Category` shows `Invoice Conversion`.
- `Source Invoice` shows the originating invoice number.
- Booking notes indicate threshold-based creation.

## How To Recognize Automated Expenses
- `expenseType` is either `Provider Payout` or `Agent Commission`.
- `documentReference` matches the invoice number.
- `ledgerPostingStatus` indicates whether the journal line was posted.
- `isDeductible` is `true` for commission expenses.

## Reconciliation Checklist
- Confirm invoice status is `Fully Paid` before expecting automated expenses.
- Confirm invoice total is above 1000 before expecting commission.
- Confirm invoice carries `agent_code` before expecting commission attribution.
- Confirm `sourceInvoiceId` and `documentReference` match the originating invoice.

## Exception Handling
- If a payment exists but no expense was created, trigger `POST /api/expenses/sync-invoices`.
- If an expense exists with failed posting, inspect `GET /api/financial-automation/logs`.
- If a booking was not generated at 50%, verify the invoice total and payment ratio, then re-run manual sync.

## Audit Support
- Booking audit fields:
  - `bookingCategory`
  - `sourceInvoiceNo`
  - `automationReference`
- Expense audit fields:
  - `sourceInvoiceId`
  - `recipientId`
  - `documentReference`
  - `automationKey`
  - `ledgerPostingStatus`
