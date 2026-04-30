# Financial Automation Deployment And Rollback

## Deployment Checklist
- Publish the updated AL extension containing booking, invoice, and expense API changes.
- Restart the Python API service after deploying backend code.
- Install updated Python dependencies:

```bash
pip install -r python/ai_server/requirements.txt
```

- Verify these endpoints return successfully:
  - `GET /health`
  - `GET /api/invoices`
  - `GET /api/bookings`
  - `GET /api/expenses`
  - `GET /api/financial-automation/logs`
- Execute:

```bash
python -m unittest python/ai_server/test_financial_automation_service.py
```

- Run one controlled validation scenario:
  - Create a test invoice.
  - Register a 50% payment and verify booking conversion.
  - Register final payment and verify expense + journal posting.

## Rollback Procedure
- Stop the Python API service.
- Re-deploy the previous backend package or revert the modified files.
- Re-publish the prior AL extension package if the new BC fields must be removed.
- Restore `python/ai_server/navigo.sqlite` from backup if audit log continuity is required.
- Re-run smoke checks against invoices, bookings, payments, and expenses.

## Data Rollback Notes
- Automated expense rollback is transactional per operation only.
- If a payment already posted and downstream automation failed, do not delete the payment record.
- Instead:
  - review `financial_transaction_logs`
  - correct the root cause
  - rerun `POST /api/expenses/sync-invoices`

## Post-Deployment Validation
- Confirm new bookings display `Booking Category` and `Source Invoice`.
- Confirm new expenses include `sourceInvoiceId`, `recipientId`, `automationKey`, and `ledgerPostingStatus`.
- Confirm journal lines are created in the `GENERAL/AUTOFIN` batch.
- Confirm duplicate sync runs do not create duplicate bookings or expenses.
