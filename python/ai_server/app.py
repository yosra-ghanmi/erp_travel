import os
import logging
import time
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
)
from ai import generate_itinerary
from bc_client import BCClient, get_azure_ad_token, fetch_travel_offers, fetch_travel_offer_by_id
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

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
def create_payment(payment: PaymentCreate, company_name: str | None = None):
    try:
        bc = BCClient(company_name=company_name)
        payment_id = f"PAY-{int(time.time())}"
        payload = {
            "paymentId": payment_id,
            "clientNo": payment.clientNo,
            "bookingId": payment.bookingId,
            "amount": payment.amount,
            "method": payment.method,
            "date": payment.date.isoformat()
        }
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
