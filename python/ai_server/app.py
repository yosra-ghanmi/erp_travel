import os
import logging
import time
import json
from dotenv import load_dotenv

load_dotenv(override=True)
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from models import (
    BCIngestPayload,
    GenerateRequest,
    GenerateResponse,
    Client,
    ClientCreate,
    Booking,
    BookingCreate,
    Payment,
    PaymentCreate,
    Expense,
    ExpenseCreate,
    TravelService,
    Reservation,
    TravelOffer,
    SyncOffersResponse,
    GenerateItineraryRequest,
    PremiumItineraryResponse,
    TravelQuote,
    TravelInvoice,
    TravelPayment,
    EmailRequest,
)
from agency_models import Agency, AgencyCreate, AgencyUpdate
from ai import generate_itinerary
from mailing import send_email_with_attachment
from bc_client import BCClient, get_azure_ad_token, fetch_travel_offers, fetch_travel_offer_by_id
from secure_bc_client import SecureBCClient, get_secure_bc_client
from user_sync_service import AgencyAdminSyncService
from expense_service import ExpenseService
from payroll_service import PayrollService
from pydantic import BaseModel
from apscheduler.schedulers.background import BackgroundScheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure we load from both current and parent directory with override
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=True)

# Validate AI provider configuration at startup
AI_PROVIDER = os.getenv("AI_PROVIDER", "").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if AI_PROVIDER == "openai" and not OPENAI_API_KEY:
    logger.warning("AI_PROVIDER is set to 'openai' but OPENAI_API_KEY is not configured!")
elif AI_PROVIDER == "gemini" and not GEMINI_API_KEY:
    logger.warning("AI_PROVIDER is set to 'gemini' but GEMINI_API_KEY is not configured!")
elif AI_PROVIDER and AI_PROVIDER not in ("openai", "gemini"):
    logger.warning(f"Unknown AI_PROVIDER '{AI_PROVIDER}'. Expected 'openai' or 'gemini'.")
elif not AI_PROVIDER:
    logger.info("No AI_PROVIDER configured. Using fallback static itinerary generation.")

app = FastAPI(
    title="ERP-AI Integration",
    description="AI-powered itinerary generation for Travel Agency ERP",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PAYROLL SCHEDULER ---

def run_monthly_payroll():
    """Background task to generate payroll and sync invoice-based expenses"""
    logger.info("Scheduler: Running monthly payroll job...")
    try:
        # Use superadmin role for automated tasks to bypass RBAC restrictions
        client = SecureBCClient(user_role="superadmin")
        
        # 1. First, sync expenses from invoices (85% payouts and 5% commissions)
        logger.info("Scheduler: Syncing service payouts and commissions...")
        sync_result = sync_expenses_from_invoices(client)
        logger.info(f"Scheduler: Sync completed: {sync_result}")
        
        # 2. Then, generate monthly payroll (Fixed salaries)
        result = PayrollService.generate_monthly_payroll(client)
        logger.info(f"Scheduler: Payroll job completed. Result: {result}")
    except Exception as e:
        logger.error(f"Scheduler: Payroll job failed: {e}")

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', day='28-31', hour=1, minute=0)
def scheduled_payroll():
    """Trigger payroll on the 29th or Feb 28th (non-leap)"""
    today = date.today()
    is_29th = today.day == 29
    # February fallback: check if today is Feb 28th and tomorrow is March 1st (meaning it's the last day and not 29th)
    is_feb_last_day = today.month == 2 and today.day == 28 and (today + timedelta(days=1)).month == 3
    
    if is_29th or is_feb_last_day:
        run_monthly_payroll()

scheduler.start()

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")


@app.get("/")
def root():
    return RedirectResponse(url="/static/map.html")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ERP-AI Integration"}


# --- AGENCIES ---

AGENCIES_FILE = os.path.join(os.path.dirname(__file__), "agencies.json")
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
OFFERS_FILE = os.path.join(os.path.dirname(__file__), "travel_offers.json")
EXPENSES_FILE = os.path.join(os.path.dirname(__file__), "expenses.json")

def _load_agencies() -> List[Dict]:
    if not os.path.exists(AGENCIES_FILE):
        return []
    with open(AGENCIES_FILE, "r") as f:
        return json.load(f)

def _save_agencies(agencies: List[Dict]):
    with open(AGENCIES_FILE, "w") as f:
        json.dump(agencies, f, indent=2)

def _load_users() -> List[Dict]:
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def _save_users(users: List[Dict]):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def _load_offers() -> List[Dict]:
    if not os.path.exists(OFFERS_FILE):
        return []
    with open(OFFERS_FILE, "r") as f:
        return json.load(f)

def _save_offers(offers: List[Dict]):
    with open(OFFERS_FILE, "w") as f:
        json.dump(offers, f, indent=2)

def _load_expenses() -> List[Dict]:
    if not os.path.exists(EXPENSES_FILE):
        return []
    try:
        with open(EXPENSES_FILE, "r") as f:
            content = f.read()
            if not content:
                return []
            return json.loads(content)
    except Exception as e:
        logger.error(f"Error loading expenses: {e}")
        return []

def _save_expenses(expenses: List[Dict]):
    with open(EXPENSES_FILE, "w") as f:
        json.dump(expenses, f, indent=2)

@app.get("/api/users")
def get_users():
    try:
        return {"users": _load_users()}
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/agencies")
def get_agencies():
    try:
        return {"agencies": _load_agencies()}
    except Exception as e:
        logger.error(f"Error fetching agencies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agencies")
def create_agency(agency: Agency):
    try:
        agencies = _load_agencies()
        # Convert Pydantic model to dict, ensuring it's serializable
        agency_dict = json.loads(agency.json())
        if not agency_dict.get("created_at"):
            agency_dict["created_at"] = date.today().isoformat()
        
        # Ensure ID is consistent
        if not agency_dict.get("id"):
            agency_dict["id"] = agency_dict.get("agency_id")
            
        agencies.append(agency_dict)
        _save_agencies(agencies)
        return agency_dict
    except Exception as e:
        logger.error(f"Error creating agency: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/agencies/{agency_id}")
def update_agency(agency_id: str, patch: Dict):
    try:
        agencies = _load_agencies()
        updated = False
        for i, a in enumerate(agencies):
            if a.get("id") == agency_id or a.get("agency_id") == agency_id:
                agencies[i].update(patch)
                updated = True
                break
        if not updated:
            raise HTTPException(status_code=404, detail="Agency not found")
        _save_agencies(agencies)
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating agency: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/agencies/{agency_id}")
def delete_agency(agency_id: str):
    try:
        agencies = _load_agencies()
        original_count = len(agencies)
        agencies = [a for a in agencies if a.get("id") != agency_id and a.get("agency_id") != agency_id]
        
        if len(agencies) == original_count:
            raise HTTPException(status_code=404, detail="Agency not found")
            
        _save_agencies(agencies)
        return {"status": "success", "message": f"Agency {agency_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting agency: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- CLIENTS ---

@app.get("/api/clients")
def get_clients(client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        clients = client.secure_get("clients")
        return {"clients": clients}
    except Exception as e:
        logger.error(f"Error fetching clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clients")
def create_client(client_data: ClientCreate, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        client_no = f"CL-{int(time.time())}"
        payload = {
            "no": client_no,
            "name": client_data.name,
            "email": client_data.email,
            "phone": client_data.phone,
            "country": client_data.country,
            "notes": client_data.notes
        }
        return client.secure_post("clients", payload)
    except Exception as e:
        logger.error(f"Error creating client in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- BOOKINGS ---

@app.get("/api/bookings")
def get_bookings(client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        bookings = client.secure_get("bookings")
        return {"bookings": bookings}
    except Exception as e:
        logger.error(f"Error fetching bookings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bookings")
def create_booking(booking: BookingCreate, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        booking_id = f"BK-{int(time.time())}"
        payload = {
            "bookingId": booking_id,
            "clientNo": booking.clientNo,
            "tripName": booking.tripName,
            "startDate": booking.startDate.isoformat(),
            "endDate": booking.endDate.isoformat(),
            "amount": booking.amount,
            "notes": booking.notes
        }
        return client.secure_create("bookings", payload)
    except Exception as e:
        logger.error(f"Error creating booking in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- PAYMENTS ---

@app.get("/api/payments")
def get_payments(client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        payments = client.secure_get("payments")
        return {"payments": payments}
    except Exception as e:
        logger.error(f"Error fetching payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments")
def create_payment(payment: TravelPayment, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        payload = json.loads(payment.json(by_alias=True, exclude_none=True))
        if not payload.get("paymentId"):
            payload["paymentId"] = f"PAY-{int(time.time())}"
        return client.secure_create("payments", payload)

    except Exception as e:
        logger.error(f"Error creating payment in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- EXPENSES ---

@app.get("/api/expenses")
def get_expenses(client: SecureBCClient = Depends(get_secure_bc_client)):
    """
    Returns a unified list of manual expenses, provider payouts, and agent commissions.
    """
    try:
        # Load local expenses (payouts and commissions calculated)
        local_expenses = _load_expenses()
        
        # Optionally fetch manual expenses from BC if they exist there
        try:
            bc_expenses = client.secure_get("expenses")
        except:
            bc_expenses = []
            
        return {"expenses": local_expenses + bc_expenses}
    except Exception as e:
        logger.error(f"Error fetching expenses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/expenses")
def create_expense(expense: ExpenseCreate, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        expense_id = f"EXP-{int(time.time())}"
        expense_dict = expense.dict(by_alias=True)
        expense_dict["expenseId"] = expense_id
        expense_dict["status"] = "Pending"
        
        # Save locally
        expenses = _load_expenses()
        expenses.append(expense_dict)
        _save_expenses(expenses)
        
        # Try to sync with BC
        try:
            bc_data = client.secure_create("expenses", expense_dict)
            expense_dict["status"] = "Synchronized"
            _save_expenses(expenses)
            return bc_data
        except Exception as bc_err:
            logger.warning(f"Failed to sync expense to BC: {bc_err}")
            return expense_dict
            
    except Exception as e:
        logger.error(f"Error creating expense: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/expenses/sync-invoices")
def sync_expenses_from_invoices(client: SecureBCClient = Depends(get_secure_bc_client)):
    """
    Triggers the calculation logic:
    1. Provider Payout (85% Rule) on all invoices.
    2. Agent Commission (5% Rule) on "Paid" invoices > 1000.
    """
    try:
        logger.info("Starting expense sync from invoices...")
        invoices_raw = client.secure_get("invoices")
        invoices = [TravelInvoice(**inv) for inv in invoices_raw]
        logger.info(f"Fetched {len(invoices)} invoices from BC.")
        
        all_expenses = _load_expenses()
        new_expenses_count = 0
        
        for inv in invoices:
            logger.info(f"Checking Invoice {inv.invoice_no}: Status={inv.status}, Total={inv.total_amount}, Service={inv.service_code}")
            # 1. Provider Payout (85% Rule) - Triggered when service is invoiced
            if inv.service_code:
                # Check if payout already exists for this invoice
                exists = any(e.get("sourceInvoiceId") == inv.invoice_no and e.get("expenseType") == "Provider Payout" for e in all_expenses)
                if not exists:
                    # Fetch service details to get the price
                    try:
                        # Corrected: pass entity_id as second argument
                        service_results = client.secure_get("services", inv.service_code)
                        if service_results:
                            service_data = service_results[0]
                            service = TravelService(**service_data)
                            payout = ExpenseService.calculate_provider_payout(service, inv.invoice_no)
                            # Fix: Use json.loads(payout.json()) for proper date serialization
                            all_expenses.append(json.loads(payout.json(by_alias=True)))
                            new_expenses_count += 1
                            logger.info(f"Created Provider Payout for Invoice {inv.invoice_no}")
                        else:
                            logger.warning(f"Service {inv.service_code} not found for payout calculation")
                    except Exception as serv_err:
                        logger.warning(f"Could not fetch service {inv.service_code}: {serv_err}")
                else:
                    logger.debug(f"Provider Payout for {inv.invoice_no} already exists.")

            # 2. Agent Commission (5% Rule) - Triggered when Paid and > 1000
            # Normalize status check to handle "Paid" and "Fully Paid"
            is_paid = inv.status and inv.status.lower() in ["paid", "fully paid"]
            if is_paid and (inv.total_amount or 0) > 1000:
                exists = any(e.get("sourceInvoiceId") == inv.invoice_no and e.get("expenseType") == "Agent Commission" for e in all_expenses)
                if not exists:
                    # In this demo, we'll assign to a default agent if not specified
                    agent_id = "AGENT-001" 
                    commission = ExpenseService.calculate_agent_commission(inv, agent_id)
                    if commission:
                        # Fix: Use json.loads(commission.json()) for proper date serialization
                        all_expenses.append(json.loads(commission.json(by_alias=True)))
                        new_expenses_count += 1
                        logger.info(f"Created Agent Commission for Invoice {inv.invoice_no}")
                else:
                    logger.debug(f"Agent Commission for {inv.invoice_no} already exists.")
        
        if new_expenses_count > 0:
            _save_expenses(all_expenses)
            logger.info(f"Created {new_expenses_count} new expense records.")
            
        return {
            "status": "success", 
            "message": f"Processed {len(invoices)} invoices. Created {new_expenses_count} new expense records.",
            "total_expenses": len(all_expenses)
        }
    except Exception as e:
        logger.error(f"Error syncing expenses from invoices: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@app.post("/api/admin/payroll/trigger-manual")
def trigger_manual_payroll(client: SecureBCClient = Depends(get_secure_bc_client)):
    """
    Manually triggers the payroll generation logic.
    Includes syncing service payouts and agent commissions.
    """
    # Authorization check
    if client.user_role not in ["admin", "superadmin", "finance"]:
        raise HTTPException(status_code=403, detail="Not authorized to trigger payroll.")
        
    try:
        # 1. Sync invoice-based expenses (Commissions & Payouts)
        logger.info("Manual Trigger: Syncing service payouts and commissions...")
        sync_result = sync_expenses_from_invoices(client)
        
        # 2. Generate monthly payroll (Fixed Salaries)
        logger.info("Manual Trigger: Generating monthly payroll...")
        payroll_result = PayrollService.generate_monthly_payroll(client)
        
        return {
            "sync_status": sync_result,
            "payroll_status": payroll_result
        }
    except Exception as e:
        logger.error(f"Manual payroll trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bc-webhook")
async def bc_webhook(request: Request, client: SecureBCClient = Depends(get_secure_bc_client)):
    """
    Webhook receiver for Business Central events.
    When an invoice status changes, this can trigger the commission logic.
    """
    try:
        payload = await request.json()
        logger.info(f"Received BC Webhook: {payload}")
        
        # Example payload handling:
        # { "entity": "TravelInvoice", "id": "INV-001", "status": "Paid" }
        
        entity = payload.get("entity")
        if entity == "TravelInvoice":
            # Re-sync expenses to capture the change
            return sync_expenses_from_invoices(client)
            
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Error processing BC webhook: {e}")
        return {"status": "error", "message": str(e)}


# --- SERVICES ---

@app.get("/api/services")
def get_services(client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        services = client.secure_get("services")
        return {"services": services}
    except Exception as e:
        logger.error(f"Error fetching services: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/services")
def create_service(service: TravelService, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        payload = service.dict(by_alias=True, exclude_none=True)
        if not payload.get("code"):
            payload["code"] = f"SV-{int(time.time())}"
        return client.secure_create("services", payload)
    except Exception as e:
        logger.error(f"Error creating service in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/services/{service_code}")
def delete_service(service_code: str, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        client.secure_delete("services", service_code)
        return {"status": "success", "message": f"Service {service_code} deleted"}
    except Exception as e:
        logger.error(f"Error deleting service in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- RESERVATIONS ---

@app.get("/api/reservations")
def get_reservations(client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        reservations = client.secure_get("reservations")
        return {"reservations": reservations}
    except Exception as e:
        logger.error(f"Error fetching reservations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reservations")
def create_reservation(reservation: Reservation, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        payload = reservation.dict(by_alias=True, exclude_none=True)
        if not payload.get("reservationNo"):
            payload["reservationNo"] = f"RES-{int(time.time())}"
        return client.secure_create("reservations", payload)
    except Exception as e:
        logger.error(f"Error creating reservation in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- QUOTES ---

@app.get("/api/quotes")
def get_quotes(client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        quotes = client.secure_get("quotes")
        return {"quotes": quotes}
    except Exception as e:
        logger.error(f"Error fetching quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quotes")
def create_quote(quote: TravelQuote, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        payload = json.loads(quote.json(by_alias=True, exclude_none=True))
        
        service_items = payload.get("serviceItems", [])
        service_codes = payload.get("serviceCodes", [])
        
        # --- NEW: Sync local offers if used in quote ---
        def _ensure_offer_synced(code, ltype):
            if ltype == "Offer" and code.startswith("OFFER-"):
                local_offers = _load_offers()
                match = next((o for o in local_offers if o.get("id") == code), None)
                if match:
                    try:
                        # Normalize using pydantic model to handle field mapping (snake_case -> camelCase)
                        from models import TravelOffer
                        offer_obj = TravelOffer(**match)
                        sync_payload = json.loads(offer_obj.json(by_alias=True, exclude_none=True))
                        
                        # Check if it already exists in BC to avoid 409
                        try:
                            client.secure_get("offers", code)
                            logger.info(f"Offer {code} already exists in BC.")
                        except:
                            logger.info(f"Syncing local offer {code} to BC...")
                            client.secure_create("offers", sync_payload)
                    except Exception as sync_err:
                        logger.error(f"Auto-sync for offer {code} failed: {sync_err}")
                        raise HTTPException(status_code=500, detail=f"Failed to sync offer {code} to Business Central: {str(sync_err)}")

        # Handle first service (Header mapping)
        if service_items:
            item0 = service_items[0]
            _ensure_offer_synced(item0["serviceCode"], item0.get("lineType", "Service"))
            payload["serviceCode"] = item0["serviceCode"]
            payload["lineType"] = item0.get("lineType", "Service")
            payload["quantity"] = item0.get("quantity", 1)
            payload["numberOfNights"] = item0.get("numberOfNights", 1)
        elif service_codes:
            # Service codes are usually services, but we check anyway
            payload["serviceCode"] = service_codes[0]
            payload["lineType"] = "Service"
            payload["quantity"] = 1
            payload["numberOfNights"] = 1
            
        # Clean payload for Header creation
        header_payload = {k: v for k, v in payload.items() if k not in ["serviceItems", "serviceCodes"]}
        header_payload = {k: v for k, v in header_payload.items() if v != "" and v != []}
        
        if not header_payload.get("quoteNo"):
            header_payload["quoteNo"] = f"QT-{int(time.time())}"
            
        # 2. Create Header (triggers first line in BC)
        result = client.secure_create("quotes", header_payload)
        quote_no = result.get("quoteno")
        
        # 3. Create additional lines if multiple items provided
        if len(service_items) > 1:
            for i, item in enumerate(service_items[1:]):
                _ensure_offer_synced(item["serviceCode"], item.get("lineType", "Service"))
                line_payload = {
                    "quoteNo": quote_no,
                    "lineNo": (i + 2) * 10000,
                    "lineType": item.get("lineType", "Service"),
                    "serviceCode": item["serviceCode"],
                    "quantity": item.get("quantity", 1),
                    "numberOfNights": item.get("numberOfNights", 1)
                }
                try:
                    client.secure_create("quote_lines", line_payload)
                except Exception as line_err:
                    logger.warning(f"Failed to create additional line for {item['serviceCode']}: {line_err}")
                    
        return result
    except Exception as e:
        logger.error(f"Error creating quote in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/quotes/{quote_no}")
def update_quote(quote_no: str, quote: TravelQuote, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        payload = json.loads(quote.json(by_alias=True, exclude_none=True))
        logger.info(f"Updating quote {quote_no} with payload: {payload}")
        return client.secure_update("quotes", quote_no, payload)
    except Exception as e:
        logger.error(f"Error updating quote in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quotes/{quote_no}/lines")
def get_quote_lines(quote_no: str, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        # Fetch lines filtered by quoteNo and agency
        filters = [f"quoteNo eq '{quote_no}'"]
        lines = client.secure_get("quote_lines", filters=filters)
        return {"lines": lines}
    except Exception as e:
        logger.error(f"Error fetching quote lines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/quotes/{quote_no}")
def delete_quote(quote_no: str, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        client.secure_delete("quotes", quote_no)
        return {"status": "success", "message": f"Quote {quote_no} deleted"}
    except Exception as e:
        logger.error(f"Error deleting quote in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- INVOICES ---

@app.get("/api/invoices")
def get_invoices(client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        invoices = client.secure_get("invoices")
        return {"invoices": invoices}
    except Exception as e:
        logger.error(f"Error fetching invoices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/invoices")
def create_invoice(invoice: TravelInvoice, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        payload = json.loads(invoice.json(by_alias=True, exclude_none=True))
        if not payload.get("invoiceNo"):
            payload["invoiceNo"] = f"INV-{int(time.time())}"
        return client.secure_create("invoices", payload)
    except Exception as e:
        logger.error(f"Error creating invoice in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/invoices/{invoice_no}/lines")
def get_invoice_lines(invoice_no: str, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        # Fetch lines filtered by invoiceNo and agency
        filters = [f"invoiceNo eq '{invoice_no}'"]
        lines = client.secure_get("invoice_lines", filters=filters)
        return {"lines": lines}
    except Exception as e:
        logger.error(f"Error fetching invoice lines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/invoices/{invoice_no}")
def delete_invoice(invoice_no: str, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        client.secure_delete("invoices", invoice_no)
        return {"status": "success", "message": f"Invoice {invoice_no} deleted"}
    except Exception as e:
        logger.error(f"Error deleting invoice in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- MAILING ---

@app.post("/api/send-email")
def send_email(req: EmailRequest):
    try:
        success = send_email_with_attachment(
            to_email=req.to_email,
            subject=req.subject,
            body=req.body,
            attachment_base64=req.attachment_base64,
            filename=req.filename
        )
        if success:
            return {"status": "success", "message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email. Check server logs.")
    except Exception as e:
        logger.error(f"Error in send_email endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- AGENCY ADMIN ---

class AgencyAdminCreate(BaseModel):
    agency_id: str
    agency_name: str
    owner_email: Optional[str] = None


def _get_admin_bc_client():
    return SecureBCClient(user_role="superadmin")


@app.post("/api/agency-admin")
def create_agency_admin(req: AgencyAdminCreate, company_name: str | None = None):
    try:
        # 1. Generate the local user data first
        # This ensures the platform works even if Business Central is down
        admin_id = f"ADM-{req.agency_id}"
        admin_name = f"Admin for {req.agency_name}"
        admin_email = req.owner_email or f"admin.{req.agency_id.lower().replace('-', '_')}@system.local"
        
        # We need a temp password for the local user
        # We'll borrow the logic from the service or just generate one here
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

        result = {
            "user_id": admin_id,
            "name": admin_name,
            "email": admin_email,
            "password": temp_password,
            "role": "admin",
            "agency_id": req.agency_id,
            "is_agency_admin": True,
            "bc_sync_status": "pending"
        }

        # 2. Try to sync with Business Central (optional)
        try:
            admin_bc = _get_admin_bc_client()
            agency_admin_svc = AgencyAdminSyncService(admin_bc)
            bc_result = agency_admin_svc.create_agency_admin(
                agency_id=req.agency_id,
                agency_name=req.agency_name,
                owner_email=req.owner_email
            )
            # Update with BC data if successful
            result.update(bc_result)
            result["bc_sync_status"] = "success"
        except Exception as bc_err:
            logger.warning(f"Business Central sync failed for {req.agency_id}: {bc_err}")
            result["bc_sync_status"] = "failed"
            result["bc_error"] = str(bc_err)
        
        # 3. Persist the user locally
        users = _load_users()
        new_user = {
            "id": result["user_id"],
            "name": result["name"],
            "email": result["email"],
            "password": result["password"],
            "role": result["role"],
            "agency_id": result["agency_id"]
        }
        
        # Avoid duplicates
        users = [u for u in users if u["id"] != new_user["id"]]
        users.append(new_user)
        _save_users(users)
        
        return result
    except Exception as e:
        logger.error(f"Error in create_agency_admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- AI ITINERARY ---

@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    logger.info(f"Generate itinerary for client: {req.client.no}")
    try:
        result = generate_itinerary(req)
        return result
    except Exception as e:
        logger.error(f"Error generating itinerary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sync-offers", response_model=SyncOffersResponse)
def sync_offers(client: SecureBCClient = Depends(get_secure_bc_client)):
    # 1. Load local offers first
    local_offers = _load_offers()
    offers = [TravelOffer(**o) for o in local_offers]

    # 2. Sync with Business Central using SecureBCClient
    try:
        raw_offers = client.secure_get("offers")
        for raw in raw_offers:
            # Avoid adding local offers that are already in BC (by ID)
            if any(str(o.id) == str(raw.get("id") or raw.get("no")) for o in offers):
                continue
                
            offers.append(TravelOffer(
                id=str(raw.get("id") or raw.get("no")),
                title=raw.get("title") or "Travel Offer",
                destination=raw.get("destination"),
                summary=raw.get("summary"),
                duration_days=raw.get("durationdays") or raw.get("duration_days"),
                price=raw.get("price"),
                currency=raw.get("currencycode") or raw.get("currency_code"),
                startDate=raw.get("startdate") or raw.get("start_date"),
                endDate=raw.get("enddate") or raw.get("end_date"),
                highlights=[]
            ))
    except Exception as e:
        logger.warning(f"Failed to sync with Business Central via SecureBCClient: {e}")

    return SyncOffersResponse(offers=offers)

@app.post("/api/travel-offers")
def create_travel_offer(offer: TravelOffer, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        # 1. Save to Business Central if the user has permission
        try:
            payload = json.loads(offer.json(by_alias=True, exclude_none=True))
            bc_offer = client.secure_create("offers", payload)
            return bc_offer
        except Exception as bc_err:
            logger.warning(f"Business Central offer creation failed: {bc_err}. Saving locally.")

        # 2. Fallback to local storage
        offers = _load_offers()
        new_offer = json.loads(offer.json())
        offers.append(new_offer)
        _save_offers(offers)
        return new_offer
    except Exception as e:
        logger.error(f"Error creating travel offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/travel-offers/{offer_id}")
def delete_travel_offer(offer_id: str, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        # 1. Try deleting from BC first if it exists
        try:
            client.secure_delete("offers", offer_id)
        except Exception as bc_err:
            logger.warning(f"Failed to delete offer from Business Central: {bc_err}")

        # 2. Delete from local storage
        offers = _load_offers()
        original_count = len(offers)
        offers = [o for o in offers if str(o.get("id")) != offer_id]
        
        if len(offers) == original_count and not str(offer_id).startswith("OFFER-"):
             # If it wasn't a local offer and BC delete already failed/wasn't tried, then error
             pass
            
        _save_offers(offers)
        return {"status": "success", "message": f"Travel offer {offer_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting travel offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/travel-offers/{offer_id}")
def update_travel_offer(offer_id: str, offer: TravelOffer, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        # 1. Update in BC if it exists
        try:
            payload = json.loads(offer.json(by_alias=True, exclude_none=True))
            client.secure_update("offers", offer_id, payload)
        except Exception as bc_err:
            logger.warning(f"Failed to update offer in Business Central: {bc_err}")

        # 2. Update in local storage
        offers = _load_offers()
        for i, o in enumerate(offers):
            if str(o.get("id")) == offer_id:
                offers[i] = json.loads(offer.json())
                offers[i]["id"] = offer_id # Keep original ID
                break
        
        _save_offers(offers)
        return {"status": "success", "message": f"Travel offer {offer_id} updated"}
    except Exception as e:
        logger.error(f"Error updating travel offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-itinerary", response_model=PremiumItineraryResponse)
def generate_itinerary_from_offer(payload: GenerateItineraryRequest):
    # This is a simplified version for the integration
    # In a real app, you'd fetch the offer details and call generate_itinerary
    dummy_offer = TravelOffer(id=payload.travel_offer_id, title="Trip", highlights=[])
    dummy_plan = GenerateResponse(
        clientId="N/A", 
        reservationNo="N/A", 
        days=[], 
        source="fallback"
    )
    return PremiumItineraryResponse(offer=dummy_offer, plan=dummy_plan, source="mock")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)},
    )
