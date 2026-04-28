# Detailed Project File Documentation

This document provides a comprehensive list of all files in the **Smart Travel ERP System**, along with their descriptions and functional roles.

---

## 1. Business Central Extension (AL Source)
Located in `src/`, this is the core ERP logic developed in Application Language (AL).

### 1.1 Tables (`src/Tables/`)
- **AIItinerary.al**: Stores the AI-generated travel plans, linked to reservations.
- **EmployeeExt.al**: Extends the standard Employee table to include agency-specific fields.
- **GenJournalLineExt.al**: Extends journal lines to support automated payroll posting.
- **TravelBooking.al**: Defines the schema for transactional travel bookings.
- **TravelClient.al**: Stores customer profiles and travel preferences.
- **TravelDashboardCue.al**: Defines the data structure for dashboard tiles (KPIs).
- **TravelExpense.al**: Manages expense records linked to travel services.
- **TravelInvoiceHeader.al / TravelInvoiceLine.al**: Defines the custom invoicing schema.
- **TravelOffer.al**: Product catalog for travel packages.
- **TravelPayment.al / TravelPaymentEntry.al**: Tracks financial settlements.
- **TravelQuoteHeader.al / TravelQuoteLine.al**: Manages pre-booking price quotes.
- **TravelReservation.al**: Specific service reservations within a booking.
- **TravelService.al**: Catalog of available services (flights, hotels, etc.).

### 1.2 Pages (`src/Pages/`)
- **TravelBookingList.al**: List view for managing all travel bookings.
- **TravelClientList.al**: Customer management interface.
- **TravelDashboard.al**: Role-center page with real-time KPI cues.
- **TravelInvoiceCard.al / TravelInvoiceList.al / TravelInvoiceSubform.al**: Complete UI for invoice management.
- **TravelOfferList.al**: Interface for browsing and creating travel packages.
- **TravelPaymentSubform.al**: Embedded list for tracking payments on invoices.
- **TravelQuoteCard.al / TravelQuoteList.al / TravelQuoteSubform.al**: UI for the quoting process.
- **TravelReservationList.al**: List of service-level reservations.
- **TravelServiceList.al**: Catalog management UI.

### 1.3 Codeunits (`src/Codeunits/`)
- **AIItineraryGenerator.al**: Logic to package reservation data and call the Python AI server.
- **DashboardCalculations.al**: Computes real-time totals and statistics for the dashboard.
- **InstallTravelData.al**: Handles initial data seeding upon extension installation.
- **InvoiceManagement.al**: Business logic for posting and managing travel invoices.
- **QuoteManagement.al**: Logic for converting quotes into active bookings.

### 1.4 APIs (`src/APIs/`)
- **Dedicated API Pages**: (e.g., `TravelBookingAPI.al`, `TravelClientAPI.al`) Expose custom tables as OData V4 / REST endpoints for the Python server.

---

## 2. Python AI Server
Located in `python/ai_server/`, this FastAPI application acts as the middleware.

### 2.1 Core Logic
- **app.py**: The main entry point. Defines API routes for the frontend and BC integration.
- **ai.py**: Handles communication with OpenAI and Google Gemini for itinerary generation.
- **bc_client.py**: Base client for interacting with Business Central's OData services.
- **secure_bc_client.py**: Enhanced client with multi-tenancy and role-based security.
- **security_middleware.py**: Validates agency headers and manages context isolation.
- **models.py / agency_models.py**: Pydantic data models for request/response validation.

### 2.2 Services
- **payroll_service.py**: Automates salary calculations and posts journal lines to BC.
- **expense_service.py**: Logic for syncing BC invoices into the platform's expense tracker.
- **user_sync_service.py**: Synchronizes local platform users with BC Employee records.
- **mailing.py**: Handles email notifications and attachment delivery.

### 2.3 Data & Config
- **.env.example**: Template for environment variables (API keys, BC credentials).
- **requirements.txt**: Python dependency list (FastAPI, pydantic, requests, etc.).
- **JSON files**: (e.g., `users.json`, `staff.json`) Mock storage for local platform data.

---

## 3. React Frontend
Located in `Frontend/`, this is the user-facing interface.

### 3.1 Components & UI (`src/components/`, `src/modules/`)
- **App.jsx**: Main routing and application structure.
- **AIPlannerPage.jsx**: Specialized UI for interacting with the AI generator.
- **FinancialDashboard.jsx**: Visualizes revenue, expenses, and cash flow.
- **LoginPage.jsx / RegisterPage.jsx**: User authentication pages.
- **ProtectedRoute.jsx**: HOC for enforcing role-based access.
- **layout.jsx / ui.jsx**: Shared UI components and layout wrappers.

### 3.2 Logic & Services (`src/services/`, `src/context/`)
- **erpApi.js**: Centralized Axios client for all backend communication.
- **AuthContext.jsx**: React context for managing user sessions and agency state.
- **authCore.js**: Low-level authentication logic (token management).
- **i18n.js**: Internationalization configuration.

### 3.3 Configuration
- **tailwind.config.js / postcss.config.js**: Styling configurations.
- **vite.config.js**: Build tool configuration.
- **package.json**: Frontend dependencies and scripts.

---

## 4. Root Files
- **app.json**: Business Central extension manifest (ID, version, dependencies).
- **project_overview.md**: High-level project summary.
- **Project_Overview.pdf**: Formal documentation (PDF).
