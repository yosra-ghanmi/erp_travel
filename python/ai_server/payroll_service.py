import os
import json
import logging
from datetime import date, datetime
from typing import List, Dict, Optional
from models import StaffMember, SalaryExpense, Expense, ExpenseType
from secure_bc_client import SecureBCClient

logger = logging.getLogger(__name__)

# Base directory for data files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SALARIES_FILE = os.path.join(BASE_DIR, "salaries.json")
EXPENSES_FILE = os.path.join(BASE_DIR, "expenses.json")
STAFF_FILE = os.path.join(BASE_DIR, "staff.json")

class PayrollService:
    # Role-Based Fixed Salaries (Tunisian Dinar - DT)
    SALARY_RATES = {
        "Admin": 2000,
        "Finance": 1800,
        "Agent": 1500
    }
    
    # Mapping roles to G/L Accounts in Business Central (Example accounts)
    GL_ACCOUNTS = {
        "Admin": "60100",
        "Finance": "60110",
        "Agent": "60120"
    }

    @staticmethod
    def _load_salaries() -> List[Dict]:
        if not os.path.exists(SALARIES_FILE):
            return []
        try:
            with open(SALARIES_FILE, "r") as f:
                content = f.read()
                return json.loads(content) if content else []
        except Exception as e:
            logger.error(f"Error loading salaries: {e}")
            return []

    @staticmethod
    def _save_salaries(salaries: List[Dict]):
        try:
            with open(SALARIES_FILE, "w") as f:
                json.dump(salaries, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving salaries: {e}")

    @staticmethod
    def _load_expenses() -> List[Dict]:
        if not os.path.exists(EXPENSES_FILE):
            return []
        try:
            with open(EXPENSES_FILE, "r") as f:
                content = f.read()
                return json.loads(content) if content else []
        except Exception as e:
            logger.error(f"Error loading expenses: {e}")
            return []

    @staticmethod
    def _save_expenses(expenses: List[Dict]):
        try:
            with open(EXPENSES_FILE, "w") as f:
                json.dump(expenses, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving expenses: {e}")

    @classmethod
    def generate_monthly_payroll(cls, client: SecureBCClient):
        """
        Generates payroll for all active staff members.
        Logic:
        1. Check if payroll for this month already exists.
        2. Fetch active staff members (BC with local fallback).
        3. Calculate salaries based on roles.
        4. Create local expense records.
        5. Sync to BC General Journal Lines.
        """
        today = date.today()
        month_year = today.strftime("%m-%Y")
        
        logger.info(f"Starting payroll generation for {month_year}...")

        # 1. Duplication Check (Check both salaries and expenses)
        all_salaries = cls._load_salaries()
        all_expenses = cls._load_expenses()
        
        # Check if any salary for this month already exists
        salary_exists = any(s.get("monthYear") == month_year for s in all_salaries)
        # Check if any payroll expense for this month already exists in expenses.json
        expense_exists = any(e.get("expenseType") == "Staff" and month_year in (e.get("description") or "") for e in all_expenses)

        if salary_exists or expense_exists:
            logger.info(f"Payroll for {month_year} already exists in records. Skipping.")
            return {"status": "skipped", "message": f"Payroll for {month_year} already exists."}

        # 2. Fetch Active Staff (BC with local fallback)
        staff_members = []
        try:
            staff_raw = client.secure_get("staff")
            staff_members = [StaffMember(**s) for s in staff_raw]
            staff_members = [s for s in staff_members if s.active]
            logger.info(f"Fetched {len(staff_members)} active staff members from Business Central.")
        except Exception as e:
            logger.warning(f"Could not fetch staff from Business Central: {e}. Falling back to local staff.json.")
            if os.path.exists(STAFF_FILE):
                try:
                    with open(STAFF_FILE, "r") as f:
                        staff_raw = json.load(f)
                        staff_members = [StaffMember(**s) for s in staff_raw]
                        staff_members = [s for s in staff_members if s.active]
                        logger.info(f"Fetched {len(staff_members)} active staff members from local staff.json.")
                except Exception as local_err:
                    logger.error(f"Error loading local staff.json: {local_err}")
            
        if not staff_members:
            logger.error("No active staff found in BC or local fallback.")
            return {"status": "error", "message": "No active staff found for payroll generation."}

        new_salaries = []
        new_expenses = []
        
        for staff in staff_members:
            # Determine salary rate
            amount = cls.SALARY_RATES.get(staff.role, 1500)
            
            # Create Salary record
            salary = SalaryExpense(
                staffId=staff.id,
                name=staff.name,
                role=staff.role,
                amount=amount,
                currency="DT",
                paymentDate=today,
                monthYear=month_year
            )
            # Use .json() then loads() to ensure date objects are converted to strings
            new_salaries.append(json.loads(salary.json(by_alias=True)))
            
            # 3. Create Local Expense Record
            expense = Expense(
                expenseId=f"PAYROLL-{staff.id}-{month_year}",
                recipientId=staff.id,
                expenseType=ExpenseType.STAFF,
                amount=amount,
                date=today,
                description=f"Monthly Salary - {staff.role} - {month_year}",
                status="Pending"
            )
            
            # 4. Sync to BC General Journal Lines
            try:
                # Map to General Journal Line
                journal_line = {
                    "accountType": "G/L Account",
                    "accountNo": cls.GL_ACCOUNTS.get(staff.role, "60120"), # G/L account for Salaries
                    "amount": amount, # Positive for Debit (Expense)
                    "description": f"Monthly Salary - {staff.role} - {month_year}",
                    "postingDate": today.isoformat(),
                    "documentNo": f"PAY-{month_year}",
                    "balAccountType": "G/L Account",
                    "balAccountNo": "2910", # Example Accrued Salaries / Bank
                    "agency_code": staff.agency_code
                }
                client.secure_post("journal_lines", journal_line)
                logger.info(f"Synced payroll for {staff.id} to Business Central.")
                expense.status = "Synced"
            except Exception as bc_err:
                logger.error(f"Failed to sync payroll for {staff.id} to Business Central: {bc_err}")
                expense.status = "Failed"
            
            new_expenses.append(json.loads(expense.json(by_alias=True)))

        # 5. Persist locally
        if new_salaries:
            all_salaries.extend(new_salaries)
            cls._save_salaries(all_salaries)
            
            current_expenses = cls._load_expenses()
            current_expenses.extend(new_expenses)
            cls._save_expenses(current_expenses)
            
            logger.info(f"Successfully generated payroll for {len(new_salaries)} staff members.")
            return {
                "status": "success",
                "message": f"Payroll generated for {len(new_salaries)} staff members for {month_year}.",
                "month": month_year,
                "count": len(new_salaries)
            }
        else:
            logger.warning("No active staff found for payroll generation.")
            return {"status": "warning", "message": "No active staff found."}
