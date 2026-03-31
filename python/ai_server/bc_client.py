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
        self.base_url = base_url or os.getenv("BC_BASE_URL", "http://localhost:7048/BC250")
        self.company_name = company_name or os.getenv("BC_COMPANY_NAME", "smart travel agency")
        self.auth_mode = os.getenv("BC_AUTH", "basic").lower()
        self.username = os.getenv("BC_USERNAME", "")
        self.password = os.getenv("BC_PASSWORD", "")
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def _auth(self):
        if self.auth_mode == "sspi":
            return HttpNegotiateAuth()
        if self.auth_mode in ("ntlm", "windows") and HttpNtlmAuth:
            return HttpNtlmAuth(self.username, self.password)  # type: ignore
        return HTTPBasicAuth(self.username, self.password)

    def _api_root(self) -> str:
        return _normalize_odata_root(self.base_url)

    def _company_root(self) -> str:
        company_encoded = quote(self.company_name, safe="")
        return f"{self._api_root()}/Company('{company_encoded}')"

    def travel_services(self) -> List[Dict]:
        r = self.session.get(f"{self._company_root()}/TravelServiceAPI", auth=self._auth(), timeout=20)
        r.raise_for_status()
        return r.json().get("value", [])

    def travel_client(self, client_no: str) -> Optional[Dict]:
        url = f"{self._company_root()}/TravelClientAPI?$filter=no eq '{client_no}'"
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
        url = f"{self._company_root()}/TravelClientAPI"
        r = self.session.post(url, auth=self._auth(), json=client_data, timeout=20)
        try:
            r.raise_for_status()
        except requests.exceptions.HTTPError as e:
            # Provide more detailed OData error if available
            try:
                odata_error = r.json().get("error", {}).get("message", str(e))
                raise Exception(odata_error)
            except Exception:
                raise e
        # Normalize keys to lowercase for the frontend
        data = r.json()
        return {k.lower(): v for k, v in data.items()}

    def travel_clients(self) -> List[Dict]:
        """Fetch all clients from Business Central."""
        url = f"{self._company_root()}/TravelClientAPI"
        r = self.session.get(url, auth=self._auth(), timeout=20)
        r.raise_for_status()
        values = r.json().get("value", [])
        # Normalize keys to lowercase for the frontend
        return [{k.lower(): v for k, v in item.items()} for item in values]

    def create_travel_booking(self, booking_data: Dict) -> Dict:
        url = f"{self._company_root()}/TravelBookingAPI"
        r = self.session.post(url, auth=self._auth(), json=booking_data, timeout=20)
        r.raise_for_status()
        return {k.lower(): v for k, v in r.json().items()}

    def travel_bookings(self) -> List[Dict]:
        url = f"{self._company_root()}/TravelBookingAPI"
        r = self.session.get(url, auth=self._auth(), timeout=20)
        r.raise_for_status()
        return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]

    def create_travel_payment(self, payment_data: Dict) -> Dict:
        url = f"{self._company_root()}/TravelPaymentAPI"
        r = self.session.post(url, auth=self._auth(), json=payment_data, timeout=20)
        r.raise_for_status()
        return {k.lower(): v for k, v in r.json().items()}

    def travel_payments(self) -> List[Dict]:
        url = f"{self._company_root()}/TravelPaymentAPI"
        r = self.session.get(url, auth=self._auth(), timeout=20)
        r.raise_for_status()
        return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]

    def create_travel_expense(self, expense_data: Dict) -> Dict:
        url = f"{self._company_root()}/TravelExpenseAPI"
        r = self.session.post(url, auth=self._auth(), json=expense_data, timeout=20)
        r.raise_for_status()
        return {k.lower(): v for k, v in r.json().items()}

    def travel_expenses(self) -> List[Dict]:
        url = f"{self._company_root()}/TravelExpenseAPI"
        r = self.session.get(url, auth=self._auth(), timeout=20)
        r.raise_for_status()
        return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
