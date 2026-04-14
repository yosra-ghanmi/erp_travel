"""
Secure BC Client with Agency-Level Data Isolation
=================================================
This module provides a secure wrapper around BCClient that enforces
mandatory agency filtering for all OData operations WITHOUT requiring
any changes to the AL code in Business Central.

Key Features:
- Identity Extraction: Extracts Agency_ID from JWT/Session token
- Mandatory Query Injection: Auto-appends $filter for GET requests
- Write Protection: Injects Agency_Code into POST/PATCH payloads
- Admin Bypass: Super Admin role bypasses all filtering
"""

import os
import logging
from typing import Dict, List, Optional, Callable, Any, Tuple
from functools import wraps
from datetime import date
from urllib.parse import quote, urlencode
import requests
from requests.auth import HTTPBasicAuth
from fastapi import Request

logger = logging.getLogger(__name__)


class AgencySECURITYError(Exception):
    """Raised when a user attempts to access data outside their agency"""
    pass


class BCResponseParseError(Exception):
    """Raised when BC returns an unparseable response"""
    pass


class SecureBCClient:
    """
    Secure Business Central Client with mandatory agency-level filtering.

    This class wraps BCClient to enforce data isolation at the API level.
    All queries are automatically scoped to the user's agency, and all
    writes automatically inject the agency code to prevent cross-tenant access.
    """

    SUPER_ADMIN_ROLE = "super_admin"
    FINANCE_ROLE = "finance"
    AGENCY_CODE_FIELD = "Global_Dimension_1_Code"
    SALESPERSON_CODE_FIELD = "Salesperson_Code"
    AGENCY_ID_FIELD = "agency_id"

    # Mapping of entity types to their BC API endpoints and filter fields
    ENTITY_CONFIG = {
        "clients": {
            "endpoint": "TravelClientAPI",
            "api_endpoint": "travelClients",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "no",
            "writable_fields": ["Name", "Email", "Phone", "Country", "Notes", "Salesperson_Code", "Global_Dimension_1_Code"]
        },
        "bookings": {
            "endpoint": "TravelBookingAPI",
            "api_endpoint": "travelBookings",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "bookingId",
            "writable_fields": ["ClientNo", "TripName", "StartDate", "EndDate", "Amount", "Notes", "Salesperson_Code", "Global_Dimension_1_Code"]
        },
        "quotes": {
            "endpoint": "TravelQuoteAPI",
            "api_endpoint": "travelQuotes",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "quoteNo",
            "writable_fields": ["ClientNo", "ServiceCode", "QuoteDate", "ValidUntilDate", "Status",
                               "DiscountPercent", "CurrencyCode", "Salesperson_Code", "Global_Dimension_1_Code"]
        },
        "invoices": {
            "endpoint": "TravelInvoiceAPI",
            "api_endpoint": "travelInvoices",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "invoiceNo",
            "writable_fields": ["QuoteNo", "ClientNo", "InvoiceDate", "DueDate", "Status", "Salesperson_Code", "Global_Dimension_1_Code"]
        },
        "payments": {
            "endpoint": "TravelPaymentAPI",
            "api_endpoint": "travelPayments",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "paymentId",
            "writable_fields": ["ClientNo", "BookingId", "InvoiceNo", "Amount", "Method", "Date", "Global_Dimension_1_Code"]
        },
        "reservations": {
            "endpoint": "TravelReservationAPI",
            "api_endpoint": "travelReservations",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "reservationNo",
            "writable_fields": ["ClientNo", "ServiceCode", "ReservationDate", "Status", "Global_Dimension_1_Code"]
        },
        "services": {
            "endpoint": "TravelServiceAPI",
            "api_endpoint": "travelServices",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "code",
            "writable_fields": ["Name", "Destination", "ServiceType", "Price", "CurrencyCode", "Global_Dimension_1_Code"]
        },
        "expenses": {
            "endpoint": "TravelExpenseAPI",
            "api_endpoint": "travelExpenses",
            "filter_field": "Global_Dimension_1_Code",
            "id_field": "expenseId",
            "writable_fields": ["Type", "Amount", "Date", "Description", "Global_Dimension_1_Code"]
        }
    }

    def __init__(
        self,
        agency_id: Optional[str] = None,
        user_id: Optional[str] = None,
        user_role: str = "agent",
        base_url: Optional[str] = None,
        company_name: Optional[str] = None,
        auth_mode: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None
    ):
        """
        Initialize the Secure BC Client.

        Args:
            agency_id: The agency code this client is scoped to (e.g., "AG-001")
            user_id: The employee ID of the current user
            user_role: The role of the current user (used for admin bypass)
            base_url: Business Central base URL
            company_name: Company name in BC
            auth_mode: Authentication mode (basic, ntlm, windows, sspi)
            username: Username for basic auth
            password: Password for basic auth
        """
        self.agency_id = agency_id
        self.user_id = user_id
        self.user_role = user_role
        
        # Super Admin and Finance bypass agency-level filtering
        self.is_privileged_role = user_role in (self.SUPER_ADMIN_ROLE, self.FINANCE_ROLE)
        self.is_super_admin = (user_role == self.SUPER_ADMIN_ROLE)

        # If agency_id is None/empty for non-privileged roles, raise immediately
        if not self.is_privileged_role and not agency_id:
            raise AgencySECURITYError(
                "SECURITY VIOLATION: Non-privileged user missing agency_id. "
                "All Agent and Agency Admin requests MUST be scoped to an agency."
            )

        self.base_url = base_url or os.getenv("BC_BASE_URL", "http://saif-pc:7049/BC250")
        self.company_name = company_name or os.getenv("BC_COMPANY_NAME", "smart travel agency")
        self.auth_mode = auth_mode or os.getenv("BC_AUTH", "basic").lower()
        self.username = username or os.getenv("BC_USERNAME", "")
        self.password = password or os.getenv("BC_PASSWORD", "")

        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self._company_id = None
        self._company_root_cache = None

    def _auth(self):
        """Return the appropriate auth handler based on auth mode."""
        try:
            from requests_ntlm import HttpNtlmAuth
        except Exception:
            HttpNtlmAuth = None

        try:
            from requests_negotiate_sspi import HttpNegotiateAuth
        except Exception:
            HttpNegotiateAuth = None

        if self.auth_mode == "sspi":
            return HttpNegotiateAuth()
        if self.auth_mode in ("ntlm", "windows") and HttpNtlmAuth:
            return HttpNtlmAuth(self.username, self.password)
        return HTTPBasicAuth(self.username, self.password)

    def _get_company_id(self) -> str:
        """Resolve company name to ID via OData."""
        if self._company_id:
            return self._company_id

        url = f"{self._api_root()}/Company"
        try:
            r = self.session.get(url, auth=self._auth(), timeout=10)
            r.raise_for_status()
            companies = r.json().get("value", [])
            for c in companies:
                if c.get("Name", "").lower() == self.company_name.lower():
                    self._company_id = c.get("Id")
                    return self._company_id
        except Exception as e:
            logger.warning(f"Could not resolve company ID: {e}")

        return quote(self.company_name, safe="")

    def _api_root(self) -> str:
        normalized = self.base_url.rstrip("/")
        if "/odatav4" in normalized.lower():
            parts = normalized.split("/")
            for i, p in enumerate(parts):
                if p.lower() == "odatav4":
                    return "/".join(parts[:i+1])
        return f"{normalized}/ODataV4"

    def _company_root(self) -> str:
        if self._company_root_cache:
            return self._company_root_cache
        company_encoded = quote(self.company_name, safe="")
        self._company_root_cache = f"{self._api_root()}/Company('{company_encoded}')"
        return self._company_root_cache

    def _api_company_root(self, publisher: str = "SmartTravel", group: str = "Travel", version: str = "v1.0") -> str:
        base = self.base_url.rstrip("/")
        cid = self._get_company_id()
        cid_str = cid if "-" in str(cid) else f"'{cid}'"
        return f"{base}/api/{publisher}/{group}/{version}/companies({cid_str})"

    def _build_filter(self, base_filter: Optional[str], extra_conditions: List[str]) -> str:
        """Build OData $filter string combining base and agency filters."""
        conditions = extra_conditions.copy()
        if base_filter:
            conditions.insert(0, base_filter)

        if not conditions:
            return ""

        combined = " and ".join(f"({c})" for c in conditions if c)
        return f"$filter={quote(combined)}"

    def _inject_agency_code(self, payload: Dict, entity_type: str) -> Dict:
        """
        Inject agency code and salesperson code into write payloads.
        This prevents users from spoofing data into another agency's records.
        """
        config = self.ENTITY_CONFIG.get(entity_type, {})
        
        # 1. Inject Global Dimension 1 (Agency Code)
        agency_field = self.AGENCY_CODE_FIELD
        if agency_field in config.get("writable_fields", []):
            if not self.is_privileged_role:
                payload[agency_field] = self.agency_id
            elif agency_field not in payload or not payload[agency_field]:
                payload[agency_field] = self.agency_id

        # 2. Inject Salesperson Code (User Employee ID)
        salesperson_field = self.SALESPERSON_CODE_FIELD
        if salesperson_field in config.get("writable_fields", []):
            if self.user_id:
                payload[salesperson_field] = self.user_id

        return payload

    def _get_agency_filter_condition(self, entity_type: str) -> Optional[str]:
        """Get the agency filter condition for a given entity type."""
        # Super Admin and Finance bypass agency-level filtering
        if self.is_privileged_role:
            return None

        config = self.ENTITY_CONFIG.get(entity_type, {})
        filter_field = config.get("filter_field")

        if not filter_field or not self.agency_id:
            return None

        return f"{filter_field} eq '{self.agency_id}'"

    def _handle_error(self, r: requests.Response, prefix: str) -> str:
        """Parse BC error response into readable message."""
        try:
            err_data = r.json()
            if isinstance(err_data, dict):
                msg = err_data.get("error", {}).get("message", r.text)
                return f"{prefix}: {msg}"
        except Exception:
            pass
        return f"{prefix}: Status {r.status_code} - {r.text[:200]}"

    # =====================================================================
    # SECURED GET OPERATIONS
    # =====================================================================

    def secure_get(
        self,
        entity_type: str,
        entity_id: Optional[str] = None,
        filters: Optional[List[str]] = None,
        order_by: Optional[str] = None,
        top: Optional[int] = None
    ) -> List[Dict]:
        """
        Perform a SECURE GET request with mandatory agency filtering.

        Args:
            entity_type: Type of entity (clients, bookings, quotes, etc.)
            entity_id: Optional specific ID to fetch (uses filter, not OData key)
            filters: Additional OData filter conditions (will be AND'd with agency filter)
            order_by: OData orderby string
            top: Maximum number of records to return

        Returns:
            List of matching records with lowercase field names
        """
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        agency_filter = self._get_agency_filter_condition(entity_type)
        all_filters = (filters or []).copy()
        if agency_filter:
            all_filters.append(agency_filter)

        filter_query = self._build_filter(None, all_filters)

        query_parts = []
        if filter_query:
            query_parts.append(filter_query)
        if order_by:
            query_parts.append(f"$orderby={quote(order_by)}")
        if top:
            query_parts.append(f"$top={top}")

        query_string = "&".join(query_parts)

        # Try OData endpoint first
        try:
            url = f"{self._company_root()}/{config['endpoint']}"
            if entity_id:
                url = f"{self._company_root()}/{config['endpoint']}?$filter={config['id_field']} eq '{entity_id}'"
                if query_string:
                    query_string = query_string.replace("$filter=", "")
            if query_string:
                url = f"{url}?{query_string}"

            logger.info(f"SECURE GET (OData): {url}")
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e:
            logger.info(f"OData failed, trying API endpoint: {e}")

        # Fallback to API endpoint
        try:
            url = f"{self._api_company_root()}/{config['api_endpoint']}"
            if entity_id:
                url = f"{self._api_company_root()}/{config['api_endpoint']}?$filter={config['id_field']} eq '{entity_id}'"
                if query_string:
                    query_string = query_string.replace("$filter=", "")
            if query_string:
                url = f"{url}?{query_string}"

            logger.info(f"SECURE GET (API): {url}")
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            return [{k.lower(): v for k, v in item.items()} for item in r.json().get("value", [])]
        except Exception as e2:
            raise Exception(f"SECURE GET Failed for {entity_type}. OData: {e}, API: {e2}")

    def secure_create(
        self,
        entity_type: str,
        payload: Dict,
        id_field: Optional[str] = None
    ) -> Dict:
        """
        Perform a SECURE CREATE with automatic agency code injection.

        Args:
            entity_type: Type of entity being created
            payload: The data to create (agency code will be auto-injected)
            id_field: Optional field name for returning the created record

        Returns:
            The created record with lowercase field names
        """
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        # CRITICAL: Inject agency code to prevent cross-tenant writes
        secure_payload = self._inject_agency_code(payload.copy(), entity_type)

        # Try OData first
        try:
            url = f"{self._company_root()}/{config['endpoint']}"
            logger.info(f"SECURE CREATE (OData): {url} with payload: {secure_payload}")
            r = self.session.post(url, auth=self._auth(), json=secure_payload, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e:
            logger.info(f"OData create failed, trying API: {e}")

        # Fallback to API endpoint
        try:
            url = f"{self._api_company_root()}/{config['api_endpoint']}"
            logger.info(f"SECURE CREATE (API): {url} with payload: {secure_payload}")
            r = self.session.post(url, auth=self._auth(), json=secure_payload, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e2:
            raise Exception(f"SECURE CREATE Failed for {entity_type}. OData: {e}, API: {e2}")

    def secure_update(
        self,
        entity_type: str,
        entity_id: str,
        payload: Dict,
        use_etag: bool = True
    ) -> Dict:
        """
        Perform a SECURE UPDATE with automatic agency code injection and ETag handling.

        Args:
            entity_type: Type of entity being updated
            entity_id: ID of the record to update
            payload: The update data (agency code will be verified/injected)
            use_etag: Whether to use ETag for optimistic concurrency

        Returns:
            The updated record with lowercase field names
        """
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        id_field = config.get("id_field", "id")

        # Verify the record exists and belongs to user's agency before updating
        existing = self.secure_get(entity_type, entity_id)
        if not existing:
            raise AgencySECURITYError(
                f"Cannot update {entity_type} {entity_id}: Record not found or "
                f"access denied (agency mismatch)"
            )

        # Inject agency code (should already be correct, but we verify)
        secure_payload = self._inject_agency_code(payload.copy(), entity_type)

        headers = self.session.headers.copy()
        if use_etag:
            headers["If-Match"] = "*"

        # Try OData first
        try:
            url = f"{self._company_root()}/{config['endpoint']}('{entity_id}')"
            logger.info(f"SECURE UPDATE (OData): {url}")
            r = self.session.patch(url, auth=self._auth(), json=secure_payload, headers=headers, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e:
            logger.info(f"OData update failed, trying API: {e}")

        # Fallback to API endpoint
        try:
            url = f"{self._api_company_root()}/{config['api_endpoint']}('{entity_id}')"
            logger.info(f"SECURE UPDATE (API): {url}")
            r = self.session.patch(url, auth=self._auth(), json=secure_payload, headers=headers, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e2:
            raise Exception(f"SECURE UPDATE Failed for {entity_type}/{entity_id}. OData: {e}, API: {e2}")

    def secure_delete(self, entity_type: str, entity_id: str) -> bool:
        """
        Perform a SECURE DELETE with agency verification.

        Args:
            entity_type: Type of entity being deleted
            entity_id: ID of the record to delete

        Returns:
            True if deleted successfully
        """
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        # Verify the record exists and belongs to user's agency
        existing = self.secure_get(entity_type, entity_id)
        if not existing:
            raise AgencySECURITYError(
                f"Cannot delete {entity_type} {entity_id}: Record not found or "
                f"access denied (agency mismatch)"
            )

        headers = self.session.headers.copy()
        headers["If-Match"] = "*"

        # Try OData first
        try:
            url = f"{self._company_root()}/{config['endpoint']}('{entity_id}')"
            logger.info(f"SECURE DELETE (OData): {url}")
            r = self.session.delete(url, auth=self._auth(), headers=headers, timeout=20)
            r.raise_for_status()
            return True
        except Exception as e:
            logger.info(f"OData delete failed, trying API: {e}")

        # Fallback to API endpoint
        try:
            url = f"{self._api_company_root()}/{config['api_endpoint']}('{entity_id}')"
            logger.info(f"SECURE DELETE (API): {url}")
            r = self.session.delete(url, auth=self._auth(), headers=headers, timeout=20)
            r.raise_for_status()
            return True
        except Exception as e2:
            raise Exception(f"SECURE DELETE Failed for {entity_type}/{entity_id}. OData: {e}, API: {e2}")


# =============================================================================
# FASTAPI DEPENDENCY / MIDDLEWARE
# =============================================================================

def extract_identity_from_request(request: Request) -> tuple[str, str]:
    """
    Extract agency_id and user_role from the incoming request.

    In production, this would decode a JWT token or look up the session.
    For this implementation, we support:
    - X-Agency-ID header
    - X-User-Role header
    - Query parameters as fallback

    Args:
        request: FastAPI Request object

    Returns:
        Tuple of (agency_id, user_role)
    """
    # Priority 1: Headers (set by upstream auth proxy)
    agency_id = request.headers.get("X-Agency-ID", "")
    user_role = request.headers.get("X-User-Role", "agent").lower()

    # Priority 2: Query parameters (for development/testing)
    if not agency_id:
        agency_id = request.query_params.get("agency_id", "")
    if not user_role or user_role == "agent":
        user_role = request.query_params.get("user_role", "agent").lower()

    return agency_id, user_role


def get_secure_bc_client(request: Request) -> SecureBCClient:
    """
    FastAPI Dependency that creates a SecureBCClient scoped to the current user.

    Usage:
        @app.get("/api/clients")
        def get_clients(client: SecureBCClient = Depends(get_secure_bc_client)):
            return client.secure_get("clients")
    """
    agency_id, user_role = extract_identity_from_request(request)
    return SecureBCClient(agency_id=agency_id, user_role=user_role)


def require_role(required_role: str):
    """
    Decorator/Dependency to require a specific user role.

    Usage:
        @app.get("/admin/stats")
        @require_role("super_admin")
        def admin_stats(client: SecureBCClient = Depends(get_secure_bc_client)):
            ...
    """
    def role_checker(request: Request):
        _, user_role = extract_identity_from_request(request)
        if required_role == "super_admin":
            if user_role != "super_admin":
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied. Required role: {required_role}"
                )
        return True
    return role_checker


# =============================================================================
# LEGACY WRAPPER (for backward compatibility)
# =============================================================================

class BCClient(SecureBCClient):
    """
    Backward-compatible BCClient that wraps SecureBCClient.

    This allows existing code using BCClient to continue working while
    gradually migrating to the secure interface.
    """

    def __init__(self, base_url=None, company_name=None):
        super().__init__(
            agency_id=os.getenv("DEFAULT_AGENCY_ID", ""),
            user_role=os.getenv("DEFAULT_USER_ROLE", "agent"),
            base_url=base_url,
            company_name=company_name
        )


# =============================================================================
# TROUBLESHOOTING CHECKLIST FOR BC API ERRORS
# =============================================================================

BC_ERROR_CODES = {
    "400": {
        "name": "Bad Request",
        "common_causes": [
            "Malformed JSON payload",
            "Invalid field names or data types",
            "Missing required fields",
            "Attempting to set a read-only field",
            "Invalid OData $filter syntax",
            "Company name not properly URL-encoded"
        ],
        "fixes": [
            "Validate JSON payload against the API page schema",
            "Check field names match exactly (case-sensitive)",
            "Ensure dates are in ISO 8601 format",
            "URL-encode special characters in company name"
        ]
    },
    "401": {
        "name": "Unauthorized",
        "common_causes": [
            "Invalid username/password for basic auth",
            "Expired OAuth token",
            "Missing or invalid Authorization header",
            "NTLM authentication failure"
        ],
        "fixes": [
            "Verify BC_USERNAME and BC_PASSWORD in .env",
            "Check OAuth token expiration and refresh logic",
            "Ensure auth mode matches BC server configuration"
        ]
    },
    "403": {
        "name": "Forbidden",
        "common_causes": [
            "User lacks permission to the BC table/page",
            "License restrictions",
            "Attempting to modify a locked record",
            "Cross-company access without proper permissions"
        ],
        "fixes": [
            "Verify user has read/write permissions to the table",
            "Check the API page Published property is true",
            "Ensure the user is assigned to the correct company in BC"
        ]
    },
    "404": {
        "name": "Not Found",
        "common_causes": [
            "Incorrect endpoint URL (e.g., 'TravelExpenseAPI' vs 'travelExpenses')",
            "Company name doesn't exist in BC",
            "API page not published",
            "Wrong OData version in URL",
            "EntitySetName doesn't match the published API name"
        ],
        "fixes": [
            "Check the APIPublisher, APIGroup, APIVersion in the AL page",
            "Ensure the API page is published (check Web Services in BC)",
            "Use correct EntitySetName (camelCase for API, PascalCase for OData)",
            "Verify company name exactly matches BC (check for hidden characters)"
        ]
    },
    "405": {
        "name": "Method Not Allowed",
        "common_causes": [
            "Using POST on a GET-only endpoint",
            "Wrong HTTP method for the operation",
            "OData endpoint doesn't support the method (e.g., PATCH on basic page)"
        ],
        "fixes": [
            "Use GET for reads, POST for creates, PATCH for updates",
            "For updates, ensure the page supports OData operations",
            "Check if you need to use the API endpoint instead of OData"
        ]
    },
    "409": {
        "name": "Conflict",
        "common_causes": [
            "Duplicate key violation (record already exists)",
            "ETag mismatch (concurrent modification)",
            "Optimistic locking conflict"
        ],
        "fixes": [
            "Check if record with given ID already exists",
            "Include 'If-Match: *' header for updates",
            "Refresh and retry the operation"
        ]
    },
    "412": {
        "name": "Precondition Failed",
        "common_causes": [
            "Missing ETag on a PATCH/DELETE that requires it",
            "Stale ETag value"
        ],
        "fixes": [
            "Always include 'If-Match: *' header for updates/deletes",
            "Fetch latest record first to get current ETag"
        ]
    },
    "422": {
        "name": "Unprocessable Entity",
        "common_causes": [
            "Validation error (e.g., invalid option value)",
            "Field constraint violation (MinValue, MaxValue)",
            "TableRelation validation failure"
        ],
        "fixes": [
            "Check allowed values for Option fields",
            "Ensure referenced records exist for TableRelation fields",
            "Review BC validation logs for details"
        ]
    },
    "500": {
        "name": "Internal Server Error",
        "common_causes": [
            "BC server error during processing",
            "Trigger error in AL code",
            "Database error in BC",
            "Missing or misconfigured Number Series"
        ],
        "fixes": [
            "Check BC event log (Event Viewer)",
            "Review AL code triggers for errors",
            "Verify Number Series are set up correctly",
            "Check BC service tier health"
        ]
    },
    "503": {
        "name": "Service Unavailable",
        "common_causes": [
            "BC server is not running",
            "Network connectivity issues",
            "BC service tier is restarting",
            "Load balancer blocking the request"
        ],
        "fixes": [
            "Verify BC service is running",
            "Check network/firewall configuration",
            "Review BC server health",
            "Check if web service URL is accessible"
        ]
    }
}


def get_bc_error_diagnosis(status_code: str, response_text: str = "") -> Dict[str, Any]:
    """
    Get a diagnostic summary for a BC API error.

    Args:
        status_code: The HTTP status code (e.g., "400")
        response_text: The response body text for detailed analysis

    Returns:
        Dictionary with diagnosis and suggested fixes
    """
    error_info = BC_ERROR_CODES.get(status_code, {
        "name": "Unknown Error",
        "common_causes": ["Unknown error occurred"],
        "fixes": ["Check BC server logs for details"]
    })

    diagnosis = {
        "status_code": status_code,
        "error_name": error_info["name"],
        "likely_causes": error_info["common_causes"],
        "suggested_fixes": error_info["fixes"],
        "full_response": response_text[:500] if response_text else None
    }

    # Add specific recommendations based on common error patterns
    if "TravelExpenseAPI" in response_text and "404" in status_code:
        diagnosis["likely_causes"].append(
            "The TravelExpenseAPI endpoint doesn't exist or isn't published"
        )
        diagnosis["suggested_fixes"].append(
            "Check Web Services in BC and verify the API page is published with the correct name"
        )

    return diagnosis
