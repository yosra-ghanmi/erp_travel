"""
Payroll API Endpoints for HR Managers
Handles payroll generation, approval, posting, and commission management
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional, Dict
import logging
from datetime import datetime
from secure_bc_client import SecureBCClient, get_secure_bc_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payroll", tags=["payroll"])

# Mock in-memory storage for payroll data (in production, use BC or database)
PAYROLL_DATA = {}
COMMISSION_DATA = {}

class PayrollGenerator:
    """Handles payroll generation logic"""
    
    @staticmethod
    def generate_payroll(payroll_month: str, client: SecureBCClient) -> Dict:
        """
        Generate payroll for a given month.
        Calls Business Central PayrollManagement codeunit.
        """
        try:
            logger.info(f"Generating payroll for {payroll_month}")
            
            # Parse the month
            year, month = payroll_month.split("-")
            
            # Call BC PayrollManagement codeunit via API
            # This would typically call a custom BC API action endpoint
            payload = {
                "payrollMonth": payroll_month,
                "generatedBy": client.user_id,
                "generatedAt": datetime.utcnow().isoformat()
            }
            
            # In a real scenario, this would call Business Central
            # For now, we return a mock response
            result = {
                "status": "success",
                "payrollMonth": payroll_month,
                "entriesCreated": 0,
                "message": "Payroll generation triggered"
            }
            
            # Store in memory
            PAYROLL_DATA[payroll_month] = {
                "status": "generated",
                "entries": [],
                "createdAt": datetime.utcnow().isoformat()
            }
            
            return result
        except Exception as e:
            logger.error(f"Error generating payroll: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def get_payroll_entries(payroll_month: str, page: int = 1, page_size: int = 10, client: SecureBCClient = None) -> Dict:
        """
        Fetch payroll entries for a month with pagination.
        Calls BC TravelPayrollEntry API.
        """
        try:
            if payroll_month not in PAYROLL_DATA:
                return {
                    "entries": [],
                    "totalEntries": 0,
                    "currentPage": page,
                    "pageSize": page_size
                }
            
            # Mock data - in production would fetch from BC
            entries = PAYROLL_DATA[payroll_month].get("entries", [])
            
            # Apply pagination
            start = (page - 1) * page_size
            end = start + page_size
            paginated = entries[start:end]
            
            return {
                "entries": paginated,
                "totalEntries": len(entries),
                "currentPage": page,
                "pageSize": page_size
            }
        except Exception as e:
            logger.error(f"Error fetching payroll entries: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def get_payroll_summary(payroll_month: str, client: SecureBCClient = None) -> Dict:
        """
        Get summary totals for payroll month.
        """
        try:
            if payroll_month not in PAYROLL_DATA:
                return {
                    "totalGross": 0.0,
                    "totalDeductions": 0.0,
                    "totalNet": 0.0,
                    "totalEntries": 0
                }
            
            entries = PAYROLL_DATA[payroll_month].get("entries", [])
            
            total_gross = sum(float(e.get("grossSalary", 0)) for e in entries)
            total_deductions = sum(
                float(e.get("taxDeduction", 0)) + float(e.get("otherDeductions", 0))
                for e in entries
            )
            total_net = sum(float(e.get("netSalary", 0)) for e in entries)
            
            return {
                "totalGross": total_gross,
                "totalDeductions": total_deductions,
                "totalNet": total_net,
                "totalEntries": len(entries)
            }
        except Exception as e:
            logger.error(f"Error fetching payroll summary: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_payroll(
    payload: Dict,
    request: Request,
    client: SecureBCClient = Depends(get_secure_bc_client)
):
    """
    POST /api/payroll/generate
    Triggers monthly payroll generation for all active employees.
    """
    try:
        payroll_month = payload.get("payrollMonth")
        if not payroll_month:
            raise HTTPException(status_code=400, detail="payrollMonth is required")
        
        # Authorization check
        if client.user_role not in ["hr", "admin", "superadmin"]:
            raise HTTPException(status_code=403, detail="Only HR, Admin, or Superadmin can generate payroll")
        
        # Generate payroll
        result = PayrollGenerator.generate_payroll(payroll_month, client)
        
        logger.info(f"Payroll generated for {payroll_month} by {client.user_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_payroll endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entries")
async def get_payroll_entries(
    payroll_month: str,
    page: int = 1,
    page_size: int = 10,
    client: SecureBCClient = Depends(get_secure_bc_client)
):
    """
    GET /api/payroll/entries
    Fetch payroll entries for a month with pagination.
    """
    try:
        if not payroll_month:
            raise HTTPException(status_code=400, detail="payrollMonth is required")
        
        result = PayrollGenerator.get_payroll_entries(payroll_month, page, page_size, client)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payroll entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_payroll_summary(
    payroll_month: str,
    client: SecureBCClient = Depends(get_secure_bc_client)
):
    """
    GET /api/payroll/summary
    Get summary totals for payroll month.
    """
    try:
        if not payroll_month:
            raise HTTPException(status_code=400, detail="payrollMonth is required")
        
        result = PayrollGenerator.get_payroll_summary(payroll_month, client)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payroll summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/entries/{entry_no}/approve")
async def approve_payroll_entry(
    entry_no: int,
    request: Request,
    client: SecureBCClient = Depends(get_secure_bc_client)
):
    """
    PATCH /api/payroll/entries/{entryNo}/approve
    Approve a payroll entry.
    """
    try:
        # Authorization check
        if client.user_role not in ["hr", "admin", "superadmin"]:
            raise HTTPException(status_code=403, detail="Only HR, Admin, or Superadmin can approve payroll")
        
        # In production, this would call BC to approve the entry
        # For now, return a mock response
        return {
            "status": "success",
            "entryNo": entry_no,
            "message": "Payroll entry approved",
            "approvedAt": datetime.utcnow().isoformat(),
            "approvedBy": client.user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving payroll entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/post")
async def post_payroll(
    payload: Dict,
    request: Request,
    client: SecureBCClient = Depends(get_secure_bc_client)
):
    """
    POST /api/payroll/post
    Post payroll to the general ledger.
    """
    try:
        payroll_month = payload.get("payrollMonth")
        if not payroll_month:
            raise HTTPException(status_code=400, detail="payrollMonth is required")
        
        # Authorization check
        if client.user_role not in ["hr", "admin", "superadmin"]:
            raise HTTPException(status_code=403, detail="Only HR, Admin, or Superadmin can post payroll")
        
        # In production, this would call BC PayrollManagement.PostPayroll
        logger.info(f"Payroll posted for {payroll_month} by {client.user_id}")
        
        return {
            "status": "success",
            "payrollMonth": payroll_month,
            "message": "Payroll posted to general ledger",
            "postedAt": datetime.utcnow().isoformat(),
            "postedBy": client.user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error posting payroll: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_commissions(
    employee_no: Optional[str] = None,
    month: Optional[str] = None,
    client: SecureBCClient = Depends(get_secure_bc_client)
):
    """
    GET /api/commissions
    Fetch commissions for an employee in a month.
    """
    try:
        # Fetch from BC TravelCommission API
        filters = []
        if employee_no:
            filters.append(f"employeeNo eq '{employee_no}'")
        if month:
            filters.append(f"commissionDate gte '{month}-01' and commissionDate lte '{month}-31'")
        
        # In production, would call: client.secure_get("commissions", filters=filters)
        commissions = COMMISSION_DATA.get(f"{employee_no}_{month}", [])
        
        return {
            "commissions": commissions,
            "total": sum(float(c.get("amount", 0)) for c in commissions)
        }
        
    except Exception as e:
        logger.error(f"Error fetching commissions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_commission(
    payload: Dict,
    request: Request,
    client: SecureBCClient = Depends(get_secure_bc_client)
):
    """
    POST /api/commissions
    Create a new commission record.
    """
    try:
        employee_no = payload.get("employeeNo")
        amount = payload.get("amount")
        
        if not employee_no or not amount:
            raise HTTPException(status_code=400, detail="employeeNo and amount are required")
        
        # In production, would call: client.secure_create("commissions", payload)
        commission = {
            "commissionId": f"COM-{int(datetime.utcnow().timestamp())}",
            **payload,
            "status": "Pending",
            "createdAt": datetime.utcnow().isoformat()
        }
        
        key = f"{employee_no}_{payload.get('commissionDate', 'unknown')[:7]}"
        if key not in COMMISSION_DATA:
            COMMISSION_DATA[key] = []
        COMMISSION_DATA[key].append(commission)
        
        logger.info(f"Commission created: {commission['commissionId']}")
        return commission
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating commission: {e}")
        raise HTTPException(status_code=500, detail=str(e))
