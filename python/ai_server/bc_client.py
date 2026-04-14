import os
from typing import Dict, List, Optional
from urllib.parse import quote
import requests
from requests.auth import HTTPBasicAuth
try:
    from requests_ntlm import HttpNtlmAuth  # type: ignore
except Exception:
    HttpNtlmAuth = None  # type: ignore


from requests_negotiate_sspi import HttpNegotiateAuth


def get_azure_ad_token(tenant_id: str, client_id: str, client_secret: str, scope: str) -> str:
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": scope,
    }
    response = requests.post(token_url, data=data, timeout=20)
    response.raise_for_status()
    return response.json().get("access_token", "")


def _normalize_odata_root(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if "/odatav4" in normalized.lower():
        # Already has ODataV4 in path, find where it ends
        parts = normalized.split("/")
        for i, p in enumerate(parts):
            if p.lower() == "odatav4":
                return "/".join(parts[:i+1])
    return f"{normalized}/ODataV4"


def _oauth_company_root(base_url: str, company_name: str) -> str:
    company_encoded = quote(company_name, safe="")
    return f"{_normalize_odata_root(base_url)}/Company('{company_encoded}')"


def fetch_travel_offers(token: str, base_url: str, company_name: str, endpoint: str) -> List[Dict]:
    url = f"{_oauth_company_root(base_url, company_name)}/{endpoint}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json().get("value", [])


def fetch_travel_offer_by_id(token: str, base_url: str, company_name: str, endpoint: str, offer_id: str) -> Optional[Dict]:
    url = f"{_oauth_company_root(base_url, company_name)}/{endpoint}?$filter=id eq '{offer_id}'"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    items = response.json().get("value", [])
    return items[0] if items else None

class BCClient:
    def __init__(self, base_url: Optional[str] = None, company_name: Optional[str] = None):
        self.base_url = base_url or os.getenv("BC_BASE_URL", "http://saif-pc:7049/BC250")
        self.company_name = company_name or os.getenv("BC_COMPANY_NAME", "smart travel agency")
        self.auth_mode = os.getenv("BC_AUTH", "basic").lower()
        self.username = os.getenv("BC_USERNAME", "")
        self.password = os.getenv("BC_PASSWORD", "")
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self._company_id = None

    def _auth(self):
        if self.auth_mode == "sspi":
            return HttpNegotiateAuth()
        if self.auth_mode in ("ntlm", "windows") and HttpNtlmAuth:
            return HttpNtlmAuth(self.username, self.password)  # type: ignore
        return HTTPBasicAuth(self.username, self.password)

    def _get_company_id(self) -> str:
        if self._company_id:
            return self._company_id
        
        # Try to resolve company name to ID via OData
        url = f"{self._api_root()}/Company"
        try:
            r = self.session.get(url, auth=self._auth(), timeout=10)
            r.raise_for_status()
            companies = r.json().get("value", [])
            for c in companies:
                name = c.get("Name", "")
                if name.lower() == self.company_name.lower():
                    self._company_id = c.get("Id")
                    return self._company_id
        except Exception:
            pass

        # Fallback: if we can't get ID, we'll try to use the name in quotes as a last resort
        return quote(self.company_name, safe="")

    def _api_root(self) -> str:
        return _normalize_odata_root(self.base_url)

    def _company_root(self) -> str:
        company_encoded = quote(self.company_name, safe="")
        return f"{self._api_root()}/Company('{company_encoded}')"

    def _api_company_root(self, publisher: str = "SmartTravel", group: str = "Travel", version: str = "v1.0") -> str:
        base = self.base_url.rstrip("/")
        cid = self._get_company_id()
        # If CID looks like a GUID, use it directly. Otherwise use quotes.
        cid_str = cid if "-" in str(cid) else f"'{cid}'"
        return f"{base}/api/{publisher}/{group}/{version}/companies({cid_str})"

    def _handle_error(self, r: requests.Response, prefix: str) -> str:
        try:
            err_data = r.json()
            if isinstance(err_data, dict):
                msg = err_data.get("error", {}).get("message", r.text)
                return f"{prefix}: {msg}"
        except Exception:
            pass
        return f"{prefix}: Status {r.status_code} - {r.text[:200]}"

    def travel_services(self) -> List[Dict]:
        try:
            r = self.session.get(f"{self._company_root()}/TravelServiceAPI", auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e:
            url = f"{self._api_company_root()}/travelServices"
            try:
                r = self.session.get(url, auth=self._auth(), timeout=20)
                r.raise_for_status()
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            except Exception as e2:
                raise Exception(f"BC Data Access Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    def create_travel_service(self, service_data: Dict) -> Dict:
        """Create a new service in Business Central."""
        try:
            url = f"{self._company_root()}/TravelServiceAPI"
            r = self.session.post(url, auth=self._auth(), json=service_data, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e:
            url = f"{self._api_company_root()}/travelServices"
            try:
                r = self.session.post(url, auth=self._auth(), json=service_data, timeout=20)
                r.raise_for_status()
                return {k.lower(): v for k, v in r.json().items()}
            except Exception as e2:
                raise Exception(f"BC Create Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    def delete_travel_service(self, service_code: str) -> None:
        """Delete a service from Business Central."""
        try:
            url = f"{self._company_root()}/TravelServiceAPI('{service_code}')"
            r = self.session.delete(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
        except Exception:
            url = f"{self._api_company_root()}/travelServices('{service_code}')"
            r = self.session.delete(url, auth=self._auth(), timeout=20)
            r.raise_for_status()

    def travel_client(self, client_no: str) -> Optional[Dict]:
        try:
            url = f"{self._company_root()}/TravelClientAPI?$filter=no eq '{client_no}'"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            arr = r.json().get("value", [])
            return arr[0] if arr else None
        except Exception:
            url = f"{self._api_company_root()}/travelClients?$filter=no eq '{client_no}'"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            arr = r.json().get("value", [])
            return arr[0] if arr else None

    def reservations_for_client(self, client_no: str) -> List[Dict]:
        url = f"{self._company_root()}/TravelReservationAPI?$filter=clientNo eq '{client_no}'"
        r = self.session.get(url, auth=self._auth(), timeout=20)
        r.raise_for_status()
        return r.json().get("value", [])

    def reservation(self, reservation_no: str) -> Optional[Dict]:
        url = f"{self._company_root()}/TravelReservationAPI?$filter=reservationNo eq '{reservation_no}'"
        r = self.session.get(url, auth=self._auth(), timeout=20)
        r.raise_for_status()
        arr = r.json().get("value", [])
        return arr[0] if arr else None

    def create_travel_client(self, client_data: Dict) -> Dict:
        """Create a new client in Business Central."""
        try:
            url = f"{self._company_root()}/TravelClientAPI"
            r = self.session.post(url, auth=self._auth(), json=client_data, timeout=20)
            r.raise_for_status()
            data = r.json()
            return {k.lower(): v for k, v in data.items()}
        except Exception as e:
            url = f"{self._api_company_root()}/travelClients"
            try:
                r = self.session.post(url, auth=self._auth(), json=client_data, timeout=20)
                r.raise_for_status()
                data = r.json()
                return {k.lower(): v for k, v in data.items()}
            except Exception as e2:
                raise Exception(f"BC Create Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    def travel_clients(self) -> List[Dict]:
        """Fetch all clients from Business Central."""
        try:
            url = f"{self._company_root()}/TravelClientAPI"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            values = r.json().get("value", [])
            return [{k.lower(): v for k, v in item.items()} for item in values]
        except Exception as e:
            url = f"{self._api_company_root()}/travelClients"
            try:
                r = self.session.get(url, auth=self._auth(), timeout=20)
                r.raise_for_status()
                values = r.json().get("value", [])
                return [{k.lower(): v for k, v in item.items()} for item in values]
            except Exception as e2:
                raise Exception(f"BC Data Access Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    def create_travel_booking(self, booking_data: Dict) -> Dict:
        try:
            url = f"{self._company_root()}/TravelBookingAPI"
            r = self.session.post(url, auth=self._auth(), json=booking_data, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception:
            url = f"{self._api_company_root()}/travelBookings"
            r = self.session.post(url, auth=self._auth(), json=booking_data, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}

    def travel_bookings(self) -> List[Dict]:
        try:
            url = f"{self._company_root()}/TravelBookingAPI"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e:
            url = f"{self._api_company_root()}/travelBookings"
            try:
                r = self.session.get(url, auth=self._auth(), timeout=20)
                r.raise_for_status()
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            except Exception as e2:
                raise Exception(f"BC Data Access Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    def create_travel_reservation(self, reservation_data: Dict) -> Dict:
        try:
            url = f"{self._company_root()}/TravelReservationAPI"
            r = self.session.post(url, auth=self._auth(), json=reservation_data, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e:
            url = f"{self._api_company_root()}/travelReservations"
            try:
                r = self.session.post(url, auth=self._auth(), json=reservation_data, timeout=20)
                r.raise_for_status()
                return {k.lower(): v for k, v in r.json().items()}
            except Exception as e2:
                raise Exception(f"BC Create Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    def travel_reservations(self) -> List[Dict]:
        try:
            url = f"{self._company_root()}/TravelReservationAPI"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e:
            url = f"{self._api_company_root()}/travelReservations"
            try:
                r = self.session.get(url, auth=self._auth(), timeout=20)
                r.raise_for_status()
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            except Exception as e2:
                raise Exception(f"BC Data Access Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    def create_travel_payment(self, payment_data: Dict) -> Dict:
        import time
        errors = []
        # Generate unique ID if not provided
        if not payment_data.get("paymentId"):
            payment_data["paymentId"] = f"PAY-{int(time.time())}"

        try:
            # Try OData first
            url = f"{self._company_root()}/TravelPaymentAPI"
            r = self.session.post(url, auth=self._auth(), json=payment_data, timeout=20)
            if r.ok:
                return {k.lower(): v for k, v in r.json().items()}
            errors.append(self._handle_error(r, "OData"))
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        # Fallback to API Page URL
        url = f"{self._api_company_root()}/travelPayments"
        try:
            r = self.session.post(url, auth=self._auth(), json=payment_data, timeout=20)
            if r.ok:
                return {k.lower(): v for k, v in r.json().items()}
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")

        raise Exception(f"Failed to create payment. Details: {' | '.join(errors)}")

    def travel_payments(self) -> List[Dict]:
        try:
            url = f"{self._company_root()}/TravelPaymentAPI"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e:
            url = f"{self._api_company_root()}/travelPayments"
            try:
                r = self.session.get(url, auth=self._auth(), timeout=20)
                r.raise_for_status()
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            except Exception as e2:
                raise Exception(f"BC Data Access Failed. OData Error: {str(e)}. API Error: {str(e2)}")

    # --- QUOTES ---

    def travel_quotes(self) -> List[Dict]:
        errors = []
        try:
            # Try OData first
            url = f"{self._company_root()}/TravelQuoteAPI"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            errors.append(self._handle_error(r, "OData"))
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        # Fallback to API Page URL
        url = f"{self._api_company_root()}/travelQuotes"
        try:
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")
        
        raise Exception(f"Failed to fetch quotes. Details: {' | '.join(errors)}")

    def create_travel_quote(self, quote_data: Dict) -> Dict:
        errors = []
        # Support for multiple service codes
        service_codes = quote_data.pop("serviceCodes", [])
        
        # Clean read-only fields before sending to BC
        readonly_fields = ["subtotal", "discountAmount", "totalAmount", "clientName", "discount_amount"]
        clean_payload = {k: v for k, v in quote_data.items() if k not in readonly_fields}
        
        # Ensure we don't send empty strings if they should be null
        clean_payload = {k: (None if v == "" else v) for k, v in clean_payload.items()}
        
        try:
            # Create Header
            url = f"{self._company_root()}/TravelQuoteAPI"
            r = self.session.post(url, auth=self._auth(), json=clean_payload, timeout=20)
            if not r.ok:
                errors.append(self._handle_error(r, "OData Header"))
            else:
                header_res = r.json()
                quote_no = header_res.get("quoteNo")
                
                # Create Lines if multiple services provided
                if quote_no and service_codes:
                    for i, sc in enumerate(service_codes):
                        line_payload = {
                            "quoteNo": quote_no,
                            "lineNo": (i + 1) * 10000,
                            "serviceCode": sc,
                            "quantity": 1
                        }
                        l_url = f"{self._company_root()}/TravelQuoteLineAPI"
                        self.session.post(l_url, auth=self._auth(), json=line_payload, timeout=10)
                    
                    # Refresh header to get correct total amount
                    r = self.session.get(f"{url}('{quote_no}')", auth=self._auth(), timeout=10)
                    if r.ok:
                        header_res = r.json()
                
                return {k.lower(): v for k, v in header_res.items()}
                
        except Exception as e:
            errors.append(f"Header: {str(e)}")

        # Fallback to API Page URL
        url = f"{self._api_company_root()}/travelQuotes"
        try:
            r = self.session.post(url, auth=self._auth(), json=clean_payload, timeout=20)
            if r.ok:
                header_res = r.json()
                quote_no = header_res.get("quoteNo")
                if quote_no and service_codes:
                    for i, sc in enumerate(service_codes):
                        line_payload = {
                            "quoteNo": quote_no,
                            "lineNo": (i + 1) * 10000,
                            "serviceCode": sc,
                            "quantity": 1
                        }
                        l_url = f"{self._api_company_root()}/travelQuoteLines"
                        self.session.post(l_url, auth=self._auth(), json=line_payload, timeout=10)
                    r = self.session.get(f"{url}('{quote_no}')", auth=self._auth(), timeout=10)
                    if r.ok:
                        header_res = r.json()
                return {k.lower(): v for k, v in header_res.items()}
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")
        
        raise Exception(f"Failed to create quote. Details: {' | '.join(errors)}")

    def update_travel_quote(self, quote_no: str, quote_data: Dict) -> Dict:
        errors = []
        headers = self.session.headers.copy()
        headers["If-Match"] = "*"
        try:
            # Try OData first
            url = f"{self._company_root()}/TravelQuoteAPI('{quote_no}')"
            r = self.session.patch(url, auth=self._auth(), json=quote_data, headers=headers, timeout=20)
            if r.ok:
                return {k.lower(): v for k, v in r.json().items()}
            errors.append(self._handle_error(r, "OData"))
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        # Fallback to API Page URL
        url = f"{self._api_company_root()}/travelQuotes('{quote_no}')"
        try:
            r = self.session.patch(url, auth=self._auth(), json=quote_data, headers=headers, timeout=20)
            if r.ok:
                return {k.lower(): v for k, v in r.json().items()}
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")
        
        raise Exception(f"Failed to update quote. Details: {' | '.join(errors)}")

    def travel_quote_lines(self, quote_no: str) -> List[Dict]:
        errors = []
        try:
            url = f"{self._company_root()}/TravelQuoteLineAPI?$filter=quoteNo eq '{quote_no}'"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        try:
            url = f"{self._api_company_root()}/travelQuoteLines?$filter=quoteNo eq '{quote_no}'"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e:
            errors.append(f"API: {str(e)}")
        
        return []

    def delete_travel_quote(self, quote_no: str) -> bool:
        errors = []
        headers = self.session.headers.copy()
        headers["If-Match"] = "*"
        try:
            url = f"{self._company_root()}/TravelQuoteAPI('{quote_no}')"
            r = self.session.delete(url, auth=self._auth(), headers=headers, timeout=20)
            if r.ok:
                return True
            errors.append(self._handle_error(r, "OData"))
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        try:
            url = f"{self._api_company_root()}/travelQuotes('{quote_no}')"
            r = self.session.delete(url, auth=self._auth(), headers=headers, timeout=20)
            if r.ok:
                return True
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")
        
        raise Exception(f"Failed to delete quote. Details: {' | '.join(errors)}")

    # --- INVOICES ---

    def travel_invoices(self) -> List[Dict]:
        errors = []
        try:
            # Try OData first
            url = f"{self._company_root()}/TravelInvoiceAPI"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            errors.append(self._handle_error(r, "OData"))
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        # Fallback to API Page URL
        url = f"{self._api_company_root()}/travelInvoices"
        try:
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")
        
        raise Exception(f"Failed to fetch invoices. Details: {' | '.join(errors)}")

    def create_travel_invoice(self, invoice_data: Dict) -> Dict:
        errors = []
        try:
            # Try OData first
            url = f"{self._company_root()}/TravelInvoiceAPI"
            r = self.session.post(url, auth=self._auth(), json=invoice_data, timeout=20)
            if r.ok:
                return {k.lower(): v for k, v in r.json().items()}
            errors.append(self._handle_error(r, "OData"))
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        # Fallback to API Page URL
        url = f"{self._api_company_root()}/travelInvoices"
        try:
            r = self.session.post(url, auth=self._auth(), json=invoice_data, timeout=20)
            if r.ok:
                return {k.lower(): v for k, v in r.json().items()}
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")

        raise Exception(f"Failed to create invoice. Details: {' | '.join(errors)}")

    def travel_invoice_lines(self, invoice_no: str) -> List[Dict]:
        errors = []
        import logging
        logger = logging.getLogger(__name__)
        try:
            url = f"{self._company_root()}/TravelInvoiceLineAPI?$filter=invoiceNo eq '{invoice_no}'"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                lines = [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
                logger.info(f"Fetched {len(lines)} invoice lines for {invoice_no} via OData")
                return lines
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        try:
            url = f"{self._api_company_root()}/travelInvoiceLines?$filter=invoiceNo eq '{invoice_no}'"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            if r.ok:
                lines = [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
                logger.info(f"Fetched {len(lines)} invoice lines for {invoice_no} via API")
                return lines
        except Exception as e:
            errors.append(f"API: {str(e)}")

        logger.warning(f"No invoice lines found for {invoice_no}. Errors: {errors}")
        return []

    def delete_travel_invoice(self, invoice_no: str) -> bool:
        errors = []
        headers = self.session.headers.copy()
        headers["If-Match"] = "*"
        try:
            url = f"{self._company_root()}/TravelInvoiceAPI('{invoice_no}')"
            r = self.session.delete(url, auth=self._auth(), headers=headers, timeout=20)
            if r.ok:
                return True
            errors.append(self._handle_error(r, "OData"))
        except Exception as e:
            errors.append(f"OData: {str(e)}")

        try:
            url = f"{self._api_company_root()}/travelInvoices('{invoice_no}')"
            r = self.session.delete(url, auth=self._auth(), headers=headers, timeout=20)
            if r.ok:
                return True
            errors.append(self._handle_error(r, "API"))
        except Exception as e:
            errors.append(f"API: {str(e)}")
        
        raise Exception(f"Failed to delete invoice. Details: {' | '.join(errors)}")

    def create_travel_expense(self, expense_data: Dict) -> Dict:
        try:
            url = f"{self._company_root()}/TravelExpenseAPI"
            r = self.session.post(url, auth=self._auth(), json=expense_data, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception:
            url = f"{self._api_company_root()}/travelExpenses"
            r = self.session.post(url, auth=self._auth(), json=expense_data, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}

    def travel_expenses(self) -> List[Dict]:
        try:
            url = f"{self._company_root()}/TravelExpenseAPI"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception:
            url = f"{self._api_company_root()}/travelExpenses"
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
