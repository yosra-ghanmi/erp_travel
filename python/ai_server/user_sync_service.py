"""
User Sync Service for Business Central
======================================
This service handles the synchronization of platform users (from mock/PostgreSQL)
to Business Central Employee entities.

Mapping:
- user.id -> Employee.No
- user.name -> Employee.First_Name / Last_Name
- user.role -> Employee.Job_Title
- user.agency_id -> Employee.Agency_Code
- user.email -> Employee.Company_Email
"""

import logging
import secrets
import string
from typing import Dict, Any, Optional, List
from secure_bc_client import SecureBCClient

logger = logging.getLogger(__name__)

class UserSyncService:
    def __init__(self, admin_bc_client: SecureBCClient):
        """
        Requires a BC client with Super Admin privileges to manage Employees.
        """
        self.bc = admin_bc_client
        if not self.bc.is_super_admin:
            logger.warning("UserSyncService initialized with non-admin client. Sync may fail.")

    def sync_mock_user_to_bc(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Syncs a single user to Business Central Employee entity.
        
        Args:
            user_data: Dictionary containing user info (id, name, email, role, agency_id)
            
        Returns:
            The created/updated Employee record from BC
        """
        user_id = user_data.get("id")
        full_name = user_data.get("name", "")
        names = full_name.split(" ", 1)
        first_name = names[0]
        last_name = names[1] if len(names) > 1 else ""

        # Map role and agency for isolation/reporting
        # We use jobTitle for role and agency_code for agency isolation
        employee_payload = {
            "no": user_id,
            "firstName": first_name,
            "lastName": last_name,
            "jobTitle": user_data.get("role", "agent"),
            "agency_code": user_data.get("agency_id", ""),
            "companyEmail": user_data.get("email", ""),
            "status": "Active"
        }

        logger.info(f"Syncing user {user_id} ({full_name}) to BC as Employee")

        try:
            # 1. Check if employee exists
            # Note: We use OData V4 direct endpoint for standard entities
            # Standard Employee entity often uses 'Employees' entity set
            url = f"{self.bc._company_root()}/Employees('{user_id}')"
            r = self.bc.session.get(url, auth=self.bc._auth(), timeout=10)
            
            if r.status_code == 200:
                # 2. Update existing
                logger.debug(f"Employee {user_id} exists, updating...")
                headers = {"If-Match": "*"}
                r = self.bc.session.patch(url, auth=self.bc._auth(), json=employee_payload, headers=headers, timeout=10)
                r.raise_for_status()
                return r.json()
            else:
                # 3. Create new
                logger.debug(f"Employee {user_id} not found, creating...")
                create_url = f"{self.bc._company_root()}/Employees"
                r = self.bc.session.post(create_url, auth=self.bc._auth(), json=employee_payload, timeout=10)
                r.raise_for_status()
                return r.json()

        except Exception as e:
            error_msg = f"Failed to sync user {user_id} to BC: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    def get_salesperson_code(self, user_id: str) -> str:
        """
        Returns the Employee No. to be used as Salesperson_Code in BC.
        """
        return user_id


class AgencyAdminSyncService:
    """
    Service for auto-generating an agency admin when a new agency is created.
    The agency admin is responsible for managing agents within their agency.
    """

    def __init__(self, admin_bc_client: SecureBCClient):
        self.bc = admin_bc_client
        if not self.bc.is_super_admin:
            logger.warning("AgencyAdminSyncService initialized with non-admin client. Sync may fail.")

    def _generate_temp_password(self, length: int = 12) -> str:
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        while True:
            password = ''.join(secrets.choice(alphabet) for _ in range(length))
            if (any(c.islower() for c in password)
                    and any(c.isupper() for c in password)
                    and any(c.isdigit() for c in password)
                    and any(c in "!@#$%" for c in password)):
                return password

    def create_agency_admin(
        self,
        agency_id: str,
        agency_name: str,
        admin_email: str,
    ) -> Dict[str, Any]:
        """
        Creates an agency admin user for the newly created agency.

        The admin is responsible for:
        - Managing agents within their agency
        - Creating and managing bookings, quotes, invoices for their agency
        - Agent session management

        Args:
            agency_id: The agency ID (e.g., "AG-001")
            agency_name: The agency name for display purposes
            admin_email: Email that the superadmin entered for the agency admin

        Returns:
            Dictionary with the created admin user data including temporary password
        """
        admin_id = f"ADM-{agency_id}"
        admin_name = f"Admin for {agency_name}"
        if not admin_email or not admin_email.strip():
            raise ValueError("Admin email is required to create an agency admin")

        admin_email = admin_email.strip()
        temp_password = self._generate_temp_password()

        admin_payload = {
            "no": admin_id,
            "firstName": f"Agency",
            "lastName": f"Admin",
            "jobTitle": "admin",
            "agency_code": agency_id,
            "companyEmail": admin_email,
            "status": "Active"
        }

        logger.info(f"Creating agency admin {admin_id} for agency {agency_id}")

        try:
            # Check if admin already exists
            url = f"{self.bc._company_root()}/Employees('{admin_id}')"
            r = self.bc.session.get(url, auth=self.bc._auth(), timeout=10)

            if r.status_code == 200:
                logger.debug(f"Admin {admin_id} already exists, updating...")
                headers = {"If-Match": "*"}
                r = self.bc.session.patch(url, auth=self.bc._auth(), json=admin_payload, headers=headers, timeout=10)
                r.raise_for_status()
                result = r.json()
            else:
                logger.debug(f"Admin {admin_id} not found, creating...")
                create_url = f"{self.bc._company_root()}/Employees"
                r = self.bc.session.post(create_url, auth=self.bc._auth(), json=admin_payload, timeout=10)
                r.raise_for_status()
                result = r.json()

            return {
                "user_id": admin_id,
                "name": admin_name,
                "email": admin_email,
                "password": temp_password,
                "role": "admin",
                "agency_id": agency_id,
                "is_agency_admin": True,
                "bc_employee": result
            }

        except Exception as e:
            error_msg = f"Failed to create agency admin for {agency_id}: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    def create_default_agents(self, agency_id: str, count: int = 3) -> List[Dict[str, Any]]:
        """
        Creates a set of default agent users for the agency.

        Args:
            agency_id: The agency ID
            count: Number of agents to create (default 3)

        Returns:
            List of created agent user data dictionaries
        """
        agents = []
        for i in range(1, count + 1):
            agent_id = f"AGT-{agency_id}-{i:03d}"
            agent_payload = {
                "no": agent_id,
                "firstName": f"Agent",
                "lastName": f"#{i}",
                "jobTitle": "agent",
                "agency_code": agency_id,
                "companyEmail": f"agent{i}@{agency_id.lower().replace('-', '')}.local",
                "status": "Active"
            }

            try:
                url = f"{self.bc._company_root()}/Employees('{agent_id}')"
                r = self.bc.session.get(url, auth=self.bc._auth(), timeout=10)

                if r.status_code == 200:
                    headers = {"If-Match": "*"}
                    r = self.bc.session.patch(url, auth=self.bc._auth(), json=agent_payload, headers=headers, timeout=10)
                    r.raise_for_status()
                else:
                    create_url = f"{self.bc._company_root()}/Employees"
                    r = self.bc.session.post(create_url, auth=self.bc._auth(), json=agent_payload, timeout=10)
                    r.raise_for_status()

                agents.append({
                    "user_id": agent_id,
                    "name": f"Agent #{i}",
                    "role": "agent",
                    "agency_id": agency_id
                })

            except Exception as e:
                logger.warning(f"Failed to create agent {agent_id}: {e}")

        return agents
