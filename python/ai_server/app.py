import os
import logging
import time
import json
from dotenv import load_dotenv

load_dotenv(override=True)
from datetime import date
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
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
from ai import generate_itinerary
from mailing import send_email_with_attachment
from bc_client import BCClient, get_azure_ad_token, fetch_travel_offers, fetch_travel_offer_by_id

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


# --- CLIENTS ---

@app.get("/api/clients")
def get_clients(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        clients = bc.travel_clients()
        return {"clients": clients}
    except Exception as e:
        logger.error(f"Error fetching clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clients")
def create_client(client: ClientCreate, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        client_no = f"CL-{int(time.time())}"
        payload = {
            "no": client_no,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "country": client.country,
            "notes": client.notes
        }
        return bc.create_travel_client(payload)
    except Exception as e:
        logger.error(f"Error creating client in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- BOOKINGS ---

@app.get("/api/bookings")
def get_bookings(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        bookings = bc.travel_bookings()
        return {"bookings": bookings}
    except Exception as e:
        logger.error(f"Error fetching bookings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bookings")
def create_booking(booking: BookingCreate, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
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
        return bc.create_travel_booking(payload)
    except Exception as e:
        logger.error(f"Error creating booking in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- PAYMENTS ---

@app.get("/api/payments")
def get_payments(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        payments = bc.travel_payments()
        return {"payments": payments}
    except Exception as e:
        logger.error(f"Error fetching payments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/payments")
def create_payment(payment: TravelPayment, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        payload = json.loads(payment.json(by_alias=True, exclude_none=True))
        return bc.create_travel_payment(payload)
    except Exception as e:
        logger.error(f"Error creating payment in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- EXPENSES ---

@app.get("/api/expenses")
def get_expenses(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        expenses = bc.travel_expenses()
        return {"expenses": expenses}
    except Exception as e:
        logger.error(f"Error fetching expenses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/expenses")
def create_expense(expense: ExpenseCreate, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        expense_id = f"EXP-{int(time.time())}"
        payload = {
            "expenseId": expense_id,
            "type": expense.type,
            "amount": expense.amount,
            "date": expense.date.isoformat(),
            "description": expense.description
        }
        return bc.create_travel_expense(payload)
    except Exception as e:
        logger.error(f"Error creating expense in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- SERVICES ---

@app.get("/api/services")
def get_services(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        services = bc.travel_services()
        return {"services": services}
    except Exception as e:
        logger.error(f"Error fetching services: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/services")
def create_service(service: TravelService, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        payload = service.dict(by_alias=True, exclude_none=True)
        if not payload.get("code"):
            payload["code"] = f"SV-{int(time.time())}"
        return bc.create_travel_service(payload)
    except Exception as e:
        logger.error(f"Error creating service in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/services/{service_code}")
def delete_service(service_code: str, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        bc.delete_travel_service(service_code)
        return {"status": "success", "message": f"Service {service_code} deleted"}
    except Exception as e:
        logger.error(f"Error deleting service in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- RESERVATIONS ---

@app.get("/api/reservations")
def get_reservations(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        reservations = bc.travel_reservations()
        return {"reservations": reservations}
    except Exception as e:
        logger.error(f"Error fetching reservations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reservations")
def create_reservation(reservation: Reservation, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        payload = reservation.dict(by_alias=True, exclude_none=True)
        if not payload.get("reservationNo"):
            payload["reservationNo"] = f"RES-{int(time.time())}"
        return bc.create_travel_reservation(payload)
    except Exception as e:
        logger.error(f"Error creating reservation in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- QUOTES ---

@app.get("/api/quotes")
def get_quotes(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        quotes = bc.travel_quotes()
        return {"quotes": quotes}
    except Exception as e:
        logger.error(f"Error fetching quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/quotes")
def create_quote(quote: TravelQuote, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        # Use .json() to ensure dates and other objects are serialized to strings, 
        # then loads() back to dict for the bc_client which uses requests(json=...)
        payload = json.loads(quote.json(by_alias=True, exclude_none=True))
        # Clean empty strings
        payload = {k: v for k, v in payload.items() if v != ""}
        
        if not payload.get("quoteNo"):
            payload["quoteNo"] = f"QT-{int(time.time())}"
        return bc.create_travel_quote(payload)
    except Exception as e:
        logger.error(f"Error creating quote in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/quotes/{quote_no}")
def update_quote(quote_no: str, quote: TravelQuote, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        payload = json.loads(quote.json(by_alias=True, exclude_none=True))
        logger.info(f"Updating quote {quote_no} with payload: {payload}")
        return bc.update_travel_quote(quote_no, payload)
    except Exception as e:
        logger.error(f"Error updating quote in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quotes/{quote_no}/lines")
def get_quote_lines(quote_no: str, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        lines = bc.travel_quote_lines(quote_no)
        return {"lines": lines}
    except Exception as e:
        logger.error(f"Error fetching quote lines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/quotes/{quote_no}")
def delete_quote(quote_no: str, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        bc.delete_travel_quote(quote_no)
        return {"status": "success", "message": f"Quote {quote_no} deleted"}
    except Exception as e:
        logger.error(f"Error deleting quote in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- INVOICES ---

@app.get("/api/invoices")
def get_invoices(company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        invoices = bc.travel_invoices()
        return {"invoices": invoices}
    except Exception as e:
        logger.error(f"Error fetching invoices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/invoices")
def create_invoice(invoice: TravelInvoice, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        payload = json.loads(invoice.json(by_alias=True, exclude_none=True))
        if not payload.get("invoiceNo"):
            payload["invoiceNo"] = f"INV-{int(time.time())}"
        return bc.create_travel_invoice(payload)
    except Exception as e:
        logger.error(f"Error creating invoice in BC: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/invoices/{invoice_no}/lines")
def get_invoice_lines(invoice_no: str, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        lines = bc.travel_invoice_lines(invoice_no)
        return {"lines": lines}
    except Exception as e:
        logger.error(f"Error fetching invoice lines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/invoices/{invoice_no}")
def delete_invoice(invoice_no: str, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        bc.delete_travel_invoice(invoice_no)
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
    tenant_id = os.getenv("AZURE_TENANT_ID", "")
    client_id = os.getenv("AZURE_CLIENT_ID", "")
    client_secret = os.getenv("AZURE_CLIENT_SECRET", "")
    scope = os.getenv("BC_OAUTH_SCOPE", "https://api.businesscentral.dynamics.com/.default")
    base_url = os.getenv("BC_OAUTH_BASE_URL", "")
    company_name = os.getenv("BC_COMPANY_NAME", "smart travel agency")
    endpoint = os.getenv("BC_TRAVEL_OFFERS_ENDPOINT", "TravelOfferAPI")
    
    if not tenant_id or not client_id or not client_secret or not base_url:
        # Fallback for demo if no OAuth config
        return SyncOffersResponse(offers=[])

    token = get_azure_ad_token(tenant_id, client_id, client_secret, scope)
    raw_offers = fetch_travel_offers(token, base_url, company_name, endpoint)
    offers = []
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
    return SyncOffersResponse(offers=offers)


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
