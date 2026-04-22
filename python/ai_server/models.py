from enum import Enum
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class Client(BaseModel):
    no: str = Field(..., description="Client unique identifier")
    name: str = Field(..., description="Client full name")
    email: Optional[str] = Field(None, description="Client email")
    phone: Optional[str] = Field(None, description="Client phone number")
    country: Optional[str] = Field(None, description="Client country")
    notes: Optional[str] = Field(None, description="Additional notes")


class ClientCreate(BaseModel):
    name: str = Field(..., description="Client full name")
    email: Optional[str] = Field(None, description="Client email")
    phone: Optional[str] = Field(None, description="Client phone number")
    country: Optional[str] = Field(None, description="Client country")
    notes: Optional[str] = Field(None, description="Additional notes")


class Booking(BaseModel):
    bookingId: str
    clientNo: str
    tripName: str
    startDate: date
    endDate: date
    amount: float
    notes: Optional[str] = None


class BookingCreate(BaseModel):
    clientNo: str
    tripName: str
    startDate: date
    endDate: date
    amount: float
    notes: Optional[str] = None


class Payment(BaseModel):
    paymentId: str
    clientNo: str
    bookingId: str
    amount: float
    method: str  # cash, card, transfer
    payment_date: date = Field(..., alias="date")


class PaymentCreate(BaseModel):
    clientNo: str
    bookingId: str
    amount: float
    method: str
    payment_date: date = Field(..., alias="date")


class ExpenseType(str, Enum):
    PROVIDER_PAYOUT = "Provider Payout"
    AGENT_COMMISSION = "Agent Commission"
    MANUAL = "Manual"
    HOTEL = "Hotel"
    TRANSPORT = "Transport"
    FLIGHTS = "Flights"
    MARKETING = "Marketing"
    STAFF = "Staff"
    OTHER = "Other"


class Expense(BaseModel):
    expense_id: Optional[str] = Field(None, alias="expenseId")
    source_invoice_id: Optional[str] = Field(None, alias="sourceInvoiceId")
    recipient_id: str = Field(..., alias="recipientId", description="Agent or Hotel/Provider ID")
    expense_type: ExpenseType = Field(..., alias="expenseType")
    amount: float
    expense_date: date = Field(default_factory=date.today, alias="date")
    description: Optional[str] = None
    status: str = Field("Pending", description="Pending, Synchronized, Failed")

    class Config:
        populate_by_name = True


class ExpenseCreate(BaseModel):
    source_invoice_id: Optional[str] = Field(None, alias="sourceInvoiceId")
    recipient_id: str = Field(..., alias="recipientId")
    expense_type: ExpenseType = Field(..., alias="expenseType")
    amount: float
    expense_date: date = Field(default_factory=date.today, alias="date")
    description: Optional[str] = None

    class Config:
        populate_by_name = True


class TravelService(BaseModel):
    code: Optional[str] = Field(None, description="Service code")
    name: Optional[str] = Field(None, description="Service name")
    destination: Optional[str] = Field(None, description="Destination location")
    type: Optional[str] = Field(None, alias="serviceType", description="Service type")
    price: Optional[float] = Field(None, description="Price")
    currency: Optional[str] = Field(None, alias="currencyCode", description="Currency code")
    latitude: Optional[float] = Field(None, description="GPS latitude")
    longitude: Optional[float] = Field(None, description="GPS longitude")
    description: Optional[str] = Field(None, description="Service description")
    location: Optional[str] = Field(None, description="City location")
    image_url: Optional[str] = Field(None, alias="imageUrl", description="Image URL")

    class Config:
        populate_by_name = True


class Reservation(BaseModel):
    reservation_no: Optional[str] = Field(None, alias="reservationNo", description="Reservation number")
    client_no: str = Field(..., alias="clientNo", description="Client No.")
    service_code: Optional[str] = Field(None, alias="serviceCode", description="Service code")
    reservation_date: Optional[date] = Field(None, alias="reservationDate", description="Reservation date")
    status: Optional[str] = Field(None, description="Reservation status")

    class Config:
        populate_by_name = True


class EmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    attachment_base64: Optional[str] = None
    filename: Optional[str] = "document.pdf"


class BCIngestPayload(BaseModel):
    client: Client
    reservation: Reservation
    services: List[TravelService]


class ItineraryItem(BaseModel):
    time: Optional[str] = Field(None, description="Estimated time (e.g., 09:00)")
    title: str
    description: str
    location: Optional[str] = Field(None, description="Place name")
    latitude: float
    longitude: float
    tips: Optional[str] = Field(None, description="Local tips")


class ItineraryDay(BaseModel):
    day: int
    theme: Optional[str] = Field(None, description="Theme of the day")
    items: List[ItineraryItem]


class GenerateRequest(BaseModel):
    client: Client
    reservation: Reservation
    services: List[TravelService] = Field(default_factory=list)
    days: Optional[int] = Field(None, description="Number of days for itinerary")


class GenerateResponse(BaseModel):
    client_id: str = Field(..., alias="clientId")
    reservation_no: str = Field(..., alias="reservationNo")
    title: Optional[str] = Field(None, description="Itinerary Title")
    summary: Optional[str] = Field(None, description="Brief overview")
    days: List[ItineraryDay]
    recommendations: Optional[List[str]] = Field(None, description="General recommendations")
    source: str = Field(..., description="Source of generation: 'ai' or 'fallback'")

    class Config:
        populate_by_name = True


class ServiceItem(BaseModel):
    line_type: str = Field("Service", alias="lineType")
    service_code: str = Field(..., alias="serviceCode")
    quantity: float = Field(1.0)
    number_of_nights: Optional[float] = Field(None, alias="numberOfNights")

class TravelQuote(BaseModel):
    quote_no: Optional[str] = Field(None, alias="quoteNo", description="Quote number")
    line_type: str = Field("Service", alias="lineType", description="Line type (Service or Offer)")
    service_code: Optional[str] = Field(None, alias="serviceCode", description="Service code")
    quantity: Optional[float] = Field(None, description="Quantity (Number of Persons)")
    number_of_nights: Optional[float] = Field(None, alias="numberOfNights", description="Number of nights (for hotels)")
    client_no: Optional[str] = Field(None, alias="clientNo", description="Client number")
    client_name: Optional[str] = Field(None, alias="clientName", description="Client name")
    quote_date: Optional[date] = Field(None, alias="quoteDate", description="Quote date")
    valid_until_date: Optional[date] = Field(None, alias="validUntilDate", description="Valid until date")
    status: Optional[str] = Field(None, description="Status (Draft, Sent, Accepted, Rejected, Expired)")
    subtotal: Optional[float] = Field(None, description="Subtotal")
    discount_percent: Optional[float] = Field(None, alias="discount_percent", description="Discount percentage")
    discount_amount: Optional[float] = Field(None, alias="discountAmount", description="Discount amount")
    total_amount: Optional[float] = Field(None, alias="totalAmount", description="Total amount")
    currency_code: Optional[str] = Field(None, alias="currencyCode", description="Currency code")
    ai_summary: Optional[str] = Field(None, alias="aiSummary", description="AI itinerary summary")
    # Added for multiple services support
    service_codes: Optional[List[str]] = Field(None, alias="serviceCodes", description="List of service codes")
    service_items: Optional[List[ServiceItem]] = Field(None, alias="serviceItems", description="List of service items with quantities")

    class Config:
        populate_by_name = True


class TravelInvoice(BaseModel):
    invoice_no: Optional[str] = Field(None, alias="invoiceNo", description="Invoice number")
    quote_no: Optional[str] = Field(None, alias="quoteNo", description="Quote number")
    service_code: Optional[str] = Field(None, alias="serviceCode", description="Service code")
    client_no: Optional[str] = Field(None, alias="clientNo", description="Client number")
    client_name: Optional[str] = Field(None, alias="clientName", description="Client name")
    invoice_date: Optional[date] = Field(None, alias="invoiceDate", description="Invoice date")
    due_date: Optional[date] = Field(None, alias="dueDate", description="Due date")
    status: Optional[str] = Field(None, description="Status (Open, Partial, Paid, Overdue)")
    total_amount: Optional[float] = Field(None, alias="totalAmount", description="Total amount")
    amount_paid: Optional[float] = Field(None, alias="amountPaid", description="Amount paid")
    balance_due: Optional[float] = Field(None, alias="balanceDue", description="Balance due")
    currency_code: Optional[str] = Field(None, alias="currencyCode", description="Currency code")

    class Config:
        populate_by_name = True


class TravelPayment(BaseModel):
    payment_id: Optional[str] = Field(None, alias="paymentId", description="Payment ID")
    client_no: Optional[str] = Field(None, alias="clientNo", description="Client number")
    booking_id: Optional[str] = Field(None, alias="bookingId", description="Booking ID")
    invoice_no: Optional[str] = Field(None, alias="invoiceNo", description="Invoice number")
    amount: float = Field(..., description="Payment amount")
    method: str = Field(..., description="Payment method")
    payment_date: date = Field(..., alias="date", description="Payment date")

    class Config:
        populate_by_name = True


class TravelOffer(BaseModel):
    id: str = Field(..., description="Offer unique identifier")
    title: str = Field(..., description="Offer title")
    destination: Optional[str] = Field(None, description="Offer destination")
    summary: Optional[str] = Field(None, description="Short summary")
    duration_days: Optional[int] = Field(None, alias="durationDays", description="Duration in days")
    price: Optional[float] = Field(None, description="Base price")
    currency: Optional[str] = Field(None, alias="currencyCode", description="Currency code")
    start_date: Optional[date] = Field(None, alias="startDate", description="Start date")
    end_date: Optional[date] = Field(None, alias="endDate", description="End date")
    highlights: List[str] = Field(default_factory=list, description="Key highlights")

    class Config:
        populate_by_name = True


class GenerateItineraryRequest(BaseModel):
    travel_offer_id: str = Field(..., alias="travelOfferId")


class PremiumItineraryResponse(BaseModel):
    offer: TravelOffer
    plan: GenerateResponse
    source: str


class SyncOffersResponse(BaseModel):
    offers: List[TravelOffer]
