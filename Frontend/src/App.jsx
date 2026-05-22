import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/authCore";
import { agencies, aiUsageLogs } from "./data/mockData";
import { defaultModuleByRole, modulesByRole } from "./data/modules";
import { DashboardPage } from "./modules/DashboardPage";
import { ClientsPage } from "./modules/ClientsPage";
import { PaymentsPage } from "./modules/PaymentsPage";
import { ExpensesPage } from "./modules/ExpensesPage";
import { FinancialDashboard } from "./modules/FinancialDashboard";
import { AIPlannerPage } from "./modules/AIPlannerPage";
import { LoginPage } from "./modules/LoginPage";
import { StaffManagementPage } from "./modules/StaffManagementPage";
import { ManageAgenciesPage } from "./modules/ManageAgenciesPage";
import { PlatformOverviewPage } from "./modules/PlatformOverviewPage";
import { AIUsageLogsPage } from "./modules/AIUsageLogsPage";
import { SystemSettingsPage } from "./modules/SystemSettingsPage";
import { RegisterPage } from "./modules/RegisterPage";
import { ForgotPasswordPage } from "./modules/ForgotPasswordPage";
import { UnauthorizedPage } from "./modules/UnauthorizedPage";
import { ServicesPage } from "./modules/ServicesPage";
import { TravelOffersPage } from "./modules/TravelOffersPage";
import { QuotesPage } from "./modules/QuotesPage";
import { TripsPage } from "./modules/TripsPage";
import { BookingsPage as NewBookingsPage } from "./modules/ReservationsPage";
import { HRDashboardPage } from "./modules/HRDashboardPage";
import { SalaryGradesPage } from "./modules/SalaryGradesPage";
import { ContractsPage } from "./modules/ContractsPage";
import { PayrollCalendarPage } from "./modules/PayrollCalendarPage";
import { PayrollGenerator } from "./modules/PayrollGenerator";
import { tFor, getDir } from "./i18n";
import {
  fetchBookings,
  fetchClients,
  fetchPayments,
  fetchServices,
  fetchReservations,
  fetchQuotes,
  fetchInvoices,
  createAgencyAdmin,
  fetchAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
  fetchContracts,
  fetchNotifications,
  createNotification,
  markNotificationRead,
  fetchSettings,
  saveSettings,
  updateLanguagePreference,
  fetchPlatformOverview,
} from "./services/erpApi";

const normalizeClient = (client) => ({
  id: client.no ?? client.id ?? `CL-${Date.now()}`,
  name: client.name ?? "Unknown Client",
  email: client.email ?? "",
  phone: client.phone ?? "",
  country: client.country ?? "",
  notes: client.notes ?? "",
  agency_id: client.agency_id ?? client.agency_code ?? null,
  status: client.status ?? "active",
});

const normalizeBooking = (booking) => ({
  ...booking,
  id: booking.bookingid ?? booking.bookingId ?? `BK-${Date.now()}`,
  agency_id: booking.agency_id ?? booking.agency_code ?? null,
  clientId: booking.clientno ?? booking.clientNo ?? "",
  tripId: booking.tripid ?? booking.tripId ?? "",
  destination: booking.tripname ?? booking.tripName ?? "",
  startDate: booking.startdate ?? booking.startDate ?? "",
  endDate: booking.enddate ?? booking.endDate ?? "",
  status: booking.status ?? "confirmed",
  paymentStatus: booking.paymentstatus ?? booking.paymentStatus ?? "pending",
  amount: Number(booking.amount ?? 0),
  notes: booking.notes ?? "",
});

const normalizePayment = (payment) => ({
  ...payment,
  id: payment.paymentid ?? payment.paymentId ?? `PAY-${Date.now()}`,
  agency_id: payment.agency_id ?? payment.agency_code ?? null,
  bookingId: payment.bookingid ?? payment.bookingId ?? "",
  clientId: payment.clientno ?? payment.clientNo ?? "",
  method: payment.method ?? "",
  amount: Number(payment.amount ?? 0),
  date: payment.date ?? "",
  status: payment.status ?? "paid",
});

const normalizeService = (service) => ({
  ...service,
  id: service.code ?? service.id ?? `SV-${Date.now()}`,
  agency_id: service.agency_id ?? service.agency_code ?? null,
  name: service.name ?? "Unnamed Service",
  category: service.servicetype ?? service.serviceType ?? "Other",
  price: Number(service.price ?? 0),
  active: service.active ?? true,
  description: service.description ?? "",
});

const normalizeContract = (contract) => ({
  ...contract,
  id:
    contract.contractNo ??
    contract.contractno ??
    contract.id ??
    `CT-${Date.now()}`,
  contractNo:
    contract.contractNo ??
    contract.contractno ??
    contract.id ??
    `CT-${Date.now()}`,
  agency_id:
    contract.agency_id ?? contract.agency_code ?? contract.Agency_Code ?? null,
  employee: contract.employeeName ?? contract.employee ?? "Unknown Employee",
  employeeNo:
    contract.employeeNo ?? contract.employeeno ?? contract.staffId ?? "",
  startDate: contract.startDate ?? contract.startdate ?? "",
  endDate: contract.endDate ?? contract.enddate ?? contract.expiryDate ?? "",
  expiryDate: contract.endDate ?? contract.enddate ?? contract.expiryDate ?? "",
  status: String(contract.status ?? "active").toLowerCase(),
});

const buildRevenueSeries = (payments, bookings) => {
  const monthNames = [];
  const monthMap = {};
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    monthNames.push(key);
    monthMap[key] = {
      month: date.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
      bookings: 0,
    };
  }

  payments.forEach((payment) => {
    const key = payment.date?.slice(0, 7);
    if (key && monthMap[key]) {
      monthMap[key].revenue += Number(payment.amount ?? 0);
    }
  });

  bookings.forEach((booking) => {
    const key = booking.startDate?.slice(0, 7);
    if (key && monthMap[key]) {
      monthMap[key].bookings += 1;
    }
  });

  return monthNames.map((key) => monthMap[key]);
};

const buildActivityFeed = (bookings, payments) =>
  [
    ...bookings
      .filter((booking) => booking.startDate)
      .map((booking) => ({
        id: `booking-${booking.id}`,
        at: booking.startDate,
        message: `Booking ${booking.id} scheduled for ${
          booking.destination || "trip"
        }`,
      })),
    ...payments
      .filter((payment) => payment.date)
      .map((payment) => ({
        id: `payment-${payment.id}`,
        at: payment.date,
        message: `Payment ${payment.id} recorded${
          payment.bookingId ? ` for ${payment.bookingId}` : ""
        }`,
      })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);

const buildNotifications = (bookings, payments) => {
  const items = buildActivityFeed(bookings, payments)
    .slice(0, 3)
    .map((item) => ({ id: item.id, message: item.message, read: false }));
  return items.length
    ? items
    : [
        {
          id: "sync-success",
          message: "Business Central data synced successfully",
          read: false,
        },
      ];
};

function AppWorkspace() {
  const {
    users,
    setUsers,
    sessionUser,
    sessionToken,
    role,
    agencyId,
    logout,
    updateSessionUser,
    impersonateAgency,
    hasPermission,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { moduleKey } = useParams();
  const [language, setLanguage] = useState(
    () =>
      localStorage.getItem("lang") ?? sessionUser?.preferred_language ?? "en"
  );
  const [darkMode, setDarkMode] = useState(false);
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [payments, setPayments] = useState([]);
  const [services, setServices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [serviceUsage, setServiceUsage] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [tenantAgencies, setTenantAgencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformOverview, setPlatformOverview] = useState({
    totalRevenue: 0,
    activeAgencyCount: 0,
    userRegistrationTrends: [],
    systemLogs: [],
    activeHrUsers: 0,
  });

  useEffect(() => {
    fetchAgencies()
      .then(setTenantAgencies)
      .catch((err) => {
        console.error("Failed to fetch agencies:", err);
        // Fallback to mock if API fails
        setTenantAgencies(agencies);
      });
  }, []);
  const [settings, setSettings] = useState({
    trialDays: 14,
    aiRateLimit: 120,
    currency: "USD",
    sessionTimeout: 180,
    mfaSuperAdmin: true,
    strictTenantIsolation: true,
  });

  const [notifications, setNotifications] = useState([]);

  const availableModules = useMemo(() => modulesByRole[role] ?? [], [role]);
  const resolvedModuleKey = availableModules.some(
    (module) => module.key === moduleKey
  )
    ? moduleKey
    : defaultModuleByRole[role] ?? "platform_overview";

  const t = tFor(language);
  const activeModuleLabel = t(`modules.${resolvedModuleKey}`) ?? "Workspace";
  const agencyName =
    tenantAgencies.find((agency) => agency.id === agencyId)?.name ?? "";

  useEffect(() => {
    document.title = `Navigo | ${activeModuleLabel}`;
  }, [activeModuleLabel]);

  useEffect(() => {
    if (
      sessionUser?.preferred_language &&
      sessionUser.preferred_language !== language
    ) {
      setLanguage(sessionUser.preferred_language);
      return;
    }
    localStorage.setItem("lang", language);
    document.documentElement.setAttribute("dir", getDir(language));
    document.documentElement.setAttribute("lang", language);
  }, [language, location.pathname, sessionUser?.preferred_language]);

  useEffect(() => {
    if (!sessionUser?.id) {
      setNotifications([]);
      return;
    }

    fetchNotifications()
      .then((rows) =>
        setNotifications(
          rows.map((item) => ({
            ...item,
            read: item.isRead ?? item.read ?? false,
          }))
        )
      )
      .catch((err) => console.error("Failed to fetch notifications:", err));
  }, [sessionToken, sessionUser?.id]);

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch((err) => console.error("Failed to fetch settings:", err));
  }, []);

  useEffect(() => {
    if (role !== "superadmin") return;
    fetchPlatformOverview()
      .then(setPlatformOverview)
      .catch((err) =>
        console.error("Failed to fetch platform overview metrics:", err)
      );
  }, [role, users.length, tenantAgencies.length]);

  const handleLanguageChange = async (nextLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem("lang", nextLanguage);
    updateSessionUser?.({ preferred_language: nextLanguage });
    if (sessionUser?.id) {
      try {
        await updateLanguagePreference(nextLanguage);
      } catch (err) {
        console.error("Failed to persist language preference:", err);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadWorkspaceData = async () => {
      try {
        const fetchPromises = [];
        const fetchMap = {
          clients: hasPermission("clients", "read")
            ? fetchClients()
            : Promise.resolve([]),
          bookings: hasPermission("bookings", "read")
            ? fetchBookings()
            : Promise.resolve([]),
          payments: hasPermission("payments", "read")
            ? fetchPayments()
            : Promise.resolve([]),
          services: hasPermission("services", "read")
            ? fetchServices()
            : Promise.resolve([]),
          reservations: hasPermission("services", "read")
            ? fetchReservations()
            : Promise.resolve([]),
          quotes: hasPermission("quotes", "read")
            ? fetchQuotes()
            : Promise.resolve([]),
          invoices: hasPermission("finances", "read")
            ? fetchInvoices()
            : Promise.resolve([]),
          contracts: hasPermission("contracts", "read")
            ? fetchContracts()
            : Promise.resolve([]),
        };

        const [
          clientRows,
          bookingRows,
          paymentRows,
          serviceRows,
          reservationRows,
          quoteRows,
          invoiceRows,
          contractRows,
        ] = await Promise.all([
          fetchMap.clients,
          fetchMap.bookings,
          fetchMap.payments,
          fetchMap.services,
          fetchMap.reservations,
          fetchMap.quotes,
          fetchMap.invoices,
          fetchMap.contracts,
        ]);

        if (cancelled) return;

        const nextClients = (clientRows ?? []).map(normalizeClient);
        const nextBookings = (bookingRows ?? []).map(normalizeBooking);
        const nextPayments = (paymentRows ?? []).map(normalizePayment);
        const nextServices = (serviceRows ?? []).map(normalizeService);
        const nextQuotes = (quoteRows ?? []).map((q) => ({
          ...q,
          id: q.quoteno || q.quoteNo || `QT-${Date.now()}`,
        }));
        const nextInvoices = (invoiceRows ?? []).map((i) => ({
          ...i,
          id: i.invoiceno || i.invoiceNo || `INV-${Date.now()}`,
        }));
        const nextUsage = (reservationRows ?? []).map((r) => ({
          id: r.reservationno || r.id,
          agency_id: r.agency_code || agencyId,
          serviceId: r.servicecode,
          clientId: r.clientno,
          status: r.status,
          at: r.reservationdate,
        }));
        const nextContracts = (contractRows ?? []).map(normalizeContract);

        setClients(nextClients);
        setBookings(nextBookings);
        setPayments(nextPayments);
        setServices(nextServices);
        setQuotes(nextQuotes);
        setInvoices(nextInvoices);
        setServiceUsage(nextUsage);
        setContracts(nextContracts);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load Business Central workspace data:",
            error
          );
          pushNotification("Unable to sync Business Central data");
        }
      }
    };

    loadWorkspaceData();

    return () => {
      cancelled = true;
    };
  }, [agencyId, role]);

  const pushNotification = async (text, options = {}) => {
    try {
      const created = await createNotification({
        message: text,
        isGlobal: options.isGlobal ?? false,
        category: options.category ?? "info",
      });
      setNotifications((prev) =>
        [{ ...created, read: false }, ...prev].slice(0, 8)
      );
    } catch (err) {
      console.error("Failed to create notification:", err);
      setNotifications((prev) =>
        [
          {
            id: `notif-${Date.now()}`,
            message: text,
            read: false,
          },
          ...prev,
        ].slice(0, 8)
      );
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const scopeByAgency = (rows) => {
    if (!rows || !Array.isArray(rows)) return [];
    if (role === "superadmin" || role === "hr") return rows;
    const hasAgencyScopedRows = rows.some((row) => row?.agency_id);
    if (!hasAgencyScopedRows) return rows;
    return rows.filter((row) => row.agency_id === agencyId);
  };

  const scopedClients = scopeByAgency(clients);
  const scopedBookings = scopeByAgency(bookings);
  const scopedPayments = scopeByAgency(payments);
  const scopedServices = scopeByAgency(services);
  const scopedServiceUsage = scopeByAgency(serviceUsage);
  const scopedContracts = scopeByAgency(contracts);
  const scopedWorkforceUsers = users.filter((user) => {
    if (user.role === "superadmin") return false;
    if (role === "superadmin" || role === "hr") return true;
    return user.agency_id === agencyId;
  });

  const revenueSeries = useMemo(
    () => buildRevenueSeries(scopedPayments, scopedBookings),
    [scopedPayments, scopedBookings]
  );
  const activityFeed = useMemo(
    () => buildActivityFeed(scopedBookings, scopedPayments),
    [scopedBookings, scopedPayments]
  );

  const toggleAgencySubscription = async (agencyIdValue) => {
    let agencyNameValue = agencyIdValue;
    const targetAgency = tenantAgencies.find((a) => a.id === agencyIdValue);
    if (!targetAgency) return;

    const newStatus =
      targetAgency.subscription_status === "active" ? "suspended" : "active";

    try {
      await updateAgency(agencyIdValue, { subscription_status: newStatus });
      setTenantAgencies((prev) =>
        prev.map((agency) =>
          agency.id === agencyIdValue
            ? { ...agency, subscription_status: newStatus }
            : agency
        )
      );
      pushNotification(`Subscription updated for ${targetAgency.name}`);
    } catch (err) {
      pushNotification(`Failed to update subscription: ${err.message}`);
    }
  };

  const handleAddAgency = async (payload, onCreated) => {
    const newId = `AG-${String(tenantAgencies.length + 1).padStart(3, "0")}`;

    try {
      // 1. Create the admin first so we have the real owner ID
      const adminData = await createAgencyAdmin(
        newId,
        payload.name,
        payload.admin_email
      );

      // 2. Add the new admin to the frontend users state
      const newUser = {
        id: adminData.user_id,
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
        role: adminData.role,
        agency_id: adminData.agency_id,
      };
      setUsers((prev) => [...prev, newUser]);

      // 3. Create the agency with the real owner ID
      const { admin_email, ...agencyPayload } = payload;
      const newAgency = {
        id: newId,
        agency_id: newId,
        ...agencyPayload,
        owner_id: adminData.user_id, // Use the generated admin ID as the owner
      };

      const createdAgency = await createAgency(newAgency);
      setTenantAgencies((prev) => [...prev, createdAgency]);
      pushNotification(`Agency ${payload.name} created with new admin`);

      if (onCreated) {
        onCreated({ agency_name: payload.name, ...adminData });
      }
    } catch (err) {
      pushNotification(`Failed to create agency or admin: ${err.message}`);
    }
  };

  const editAgency = async (agencyIdValue, patch) => {
    try {
      await updateAgency(agencyIdValue, patch);
      setTenantAgencies((prev) =>
        prev.map((agency) =>
          agency.id === agencyIdValue ? { ...agency, ...patch } : agency
        )
      );
      pushNotification(`Agency ${agencyIdValue} updated`);
    } catch (err) {
      pushNotification(`Failed to update agency: ${err.message}`);
    }
  };

  const removeAgency = async (agencyIdValue) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this agency? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteAgency(agencyIdValue);
      setTenantAgencies((prev) =>
        prev.filter((agency) => agency.id !== agencyIdValue)
      );
      pushNotification(`Agency ${agencyIdValue} deleted`);
    } catch (err) {
      pushNotification(`Failed to delete agency: ${err.message}`);
    }
  };

  const impersonateAsAgency = (targetAgencyId) => {
    const target = impersonateAgency(targetAgencyId);
    if (!target) {
      pushNotification("No agency admin account available for impersonation");
      return;
    }
    pushNotification(`Now impersonating ${target.email}`);
    navigate(`/app/${defaultModuleByRole[target.role] ?? "agency_dashboard"}`);
  };

  const renderModule = () => {
    if (resolvedModuleKey === "platform_overview")
      return (
        <PlatformOverviewPage
          overview={platformOverview}
          agencies={tenantAgencies}
        />
      );
    if (resolvedModuleKey === "manage_agencies")
      return (
        <ManageAgenciesPage
          agencies={tenantAgencies}
          users={users}
          bookings={bookings}
          onToggleSubscription={toggleAgencySubscription}
          onAddAgency={handleAddAgency}
          onEditAgency={editAgency}
          onDeleteAgency={removeAgency}
          onImpersonate={impersonateAsAgency}
          searchQuery={searchQuery}
        />
      );
    if (resolvedModuleKey === "ai_usage_logs")
      return (
        <AIUsageLogsPage
          logs={aiUsageLogs}
          agencies={tenantAgencies}
          searchQuery={searchQuery}
        />
      );
    if (resolvedModuleKey === "system_settings")
      return (
        <SystemSettingsPage
          settings={settings}
          setSettings={setSettings}
          onSave={async (nextSettings) => {
            const saved = await saveSettings(nextSettings);
            setSettings(saved);
            if (role === "superadmin") {
              const overview = await fetchPlatformOverview();
              setPlatformOverview(overview);
            }
          }}
        />
      );
    if (resolvedModuleKey === "hr_dashboard") {
      return (
        <HRDashboardPage
          users={scopedWorkforceUsers}
          contracts={scopedContracts}
          searchQuery={searchQuery}
          onNavigate={(key) => navigate(`/app/${key}`)}
        />
      );
    }
    if (resolvedModuleKey === "salary_grades") {
      return <SalaryGradesPage searchQuery={searchQuery} />;
    }
    if (resolvedModuleKey === "contracts") {
      return (
        <ContractsPage
          contracts={scopedContracts}
          users={scopedWorkforceUsers}
          setContracts={setContracts}
          searchQuery={searchQuery}
        />
      );
    }
    if (resolvedModuleKey === "payroll_calendar") {
      return (
        <PayrollCalendarPage
          users={scopedWorkforceUsers}
          searchQuery={searchQuery}
        />
      );
    }
    if (resolvedModuleKey === "payroll_management") {
      return <PayrollGenerator />;
    }
    if (
      resolvedModuleKey === "agency_dashboard" ||
      resolvedModuleKey === "my_dashboard"
    ) {
      // Merge traditional bookings with service reservations for dashboard stats
      const allBookings = [...scopedBookings, ...scopedServiceUsage];
      return (
        <DashboardPage
          bookings={allBookings}
          clients={scopedClients}
          payments={scopedPayments}
          revenueSeries={revenueSeries}
          activityFeed={activityFeed}
          searchQuery={searchQuery}
        />
      );
    }
    if (resolvedModuleKey === "staff_management")
      return (
        <StaffManagementPage
          users={users}
          setUsers={setUsers}
          agencyId={agencyId}
          searchQuery={searchQuery}
          role={role}
        />
      );
    if (resolvedModuleKey === "services") {
      return (
        <ServicesPage
          role={role}
          agencyId={agencyId}
          services={scopedServices}
          setServices={setServices}
          serviceUsage={scopedServiceUsage}
          setServiceUsage={setServiceUsage}
          users={users}
          clients={scopedClients}
          hasPermission={hasPermission}
          sessionUser={sessionUser}
          pushNotification={pushNotification}
          searchQuery={searchQuery}
        />
      );
    }
    if (resolvedModuleKey === "clients") {
      return (
        <ClientsPage
          clients={scopedClients}
          setClients={setClients}
          bookings={scopedBookings}
          reservations={scopedServiceUsage}
          services={scopedServices}
          canDelete={hasPermission("clients", "delete")}
          agencyId={agencyId}
          searchQuery={searchQuery}
        />
      );
    }
    if (resolvedModuleKey === "bookings") {
      return (
        <NewBookingsPage
          agencyId={agencyId}
          reservations={scopedServiceUsage}
          bookings={scopedBookings}
          setBookings={setBookings}
          clients={scopedClients}
          services={scopedServices}
          searchQuery={searchQuery}
        />
      );
    }
    if (resolvedModuleKey === "quotes") {
      return <QuotesPage agencyId={agencyId} searchQuery={searchQuery} />;
    }
    if (resolvedModuleKey === "agency_finances") {
      return <FinancialDashboard />;
    }
    if (resolvedModuleKey === "payments") {
      return <PaymentsPage searchQuery={searchQuery} />;
    }
    if (resolvedModuleKey === "trips") {
      return (
        <TripsPage
          trips={trips}
          setTrips={setTrips}
          bookings={scopedBookings}
          searchQuery={searchQuery}
        />
      );
    }
    if (resolvedModuleKey === "expenses") {
      return <ExpensesPage searchQuery={searchQuery} />;
    }
    if (resolvedModuleKey === "ai") {
      return <AIPlannerPage clients={scopedClients} />;
    }
    if (resolvedModuleKey === "travel_offers") {
      return <TravelOffersPage role={role} searchQuery={searchQuery} />;
    }
    return (
      <DashboardPage
        bookings={[...scopedBookings, ...scopedServiceUsage]}
        clients={scopedClients}
        payments={scopedPayments}
        revenueSeries={revenueSeries}
        activityFeed={activityFeed}
        searchQuery={searchQuery}
      />
    );
  };

  return (
    <Layout
      activeModule={resolvedModuleKey}
      onNavigate={(key) => navigate(`/app/${key}`)}
      role={role}
      modules={availableModules}
      agencyName={agencyName}
      language={language}
      onLanguageChange={handleLanguageChange}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      notifications={notifications}
      onMarkNotificationAsRead={markNotificationAsRead}
      pageTitle={activeModuleLabel}
      homePath={`/app/${defaultModuleByRole[role] ?? "platform_overview"}`}
      sessionEmail={sessionUser?.email}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {renderModule()}
    </Layout>
  );
}

function RoleLandingRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={`/app/${defaultModuleByRole[role] ?? "platform_overview"}`}
      replace
    />
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/" element={<RoleLandingRedirect />} />
      <Route
        path="/app/:moduleKey"
        element={
          <ProtectedRoute>
            <AppWorkspace />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
