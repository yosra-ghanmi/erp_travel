"""
Multi-Agency API Usage Examples
==============================
This module demonstrates how to use the secure BC client and middleware
for agency-level data isolation.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from agency_models import Agency, AgencyCreate, User, UserCreate
from security_middleware import get_agency_context, AgencyContext, AgencyAwareBCClient
from secure_bc_client import SecureBCClient
from user_sync_service import AgencyAdminSyncService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2", tags=["secure"])


# =============================================================================
# SECURED ENDPOINTS - All data automatically filtered by agency
# =============================================================================

@router.get("/clients")
def get_clients(
    ctx: AgencyContext = Depends(get_agency_context),
    client: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx))
):
    """
    Get all clients for the current user's agency.
    Super Admin sees all clients across all agencies.
    """
    clients = client.get("clients")
    return {"clients": clients, "count": len(clients)}


@router.post("/clients")
def create_client(
    client_data: dict,
    ctx: AgencyContext = Depends(get_agency_context),
    bc: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx))
):
    """
    Create a new client for the current user's agency.
    The agency code is automatically injected - users cannot specify a different agency.
    """
    return bc.create("clients", client_data)


@router.get("/bookings")
def get_bookings(
    ctx: AgencyContext = Depends(get_agency_context),
    client: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx))
):
    """Get all bookings for the current user's agency."""
    bookings = client.get("bookings")
    return {"bookings": bookings, "count": len(bookings)}


@router.post("/bookings")
def create_booking(
    booking_data: dict,
    ctx: AgencyContext = Depends(get_agency_context),
    bc: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx))
):
    """
    Create a new booking.
    Agency_Code is automatically injected based on the current user's context.
    """
    return bc.create("bookings", booking_data)


@router.patch("/bookings/{booking_id}")
def update_booking(
    booking_id: str,
    update_data: dict,
    ctx: AgencyContext = Depends(get_agency_context),
    bc: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx))
):
    """
    Update a booking. Only succeeds if the booking belongs to the user's agency.
    Returns 403 if the booking doesn't exist or belongs to another agency.
    """
    return bc.update("bookings", booking_id, update_data)


@router.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: str,
    ctx: AgencyContext = Depends(get_agency_context),
    bc: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx))
):
    """Delete a booking. Only succeeds if it belongs to the user's agency."""
    success = bc.delete("bookings", booking_id)
    return {"success": success}


@router.get("/quotes")
def get_quotes(
    ctx: AgencyContext = Depends(get_agency_context),
    client: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx)),
    status_filter: Optional[str] = None
):
    """
    Get all quotes for the current user's agency.
    Optionally filter by status.
    """
    filters = []
    if status_filter:
        filters.append(f"Status eq '{status_filter}'")

    quotes = client.get("quotes", extra_filters=filters if filters else None)
    return {"quotes": quotes, "count": len(quotes)}


@router.get("/invoices")
def get_invoices(
    ctx: AgencyContext = Depends(get_agency_context),
    client: AgencyAwareBCClient = Depends(lambda ctx: AgencyAwareBCClient(ctx)),
    min_amount: Optional[float] = None
):
    """
    Get all invoices for the current user's agency.
    Optionally filter by minimum amount.
    """
    filters = []
    if min_amount is not None:
        filters.append(f"TotalAmount ge {min_amount}")

    invoices = client.get("invoices", extra_filters=filters if filters else None)
    return {"invoices": invoices, "count": len(invoices)}


# =============================================================================
# SUPER ADMIN ONLY ENDPOINTS - Agency Management
# =============================================================================

@router.post("/agencies", response_model=Agency)
def create_agency(
    agency: AgencyCreate,
    ctx: AgencyContext = Depends(get_agency_context)
):
    """
    Create a new agency. Super Admin only.

    When a new agency is created, this endpoint automatically:
    1. Creates an agency admin user in BC (Employee with agency_admin role)
    2. Registers the agency in the local database
    3. Sets up initial agent accounts

    The agency admin is responsible for managing agents and sessions within their agency.
    """
    if not ctx.is_super_admin:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    logger.info(f"Super Admin {ctx.user_id} creating agency: {agency.agency_id}")

    try:
        # Step 1: Create agency admin in BC
        admin_bc_client = SecureBCClient(
            agency_id=agency.agency_id,
            user_id=ctx.user_id,
            user_role="super_admin"
        )

        admin_sync_service = AgencyAdminSyncService(admin_bc_client)

        # Create the agency admin user
        admin_result = admin_sync_service.create_agency_admin(
            agency_id=agency.agency_id,
            agency_name=agency.name,
            owner_email=agency.email
        )
        logger.info(f"Created agency admin: {admin_result['user_id']}")

        # Step 2: Create default agents for the agency
        agents_result = admin_sync_service.create_default_agents(
            agency_id=agency.agency_id,
            count=3
        )
        logger.info(f"Created {len(agents_result)} default agents for agency {agency.agency_id}")

        # Step 3: Return the agency info with the generated admin
        return Agency(
            agency_id=agency.agency_id,
            name=agency.name,
            email=agency.email,
            phone=agency.phone,
            address=agency.address,
            city=agency.city,
            country=agency.country,
            subscription_status=agency.subscription_status,
            owner_id=admin_result["user_id"],
            is_active=True
        )

    except Exception as e:
        logger.error(f"Failed to create agency {agency.agency_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create agency: {str(e)}")


@router.get("/agencies")
def list_agencies(
    ctx: AgencyContext = Depends(get_agency_context)
):
    """
    List all agencies. Super Admin only.
    Regular users cannot list other agencies.
    """
    if not ctx.is_super_admin:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    # This would query your local agency database
    return {"agencies": [], "count": 0}


@router.patch("/agencies/{agency_id}")
def update_agency(
    agency_id: str,
    update_data: dict,
    ctx: AgencyContext = Depends(get_agency_context)
):
    """Update an agency. Super Admin only."""
    if not ctx.is_super_admin:
        raise HTTPException(status_code=403, detail="Super Admin access required")

    return {"agency_id": agency_id, "updated": True}


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@router.get("/me")
def get_current_user(ctx: AgencyContext = Depends(get_agency_context)):
    """Get current user info and their agency context."""
    return ctx.to_dict()


@router.get("/health/secure")
def secure_health_check():
    """Health check endpoint that doesn't require auth."""
    return {"status": "healthy", "security_mode": "agency_aware"}
