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
    Secure Business Central Client with mandatory Navigo role-based filtering.

    This class enforces strict data isolation based on the four Navigo roles:
    1. Superadmin: Global access, no filters.
    2. Finance: Platform-wide financial data only.
    3. Admin: Agency-wide access (filtered by Agency_ID).
    4. Agent: Personal ownership only (filtered by Agent_ID/Salesperson_Code).
    """

    ROLE_SUPERADMIN = "superadmin"
    ROLE_FINANCE = "finance"
    ROLE_ADMIN = "admin"
    ROLE_AGENT = "agent"
    ROLE_HR = "hr"

    AGENCY_CODE_FIELD = "Agency_Code"
    SALESPERSON_CODE_FIELD = "agent_code"
    AGENCY_ID_FIELD = "agency_id"

    # ROLE-BASED ACCESS CONTROL (RBAC)
    # ---------------------------------------------------------
    # Functional Access Mapping (Authorized entities per role)
    ROLE_PERMISSIONS = {
        ROLE_SUPERADMIN: ["agencies", "offers", "services", "clients", "bookings", "quotes", "quote_lines", "invoices", "invoice_lines", "payments", "reservations", "expenses", "staff", "journal_lines"],
        ROLE_FINANCE: ["invoices", "invoice_lines", "payments", "expenses", "staff", "journal_lines"], # Financial entities only
        ROLE_ADMIN: ["clients", "quotes", "quote_lines", "bookings", "services", "offers", "invoices", "invoice_lines", "payments", "reservations", "staff", "expenses", "journal_lines"],
        ROLE_AGENT: ["clients", "quotes", "quote_lines", "bookings", "services", "offers", "reservations", "invoices", "invoice_lines", "payments", "expenses"],
        ROLE_HR: ["staff", "salary_grades", "contracts"]
    }

    # Action Restrictions (Deny specific actions for specific roles)
    ROLE_ACTION_RESTRICTIONS = {
        ROLE_ADMIN: {
            "delete": ["agencies", "services"],
            "create": ["services"],
            "update": ["services"]
        },
        ROLE_AGENT: {
            "delete": ["agencies", "services", "offers", "staff"],
            "create": ["services", "offers"], # Agents still have read-only for these global types
            "update": ["services", "offers"]
        },
        ROLE_HR: {
            "delete": ["agencies", "services", "offers", "quotes", "invoices", "payments"],
            "create": ["agencies", "services", "offers", "quotes", "invoices", "payments"],
            "update": ["agencies", "services", "offers", "quotes", "invoices", "payments"]
        }
    }

    # Mapping of entity types to their BC API endpoints and filter fields
    ENTITY_CONFIG = {
        "clients": {
            "endpoint": "TravelClientAPI",
            "api_endpoint": "travelClients",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "no",
            "writable_fields": ["no", "name", "email", "phone", "country", "notes", "agent_code", "Agency_Code"]
        },
        "bookings": {
            "endpoint": "TravelBookingAPI",
            "api_endpoint": "travelBookings",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "bookingId",
            "writable_fields": ["bookingId", "clientNo", "tripName", "startDate", "endDate", "amount", "notes", "agent_code", "Agency_Code"]
        },
        "quotes": {
            "endpoint": "TravelQuoteAPI",
            "api_endpoint": "travelQuotes",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "quoteNo",
            "writable_fields": ["quoteNo", "clientNo", "lineType", "serviceCode", "quantity", "numberOfNights", "quoteDate", "validUntilDate", "status","discount_percent", "currencyCode", "agent_code", "Agency_Code"]
        },
        "invoices": {
            "endpoint": "TravelInvoiceAPI",
            "api_endpoint": "travelInvoices",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "invoiceNo",
            "writable_fields": ["invoiceNo", "quoteNo", "clientNo", "invoiceDate", "dueDate", "status", "agent_code", "Agency_Code"]
        },
        "payments": {
            "endpoint": "TravelPaymentAPI",
            "api_endpoint": "travelPayments",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "paymentId",
            "writable_fields": ["paymentId", "clientNo", "bookingId", "invoiceNo", "amount", "method", "date", "agent_code", "Agency_Code"]
        },
        "reservations": {
            "endpoint": "TravelReservationAPI",
            "api_endpoint": "travelReservations",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "reservationNo",
            "writable_fields": ["reservationNo", "clientNo", "serviceCode", "reservationDate", "status", "agent_code", "Agency_Code"]
        },
        "services": {
            "endpoint": "TravelServiceAPI",
            "api_endpoint": "travelServices",
            "filter_field": "Agency_Code",
            "agent_field": None,
            "id_field": "code",
            "writable_fields": ["code", "name", "serviceType", "price", "currencyCode", "location", "description", "imageUrl", "Agency_Code"]
        },
        "offers": {
            "endpoint": "TravelOfferAPI",
            "api_endpoint": "travelOffers",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "id",
            "writable_fields": ["id", "title", "destination", "summary", "durationDays", "price", "currencyCode", "startDate", "endDate", "agent_code", "Agency_Code"]
        },
        "expenses": {
            "endpoint": "TravelExpenseAPI",
            "api_endpoint": "travelExpenses",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "expenseId",
            "writable_fields": ["expenseId", "sourceInvoiceId", "recipientId", "expenseType", "amount", "date", "description", "status", "agent_code", "Agency_Code"]
        },
        "quote_lines": {
            "endpoint": "TravelQuoteLineAPI",
            "api_endpoint": "travelQuoteLines",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "lineNo",
            "writable_fields": ["quoteNo", "lineNo", "lineType", "serviceCode", "quantity", "numberOfNights", "agent_code", "Agency_Code"]
        },
        "invoice_lines": {
            "endpoint": "TravelInvoiceLineAPI",
            "api_endpoint": "travelInvoiceLines",
            "filter_field": "Agency_Code",
            "agent_field": "agent_code",
            "id_field": "lineNo",
            "writable_fields": ["invoiceNo", "lineNo", "description", "quantity", "unitPrice", "amount", "agent_code", "Agency_Code"]
        },
        "staff": {
            "endpoint": "EmployeeAPI",
            "api_endpoint": "employees",
            "filter_field": "Agency_Code",
            "agent_field": None,
            "id_field": "no",
            "writable_fields": ["no", "firstName", "lastName", "jobTitle", "status", "Agency_Code"]
        },
        "salary_grades": {
            "endpoint": "SalaryGradeAPI",
            "api_endpoint": "salaryGrades",
            "filter_field": "Agency_Code",
            "agent_field": None,
            "id_field": "code",
            "writable_fields": ["code", "description", "baseSalary", "bonus", "taxDeduction", "Agency_Code"]
        },
        "contracts": {
            "endpoint": "ContractAPI",
            "api_endpoint": "contracts",
            "filter_field": "Agency_Code",
            "agent_field": None,
            "id_field": "contractNo",
            "writable_fields": ["contractNo", "employeeNo", "startDate", "endDate", "status", "Agency_Code"]
        },
        "journal_lines": {
            "endpoint": "TravelJournalLineAPI",
            "api_endpoint": "travelJournalLines",
            "filter_field": "Agency_Code",
            "agent_field": None,
            "id_field": "lineNo",
            "writable_fields": ["journalTemplateName", "journalBatchName", "lineNo", "accountType", "accountNo", "postingDate", "documentNo", "description", "amount", "balAccountType", "balAccountNo", "Agency_Code"]
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
        Initialize the Secure BC Client with Navigo Role Logic.

        Args:
            agency_id: Agency ID (Required for Admin and Agent)
            user_id: Logged-in User ID (Required for Agent)
            user_role: One of (superadmin, finance, admin, agent)
        """
        self.agency_id = agency_id
        self.user_id = user_id
        self.user_role = user_role.lower()
        
        # Superadmin, Finance, and HR have global/platform scope
        self.is_platform_scope = self.user_role in (self.ROLE_SUPERADMIN, self.ROLE_FINANCE, self.ROLE_HR)
        self.is_super_admin = (self.user_role == self.ROLE_SUPERADMIN) or (self.user_role == self.ROLE_HR)

        # SECURITY VALIDATION
        if self.user_role in (self.ROLE_ADMIN, self.ROLE_AGENT) and not agency_id:
            raise AgencySECURITYError(f"Navigo SECURITY: Agency-level role '{self.user_role}' requires Agency_ID.")
        if self.user_role == self.ROLE_AGENT and not user_id:
            raise AgencySECURITYError("Navigo SECURITY: Agent role requires User_ID for personal scope filtering.")

        self.base_url = base_url or os.getenv("BC_BASE_URL", "http://saif-pc:7049/BC250")
        self.company_name = company_name or os.getenv("BC_COMPANY_NAME", "smart travel agency")
        self.auth_mode = auth_mode or os.getenv("BC_AUTH", "basic").lower()
        self.username = username or os.getenv("BC_USERNAME", "")
        self.password = password or os.getenv("BC_PASSWORD", "")

        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self._company_id = None
        self._company_root_cache = None

    def _check_permission(self, action: str, entity_type: str):
        """Verify if the current role is authorized for this entity."""
        # 1. Basic entity authorization
        allowed_entities = self.ROLE_PERMISSIONS.get(self.user_role, [])
        if entity_type not in allowed_entities:
            raise AgencySECURITYError(
                f"Navigo ACCESS DENIED: Role '{self.user_role}' is not authorized to access '{entity_type}'."
            )

        # 2. Functional Restrictions
        restrictions = self.ROLE_ACTION_RESTRICTIONS.get(self.user_role, {})
        restricted_entities = restrictions.get(action, [])
        if entity_type in restricted_entities:
            raise AgencySECURITYError(
                f"Navigo ACCESS DENIED: Role '{self.user_role}' is not authorized to perform '{action}' on '{entity_type}'."
            )

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
        Strictly enforces ownership based on Navigo roles.
        """
        config = self.ENTITY_CONFIG.get(entity_type, {})
        
        # 1. Enforce AgencyID for Agency-level roles (Admin/Agent)
        agency_field = self.AGENCY_CODE_FIELD
        if agency_field in config.get("writable_fields", []):
            if self.user_role in (self.ROLE_ADMIN, self.ROLE_AGENT):
                payload[agency_field] = self.agency_id
            elif self.is_super_admin and agency_field not in payload:
                # Superadmin/HR can specify agency or default to own
                if self.agency_id:
                    payload[agency_field] = self.agency_id

        # 2. Enforce AgentID (Salesperson_Code) for Agent role
        salesperson_field = self.SALESPERSON_CODE_FIELD
        if salesperson_field in config.get("writable_fields", []):
            if self.user_role == self.ROLE_AGENT:
                payload[salesperson_field] = self.user_id
            elif self.user_id and salesperson_field not in payload:
                # Others default to self if not specified
                payload[salesperson_field] = self.user_id

        return payload

    def _get_agency_filter_condition(self, entity_type: str, use_api_field: bool = False) -> Optional[str]:
        """
        Implements Navigo Hierarchical Filtering.
        """
        # 1. Superadmin/HR: No filters (Global scope)
        if self.is_super_admin:
            return None

        # 2. Finance: Platform-wide scope but restricted to financial entities (handled by _check_permission)
        if self.user_role == self.ROLE_FINANCE:
            return None

        config = self.ENTITY_CONFIG.get(entity_type, {})
        conditions = []

        # 3. Admin: Agency-wide scope (record.AgencyID == User.Agency_ID)
        if self.user_role == self.ROLE_ADMIN:
            agency_field = config.get("filter_field")
            if agency_field and self.agency_id:
                conditions.append(f"{agency_field} eq '{self.agency_id}'")

        # 4. Agent: Personal scope (record.AgentID == User_ID)
        elif self.user_role == self.ROLE_AGENT:
            agency_field = config.get("filter_field")
            agent_field = config.get("agent_field")
            
            # Must be in their agency AND be their record
            if agency_field and self.agency_id:
                conditions.append(f"{agency_field} eq '{self.agency_id}'")
            if agent_field and self.user_id:
                conditions.append(f"{agent_field} eq '{self.user_id}'")

        if not conditions:
            return None

        return " and ".join(conditions)

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

    def _sanity_check(self, entity_type: str, filters: Optional[List[str]] = None, payload: Optional[Dict] = None):
        """
        Perform a 'Sanity Check' to prevent cross-tenant data access.
        
        Checks if any provided filter or payload contains an agency_id 
        other than the authenticated one.
        """
        if self.is_super_admin:
            return

        config = self.ENTITY_CONFIG.get(entity_type, {})
        agency_field = config.get("filter_field", self.AGENCY_CODE_FIELD)

        # 1. Check Filters
        if filters:
            for f in filters:
                # Look for patterns like "agency_code eq 'OTHER_ID'" or "Agency_Code eq 'OTHER_ID'"
                import re
                match = re.search(rf"{agency_field}\s+eq\s+'([^']+)'", f, re.IGNORECASE)
                if match:
                    provided_id = match.group(1)
                    if provided_id != self.agency_id:
                        logger.error(f"Sanity Check Failed: Attempted to filter by another agency ID '{provided_id}' (Authorized: '{self.agency_id}')")
                        raise AgencySECURITYError(f"403 Unauthorized: Multi-tenant violation detected. Access to agency '{provided_id}' is forbidden.")

        # 2. Check Payload
        if payload:
            provided_id = payload.get(agency_field)
            if provided_id and provided_id != self.agency_id:
                logger.error(f"Sanity Check Failed: Attempted to write data for another agency ID '{provided_id}' (Authorized: '{self.agency_id}')")
                raise AgencySECURITYError(f"403 Unauthorized: Multi-tenant violation detected. Data injection for agency '{provided_id}' is forbidden.")

    def secure_get(
        self,
        entity_type: str,
        entity_id: Optional[str] = None,
        filters: Optional[List[str]] = None,
        order_by: Optional[str] = None,
        top: Optional[int] = None
    ) -> List[Dict]:
        """
        Perform a SECURE GET with automatic Navigo role filtering.
        """
        self._check_permission("read", entity_type)
        
        # Mandatory Sanity Check
        self._sanity_check(entity_type, filters=filters)
        
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        # 1. Build secure filters (OData style)
        agency_cond = self._get_agency_filter_condition(entity_type, use_api_field=False)
        all_filters = (filters or []).copy()
        if agency_cond:
            all_filters.append(agency_cond)

        # Build query string parts
        query_parts = []
        if all_filters:
            combined = " and ".join(f"({f})" for f in all_filters if f)
            if combined:
                query_parts.append(f"$filter={quote(combined)}")
        
        if order_by:
            query_parts.append(f"$orderby={quote(order_by)}")
        
        if top:
            query_parts.append(f"$top={top}")
            
        query_string = "&".join(query_parts)

        # Try OData first
        odata_error = None
        try:
            if entity_id:
                # Direct lookup by ID in OData
                url = f"{self._company_root()}/{config['endpoint']}('{entity_id}')"
            else:
                url = f"{self._company_root()}/{config['endpoint']}"
                if query_string:
                    url = f"{url}?{query_string}"
            
            logger.info(f"SECURE GET (OData): {url}")
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            
            data = r.json()
            if entity_id:
                # OData direct lookup returns a single object
                result = {k.lower(): v for k, v in data.items()}
                
                # Manual security check for direct ID lookups if filtering didn't happen at source
                # Skip check for global entities (services, offers)
                if not self.is_platform_scope and entity_type not in ("services", "offers"):
                    # Check agency
                    if config.get("filter_field") and result.get(config["filter_field"].lower()) != self.agency_id:
                        raise AgencySECURITYError("Access Denied: Record belongs to another agency.")
                    # Check agent if role is agent
                    if self.user_role == self.ROLE_AGENT and config.get("agent_field") and result.get(config["agent_field"].lower()) != self.user_id:
                        raise AgencySECURITYError("Access Denied: Record belongs to another agent.")
                
                return [result]
            
            # OData list returns { "value": [...] }
            results = [{k.lower(): v for k, v in item.items()} for item in data.get("value", [])]
            if entity_id and not results:
                raise Exception(f"404 Not Found: {entity_type} {entity_id}")
            return results
        except Exception as e:
            if isinstance(e, AgencySECURITYError): raise e
            if "404 Not Found" in str(e): odata_error = str(e)
            else: odata_error = str(e)
            logger.warning(f"OData GET failed for {entity_type}, trying API endpoint: {odata_error}")

        # Fallback to API endpoint
        try:
            # Build API-specific query if needed
            agency_cond_api = self._get_agency_filter_condition(entity_type, use_api_field=True)
            all_filters_api = (filters or []).copy()
            if agency_cond_api:
                all_filters_api.append(agency_cond_api)
                
            query_parts_api = []
            if all_filters_api:
                combined_api = " and ".join(f"({f})" for f in all_filters_api if f)
                if combined_api:
                    query_parts_api.append(f"$filter={quote(combined_api)}")
            
            if order_by:
                query_parts_api.append(f"$orderby={quote(order_by)}")
            if top:
                query_parts_api.append(f"$top={top}")
            
            query_string_api = "&".join(query_parts_api)

            if entity_id:
                url = f"{self._api_company_root()}/{config['api_endpoint']}?$filter={config['id_field']} eq '{entity_id}'"
                if agency_cond_api:
                    url += f" and {agency_cond_api}"
            else:
                url = f"{self._api_company_root()}/{config['api_endpoint']}"
                if query_string_api:
                    url = f"{url}?{query_string_api}"
            
            logger.info(f"SECURE GET (API): {url}")
            r = self.session.get(url, auth=self._auth(), timeout=20)
            r.raise_for_status()
            
            data = r.json()
            results = [{k.lower(): v for k, v in item.items()} for item in data.get("value", [])]
            if entity_id and not results:
                raise Exception(f"404 Not Found: {entity_type} {entity_id}")
            return results
        except Exception as e2:
            if isinstance(e2, AgencySECURITYError): raise e2
            if "404 Not Found" in str(e2): raise e2
            raise Exception(f"SECURE GET Failed for {entity_type}. OData: {odata_error}, API: {e2}")

    def secure_create(
        self,
        entity_type: str,
        payload: Dict,
        id_field: Optional[str] = None
    ) -> Dict:
        """
        Perform a SECURE CREATE with automatic Navigo ownership injection.
        """
        self._check_permission("create", entity_type)
        
        # Mandatory Sanity Check
        self._sanity_check(entity_type, payload=payload)
        
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        # CRITICAL: Inject agency/agent code based on role
        secure_payload = self._inject_agency_code(payload.copy(), entity_type)

        # Filter fields based on ENTITY_CONFIG
        writable_fields = config.get("writable_fields", [])
        if writable_fields:
            secure_payload = {k: v for k, v in secure_payload.items() if k in writable_fields}

        # Try OData first
        try:
            url = f"{self._company_root()}/{config['endpoint']}"
            logger.info(f"SECURE CREATE (OData): {url} with payload: {secure_payload}")
            r = self.session.post(url, auth=self._auth(), json=secure_payload, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e:
            odata_error = str(e)
            logger.info(f"OData create failed, trying API: {odata_error}")

        # Fallback to API endpoint
        try:
            url = f"{self._api_company_root()}/{config['api_endpoint']}"
            logger.info(f"SECURE CREATE (API): {url} with payload: {secure_payload}")
            r = self.session.post(url, auth=self._auth(), json=secure_payload, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e2:
            raise Exception(f"SECURE CREATE Failed for {entity_type}. OData: {odata_error}, API: {e2}")

    # Alias for secure_create
    secure_post = secure_create

    def secure_update(
        self,
        entity_type: str,
        entity_id: str,
        payload: Dict,
        use_etag: bool = True
    ) -> Dict:
        """
        Perform a SECURE UPDATE with Navigo ownership verification.
        """
        self._check_permission("update", entity_type)
        
        # Mandatory Sanity Check
        self._sanity_check(entity_type, payload=payload)
        
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        # Verify ownership before update
        self.secure_get(entity_type, entity_id)

        # Inject/Verify agency code
        secure_payload = self._inject_agency_code(payload.copy(), entity_type)

        # Filter fields based on ENTITY_CONFIG
        writable_fields = config.get("writable_fields", [])
        if writable_fields:
            secure_payload = {k: v for k, v in secure_payload.items() if k in writable_fields}

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
            odata_error = str(e)
            logger.info(f"OData update failed, trying API: {odata_error}")

        # Fallback to API endpoint
        try:
            url = f"{self._api_company_root()}/{config['api_endpoint']}('{entity_id}')"
            logger.info(f"SECURE UPDATE (API): {url}")
            r = self.session.patch(url, auth=self._auth(), json=secure_payload, headers=headers, timeout=20)
            r.raise_for_status()
            return {k.lower(): v for k, v in r.json().items()}
        except Exception as e2:
            raise Exception(f"SECURE UPDATE Failed for {entity_type}/{entity_id}. OData: {odata_error}, API: {e2}")

    def secure_delete(self, entity_type: str, entity_id: str) -> bool:
        """
        Perform a SECURE DELETE with Navigo ownership verification.
        """
        self._check_permission("delete", entity_type)
        
        config = self.ENTITY_CONFIG.get(entity_type)
        if not config:
            raise ValueError(f"Unknown entity type: {entity_type}")

        # Verify ownership before delete
        self.secure_get(entity_type, entity_id)

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
            odata_error = str(e)
            logger.info(f"OData delete failed, trying API: {odata_error}")

        # Fallback to API endpoint
        try:
            url = f"{self._api_company_root()}/{config['api_endpoint']}('{entity_id}')"
            logger.info(f"SECURE DELETE (API): {url}")
            r = self.session.delete(url, auth=self._auth(), headers=headers, timeout=20)
            r.raise_for_status()
            return True
        except Exception as e2:
            raise Exception(f"SECURE DELETE Failed for {entity_type}/{entity_id}. OData: {odata_error}, API: {e2}")


# =============================================================================
# FASTAPI DEPENDENCY / MIDDLEWARE
# =============================================================================

def extract_identity_from_request(request: Request) -> tuple[str, str, str]:
    """
    Extract agency_id, user_role, and user_id from the incoming request.

    In production, this would decode a JWT token or look up the session.
    For this implementation, we support:
    - X-Agency-ID header
    - X-User-Role header
    - X-User-ID header
    - Query parameters as fallback

    Args:
        request: FastAPI Request object

    Returns:
        Tuple of (agency_id, user_role, user_id)
    """
    # Priority 1: Headers (set by upstream auth proxy)
    agency_id = request.headers.get("X-Agency-ID", "")
    user_role = request.headers.get("X-User-Role", "agent").lower()
    user_id = request.headers.get("X-User-ID", "")

    # Priority 2: Query parameters (for development/testing)
    if not agency_id:
        agency_id = request.query_params.get("agency_id", "")
    if not user_role or user_role == "agent":
        user_role = request.query_params.get("user_role", "agent").lower()
    if not user_id:
        user_id = request.query_params.get("user_id", "")

    return agency_id, user_role, user_id


def get_secure_bc_client(request: Request) -> SecureBCClient:
    """
    FastAPI Dependency that creates a SecureBCClient scoped to the current user.

    Usage:
        @app.get("/api/clients")
        def get_clients(client: SecureBCClient = Depends(get_secure_bc_client)):
            return client.secure_get("clients")
    """
    agency_id, user_role, user_id = extract_identity_from_request(request)
    return SecureBCClient(agency_id=agency_id, user_role=user_role, user_id=user_id)


def require_role(required_role: str):
    """
    Decorator/Dependency to require a specific user role.

    Usage:
        @app.get("/admin/stats")
        @require_role("superadmin")
        def admin_stats(client: SecureBCClient = Depends(get_secure_bc_client)):
            ...
    """
    def role_checker(request: Request):
        _, user_role, _ = extract_identity_from_request(request)
        if required_role == "superadmin":
            if user_role != "superadmin":
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
            user_id=os.getenv("DEFAULT_USER_ID", ""),
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
