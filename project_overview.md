# Smart Travel ERP System: Project Overview

## 1. Project Vision
The **Smart Travel ERP System** is a cutting-edge solution designed to modernize travel agency operations. It bridges the gap between robust enterprise resource planning (ERP) and modern, AI-driven user experiences. By integrating Microsoft Dynamics 365 Business Central with a custom Python AI middleware and a high-performance React frontend, the system provides a seamless end-to-end workflow for travel agents and administrators.

---

## 2. Architecture & Tech Stack

### 2.1 Frontend (The Modern UI)
- **Technology**: React.js with Vite, Tailwind CSS for styling.
- **Key Modules**:
  - **AI Planner**: Interface for generating and viewing AI-crafted travel itineraries.
  - **Dashboard**: Real-time analytics and KPI tracking.
  - **Financial Suite**: Comprehensive management of Invoices, Payments, and Expenses.
  - **CRM**: Client management with preference tracking.
  - **Admin Panel**: Multi-tenancy support for different agencies and staff management.
- **Communication**: Uses Axios with custom interceptors for role-based security and agency isolation (X-Agency-ID headers).

### 2.2 Backend AI Server (The Intelligence Hub)
- **Technology**: Python (FastAPI), Pydantic for data validation.
- **AI Integration**: Dual support for **OpenAI (GPT-4o)** and **Google Gemini (1.5 Flash)**.
- **ERP Integration**: Custom `SecureBCClient` for secure, multi-tenant communication with Business Central via OData V4 and REST APIs.
- **Services**:
  - `UserSyncService`: Syncs platform users to Business Central Employees.
  - `PayrollService`: Automates monthly salary generation and BC journal entries.
  - `ExpenseService`: Synchronizes travel-related invoices to expense records.

### 2.3 Business Central Extension (The Core ERP)
- **Technology**: AL (Application Language) for Microsoft Dynamics 365 Business Central.
- **Custom Schema**:
  - **Travel Offers & Services**: Product catalog management.
  - **Travel Bookings & Reservations**: Transactional records.
  - **Travel Invoices & Payments**: Financial accounting.
- **Integration Points**: Dedicated API pages and Codeunits that allow the Python server to trigger business logic directly within the ERP.

---

## 3. Key Features

### 3.1 AI-Powered Itinerary Generation
One of the standout features is the ability to generate detailed, day-by-day travel itineraries. The system analyzes:
- Client preferences (e.g., "likes luxury," "budget-conscious").
- Booked services (flights, hotels, tours).
- Geographic locations (latitude/longitude) for logical routing.
The AI produces a JSON-structured itinerary including themes, activities, and local tips, which is then rendered in the UI and stored in the ERP.

### 3.2 Multi-Agency & Multi-Tenancy
The system is built from the ground up to support multiple travel agencies.
- **Agency Isolation**: Each agency sees only its own data.
- **Secure BC Access**: The Python server manages different sets of credentials and company contexts in Business Central.
- **Role-Based Access**: Distinguishes between Super Admins, Agency Admins, and Travel Agents.

### 3.3 Automated Financial Workflows
- **Invoice-to-Expense Sync**: Automatically creates expense records when travel invoices are processed.
- **Payroll Automation**: Generates payroll for agency staff and posts it to the General Ledger in Business Central.
- **Real-time Sync**: Ensures that financial data in the React UI is always consistent with the ERP records.

---

## 4. Business Logic Flow
1. **Client & Offer**: An agent selects a Travel Offer for a Client.
2. **Booking**: A Travel Booking is created in the system.
3. **Reservation**: Specific services (flights, hotels) are reserved.
4. **AI Planning**: The agent triggers the AI Planner, which calls the Python AI Server to design a program.
5. **Invoicing**: Once confirmed, a Travel Invoice is generated in Business Central.
6. **Payment**: The client pays, and the Travel Payment is recorded and synced.

---

## 5. Summary
This project represents a sophisticated integration of ERP stability and AI innovation. It empowers travel agencies to provide personalized experiences while maintaining strict financial controls and operational efficiency.
