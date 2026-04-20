import os
import logging
import time
import json
from dotenv import load_dotenv

load_dotenv(override=True)
from datetime import date
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
from pydantic import BaseModel

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
    try:
        expenses = client.secure_get("expenses")
        return {"expenses": expenses}
    except Exception as e:
        logger.error(f"Error fetching expenses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/expenses")
def create_expense(expense: ExpenseCreate, client: SecureBCClient = Depends(get_secure_bc_client)):
    try:
        expense_id = f"EXP-{int(time.time())}"
        payload = {
            "expenseId": expense_id,
            "type": expense.type,
            "amount": expense.amount,
            "date": expense.date.isoformat(),
            "description": expense.description
        }
        return client.secure_create("expenses", payload)
    except Exception as e:
        logger.error(f"Error creating expense in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        
        # 1. Handle first service (Header mapping)
        if service_items:
            payload["serviceCode"] = service_items[0]["serviceCode"]
            payload["quantity"] = service_items[0].get("quantity", 1)
            payload["numberOfNights"] = service_items[0].get("numberOfNights", 1)
        elif service_codes:
            payload["serviceCode"] = service_codes[0]
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
                line_payload = {
                    "quoteNo": quote_no,
                    "lineNo": (i + 2) * 10000,
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
def sync_offers():
    # 1. Load local offers first
    local_offers = _load_offers()
    offers = [TravelOffer(**o) for o in local_offers]

    # 2. Try to sync with Business Central
    tenant_id = os.getenv("AZURE_TENANT_ID", "")
    client_id = os.getenv("AZURE_CLIENT_ID", "")
    client_secret = os.getenv("AZURE_CLIENT_SECRET", "")
    scope = os.getenv("BC_OAUTH_SCOPE", "https://api.businesscentral.dynamics.com/.default")
    base_url = os.getenv("BC_OAUTH_BASE_URL", "")
    company_name = os.getenv("BC_COMPANY_NAME", "smart travel agency")
    endpoint = os.getenv("BC_TRAVEL_OFFERS_ENDPOINT", "TravelOfferAPI")
    
    if tenant_id and client_id and client_secret and base_url:
        try:
            token = get_azure_ad_token(tenant_id, client_id, client_secret, scope)
            raw_offers = fetch_travel_offers(token, base_url, company_name, endpoint)
            for raw in raw_offers:
                offers.append(TravelOffer(
                    id=str(raw.get("id") or raw.get("no")),
                    title=raw.get("title") or "Travel Offer",
                    destination=raw.get("destination"),
                    summary=raw.get("summary"),
                    duration_days=raw.get("durationDays"),
                    price=raw.get("price"),
                    currency=raw.get("currencyCode"),
                    highlights=[]
                ))
        except Exception as e:
            logger.warning(f"Failed to sync with Business Central: {e}")

    return SyncOffersResponse(offers=offers)

@app.post("/api/travel-offers")
def create_travel_offer(offer: TravelOffer):
    try:
        offers = _load_offers()
        new_offer = json.loads(offer.json())
        offers.append(new_offer)
        _save_offers(offers)
        return new_offer
    except Exception as e:
        logger.error(f"Error creating travel offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/travel-offers/{offer_id}")
def delete_travel_offer(offer_id: str):
    try:
        offers = _load_offers()
        original_count = len(offers)
        offers = [o for o in offers if str(o.get("id")) != offer_id]
        
        if len(offers) == original_count:
            # Maybe it's not a local offer, but we can't delete BC offers easily
            raise HTTPException(status_code=404, detail="Local travel offer not found")
            
        _save_offers(offers)
        return {"status": "success", "message": f"Travel offer {offer_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting travel offer: {e}")
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
