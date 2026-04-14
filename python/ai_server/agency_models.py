"""
Agency and Multi-Tenancy Models
===============================
Pydantic models for multi-agency support in the Travel ERP system.
"""

from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class Agency(BaseModel):
    """Agency/Tenant model representing a travel agency in the system."""
    id: Optional[str] = Field(None, description="Internal ID (AG-001)")
    agency_id: str = Field(..., description="Unique agency identifier (e.g., AG-001)")
    name: str = Field(..., description="Agency legal name")
    logo: Optional[str] = Field(None, description="Agency logo URL")
    email: Optional[str] = Field(None, description="Agency contact email")
    phone: Optional[str] = Field(None, description="Agency contact phone")
    address: Optional[str] = Field(None, description="Agency address")
    city: Optional[str] = Field(None, description="City")
    country: Optional[str] = Field(None, description="Country")
    subscription_status: str = Field("active", description="Subscription status (active, suspended, trial)")
    owner_id: str = Field(..., description="Owner user ID")
    created_at: Optional[date] = Field(None, description="Creation date")
    is_active: bool = Field(True, description="Whether agency is active")


class AgencyCreate(BaseModel):
    """Model for creating a new agency."""
    agency_id: str = Field(..., description="Unique agency identifier")
    name: str = Field(..., description="Agency legal name")
    email: Optional[str] = Field(None, description="Agency contact email")
    phone: Optional[str] = Field(None, description="Agency contact phone")
    address: Optional[str] = Field(None, description="Agency address")
    city: Optional[str] = Field(None, description="City")
    country: Optional[str] = Field(None, description="Country")
    subscription_status: str = Field("trial", description="Initial subscription status")


class AgencyUpdate(BaseModel):
    """Model for updating an agency."""
    name: Optional[str] = Field(None, description="Agency legal name")
    email: Optional[str] = Field(None, description="Agency contact email")
    phone: Optional[str] = Field(None, description="Agency contact phone")
    address: Optional[str] = Field(None, description="Agency address")
    city: Optional[str] = Field(None, description="City")
    country: Optional[str] = Field(None, description="Country")
    subscription_status: Optional[str] = Field(None, description="Subscription status")
    is_active: Optional[bool] = Field(None, description="Whether agency is active")


class User(BaseModel):
    """User model with agency association."""
    user_id: str = Field(..., description="Unique user identifier")
    agency_id: str = Field(..., description="Agency this user belongs to")
    email: str = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    role: str = Field("agent", description="User role (super_admin, agency_admin, agent, finance)")
    is_active: bool = Field(True, description="Whether user is active")


class UserCreate(BaseModel):
    """Model for creating a new user."""
    user_id: str = Field(..., description="Unique user identifier")
    agency_id: str = Field(..., description="Agency this user belongs to")
    email: str = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    role: str = Field("agent", description="User role")


class UserSession(BaseModel):
    """Session model containing authenticated user information."""
    user_id: str
    agency_id: str
    role: str
    email: str
    name: str


# Role definitions for access control
ROLE_PERMISSIONS = {
    "super_admin": {
        "can_manage_agencies": True,
        "can_view_all_agencies": True,
        "can_manage_users": True,
        "can_view_audit_logs": True,
        "bypass_agency_filter": True,
    },
    "agency_admin": {
        "can_manage_agencies": False,
        "can_view_all_agencies": False,
        "can_manage_users": True,
        "can_view_audit_logs": False,
        "bypass_agency_filter": False,
    },
    "agent": {
        "can_manage_agencies": False,
        "can_view_all_agencies": False,
        "can_manage_users": False,
        "can_view_audit_logs": False,
        "bypass_agency_filter": False,
    },
    "finance": {
        "can_manage_agencies": False,
        "can_view_all_agencies": False,
        "can_manage_users": False,
        "can_view_audit_logs": True,
        "bypass_agency_filter": False,
    },
}


def has_permission(role: str, permission: str) -> bool:
    """Check if a role has a specific permission."""
    return ROLE_PERMISSIONS.get(role, {}).get(permission, False)


def is_super_admin(role: str) -> bool:
    """Check if role is super admin (can bypass all filters)."""
    return role == "super_admin"
