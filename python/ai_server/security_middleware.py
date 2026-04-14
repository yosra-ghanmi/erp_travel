"""
Security Middleware for Multi-Agency Data Isolation
==================================================

This module provides FastAPI dependencies and middleware for enforcing
agency-level data isolation without requiring any AL code changes.

Key Features:
- JWT/Session-based identity extraction
- Automatic $filter injection for GET requests
- Automatic Agency_Code injection for POST/PATCH
- Super Admin bypass for unrestricted access
- Comprehensive audit logging
"""

import os
import logging
from typing import Optional, List, Callable, Dict, Any
from functools import wraps
from fastapi import Request, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AgencyContext:
    """
    Context object holding the current user's agency and role information.
    This is attached to each request and used throughout the request lifecycle.
    """

    def __init__(
        self,
        agency_id: str = "",
        user_id: str = "",
        role: str = "agent",
        email: str = "",
        name: str = "",
        is_super_admin: bool = False,
        is_privileged_role: bool = False
    ):
        self.agency_id = agency_id
        self.user_id = user_id
        self.role = role
        self.email = email
        self.name = name
        self.is_super_admin = is_super_admin
        self.is_privileged_role = is_privileged_role

    def __repr__(self):
        return f"AgencyContext(agency={self.agency_id}, user={self.user_id}, role={self.role})"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agency_id": self.agency_id,
            "user_id": self.user_id,
            "role": self.role,
            "email": self.email,
            "name": self.name,
            "is_super_admin": self.is_super_admin,
            "is_privileged_role": self.is_privileged_role
        }


async def get_agency_context(
    request: Request,
    authorization: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_agency_id: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
) -> AgencyContext:
    """
    FastAPI Dependency that extracts identity from the request.

    Extraction Priority:
    1. JWT token (Authorization: Bearer <token>)
    2. X-Agency-ID, X-User-ID, X-User-Role headers (from upstream auth proxy)
    3. Query parameters (for development/testing only)

    Args:
        request: FastAPI Request object
        authorization: Bearer token credentials
        x_agency_id: Agency ID header
        x_user_id: User ID header
        x_user_role: User role header
        x_user_email: User email header
        x_user_name: User name header

    Returns:
        AgencyContext with the current user's identity
    """
    agency_id = ""
    user_id = ""
    role = "agent"
    email = ""
    name = ""

    # Priority 1: JWT Token (production)
    if authorization and authorization.credentials:
        token = authorization.credentials
        try:
            payload = _decode_jwt_payload(token)
            if payload:
                agency_id = payload.get("agency_id", "")
                user_id = payload.get("sub", payload.get("user_id", ""))
                role = payload.get("role", "agent")
                email = payload.get("email", "")
                name = payload.get("name", "")
                logger.debug(f"JWT payload decoded: agency={agency_id}, role={role}")
        except Exception as e:
            logger.warning(f"JWT decode failed, falling back to headers: {e}")

    # Priority 2: Headers (from auth proxy or downstream service)
    if not agency_id and x_agency_id:
        agency_id = x_agency_id
    if not user_id and x_user_id:
        user_id = x_user_id
    if role == "agent" and x_user_role:
        role = x_user_role
    if not email and x_user_email:
        email = x_user_email
    if not name and x_user_name:
        name = x_user_name

    # Priority 3: Query params (development only)
    if not agency_id:
        agency_id = request.query_params.get("agency_id", "")
    if not user_id:
        user_id = request.query_params.get("user_id", "")
    if role == "agent":
        role = request.query_params.get("user_role", "agent")

    role = role.lower()
    is_super_admin = (role == "super_admin")
    is_privileged_role = role in ("super_admin", "finance")

    # Security: Non-privileged users MUST have an agency_id
    if not is_privileged_role and not agency_id:
        logger.warning(
            f"SECURITY: User {user_id} with role {role} has no agency_id! "
            f"Request path: {request.url.path}"
        )
        raise HTTPException(
            status_code=403,
            detail="Access denied: Missing agency context for non-privileged user"
        )

    context = AgencyContext(
        agency_id=agency_id,
        user_id=user_id,
        role=role,
        email=email,
        name=name,
        is_super_admin=is_super_admin,
        is_privileged_role=is_privileged_role
    )

    logger.info(f"Request context: {context}")
    return context


def _decode_jwt_payload(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a JWT token payload.
    Note: In production, you should verify the signature using the OIDC provider's public keys.
    This implementation only decodes the payload without verification for demonstration.
    """
    try:
        import base64
        import json

        parts = token.split(".")
        if len(parts) != 3:
            return None

        payload_part = parts[1]

        # Add padding if necessary
        padding = 4 - len(payload_part) % 4
        if padding != 4:
            payload_part += "=" * padding

        decoded = base64.urlsafe_b64decode(payload_part)
        return json.loads(decoded)
    except Exception as e:
        logger.warning(f"JWT decode error: {e}")
        return None


def require_agency_filter(func: Callable) -> Callable:
    """
    Decorator that ensures agency filtering is applied to a function.

    Use this to decorate functions that interact with BC data to ensure
    they are always called with proper agency context.
    """
    @wraps(func)
    async def wrapper(*args, agency_context: AgencyContext = None, **kwargs):
        if agency_context is None:
            raise HTTPException(
                status_code=500,
                detail="Internal error: Agency context not provided"
            )

        if not agency_context.is_super_admin and not agency_context.agency_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: Agency filtering required"
            )

        return await func(*args, agency_context=agency_context, **kwargs)

    return wrapper


class AgencyAwareBCClient:
    """
    Wrapper that makes any BCClient agency-aware.

    Usage:
        @app.get("/api/clients")
        def get_clients(ctx: AgencyContext = Depends(get_agency_context)):
            client = AgencyAwareBCClient(ctx)
            return client.get("clients")
    """

    # Entity configuration for agency-aware operations
    ENTITY_CONFIG = {
        "clients": {
            "endpoint": "TravelClientAPI",
            "api_endpoint": "travelClients",
            "id_field": "no",
            "agency_field": "Agency_Code",
        },
        "bookings": {
            "endpoint": "TravelBookingAPI",
            "api_endpoint": "travelBookings",
            "id_field": "bookingId",
            "agency_field": "Agency_Code",
        },
        "quotes": {
            "endpoint": "TravelQuoteAPI",
            "api_endpoint": "travelQuotes",
            "id_field": "quoteNo",
            "agency_field": "Agency_Code",
        },
        "invoices": {
            "endpoint": "TravelInvoiceAPI",
            "api_endpoint": "travelInvoices",
            "id_field": "invoiceNo",
            "agency_field": "Agency_Code",
        },
        "payments": {
            "endpoint": "TravelPaymentAPI",
            "api_endpoint": "travelPayments",
            "id_field": "paymentId",
            "agency_field": "Agency_Code",
        },
        "reservations": {
            "endpoint": "TravelReservationAPI",
            "api_endpoint": "travelReservations",
            "id_field": "reservationNo",
            "agency_field": "Agency_Code",
        },
        "expenses": {
            "endpoint": "TravelExpenseAPI",
            "api_endpoint": "travelExpenses",
            "id_field": "expenseId",
            "agency_field": "Agency_Code",
        },
    }

    def __init__(self, agency_context: AgencyContext):
        from secure_bc_client import SecureBCClient
        self.ctx = agency_context
        self._client = SecureBCClient(
            agency_id=agency_context.agency_id,
            user_id=agency_context.user_id,
            user_role=agency_context.role
        )

    def get(self, entity_type: str, entity_id: str = None, extra_filters: List[str] = None) -> List[Dict]:
        """
        Perform a secured GET with automatic agency filtering.

        Args:
            entity_type: Type of entity (clients, bookings, etc.)
            entity_id: Optional specific ID to fetch
            extra_filters: Additional OData filters (will be AND'd with agency filter)

        Returns:
            List of records (empty if access denied)
        """
        if self.ctx.is_super_admin:
            return self._client.secure_get(entity_type, entity_id, extra_filters)

        if entity_id:
            result = self._client.secure_get(entity_type, entity_id, extra_filters)
            if result and len(result) > 0:
                return result
            return []

        return self._client.secure_get(entity_type, filters=extra_filters)

    def create(self, entity_type: str, payload: Dict) -> Dict:
        """
        Perform a secured CREATE with automatic agency injection.

        Args:
            entity_type: Type of entity being created
            payload: The data to create

        Returns:
            Created record

        Raises:
            AgencySECURITYError: If user tries to inject different agency
        """
        from secure_bc_client import AgencySECURITYError

        try:
            return self._client.secure_create(entity_type, payload)
        except AgencySECURITYError:
            raise HTTPException(
                status_code=403,
                detail="Access denied: Cannot create records for another agency"
            )

    def update(self, entity_type: str, entity_id: str, payload: Dict) -> Dict:
        """
        Perform a secured UPDATE with agency verification.

        Args:
            entity_type: Type of entity being updated
            entity_id: ID of the record
            payload: Update data

        Returns:
            Updated record
        """
        from secure_bc_client import AgencySECURITYError

        try:
            return self._client.secure_update(entity_type, entity_id, payload)
        except AgencySECURITYError as e:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied: {str(e)}"
            )

    def delete(self, entity_type: str, entity_id: str) -> bool:
        """
        Perform a secured DELETE with agency verification.
        """
        from secure_bc_client import AgencySECURITYError

        try:
            return self._client.secure_delete(entity_type, entity_id)
        except AgencySECURITYError as e:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied: {str(e)}"
            )


# =============================================================================
# AUDIT LOGGING
# =============================================================================

async def log_request(
    request: Request,
    agency_context: AgencyContext = Depends(get_agency_context)
):
    """
    Middleware-style dependency that logs all requests with agency context.

    This helps with:
    - Security auditing (who accessed what)
    - Troubleshooting data isolation issues
    - Compliance and regulatory requirements
    """
    log_data = {
        "method": request.method,
        "path": request.url.path,
        "agency_id": agency_context.agency_id,
        "user_id": agency_context.user_id,
        "role": agency_context.role,
        "client_ip": request.client.host if request.client else "unknown",
    }

    if request.method in ("POST", "PATCH", "PUT", "DELETE"):
        logger.info(f"AUDIT: {log_data}")
    else:
        logger.debug(f"REQUEST: {log_data}")
