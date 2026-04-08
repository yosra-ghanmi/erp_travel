import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
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
import { BookingsPage as NewBookingsPage } from "./modules/ReservationsPage";
import { tFor, getDir } from "./i18n";
import {
  fetchBookings,
  fetchClients,
  fetchPayments,
  fetchServices,
  fetchReservations,
  fetchQuotes,
  fetchInvoices,
} from "./services/erpApi";

const normalizeClient = (client) => ({
  id: client.no ?? client.id ?? `CL-${Date.now()}`,
  name: client.name ?? "Unknown Client",
  email: client.email ?? "",
  phone: client.phone ?? "",
  country: client.country ?? "",
  notes: client.notes ?? "",
  agency_id: client.agency_id ?? null,
  status: client.status ?? "active",
});

const normalizeBooking = (booking) => ({
  id: booking.bookingid ?? booking.bookingId ?? `BK-${Date.now()}`,
  agency_id: booking.agency_id ?? null,
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
  id: payment.paymentid ?? payment.paymentId ?? `PAY-${Date.now()}`,
  agency_id: payment.agency_id ?? null,
  bookingId: payment.bookingid ?? payment.bookingId ?? "",
  clientId: payment.clientno ?? payment.clientNo ?? "",
  method: payment.method ?? "",
  amount: Number(payment.amount ?? 0),
  date: payment.date ?? "",
  status: payment.status ?? "paid",
});

const normalizeService = (service) => ({
  id: service.code ?? service.id ?? `SV-${Date.now()}`,
  agency_id: service.agency_id ?? null,
  name: service.name ?? "Unnamed Service",
  category: service.servicetype ?? service.serviceType ?? "Other",
  price: Number(service.price ?? 0),
  active: service.active ?? true,
  description: service.description ?? "",
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
    .map((item) => item.message);
  return items.length ? items : ["Business Central data synced successfully"];
};

function AppWorkspace() {
  const {
    users,
    setUsers,
    sessionUser,
    role,
    agencyId,
    logout,
    impersonateAgency,
    hasPermission,
  } = useAuth();
  const navigate = useNavigate();
  const { moduleKey } = useParams();
  const [language, setLanguage] = useState(
    () => localStorage.getItem("lang") ?? "en"
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
  const [tenantAgencies, setTenantAgencies] = useState(agencies);
  const [settings, setSettings] = useState({
    trialDays: 14,
    aiRateLimit: 120,
    currency: "USD",
    sessionTimeout: 180,
    mfaSuperAdmin: true,
    strictTenantIsolation: true,
  });
  const [notifications, setNotifications] = useState([
    "New inquiry from website",
    "Pending payment for BK-9002",
    "Trip seats low for Japan Golden Route",
  ]);

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
    localStorage.setItem("lang", language);
    document.documentElement.setAttribute("dir", getDir(language));
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspaceData = async () => {
      try {
        const [
          clientRows,
          bookingRows,
          paymentRows,
          serviceRows,
          reservationRows,
          quoteRows,
          invoiceRows,
        ] = await Promise.all([
          fetchClients(),
          fetchBookings(),
          fetchPayments(),
          fetchServices(),
          fetchReservations(),
          fetchQuotes(),
          fetchInvoices(),
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
          agency_id: agencyId,
          serviceId: r.servicecode,
          clientId: r.clientno,
          status: r.status,
          at: r.reservationdate,
        }));

        setClients(nextClients);
        setBookings(nextBookings);
        setPayments(nextPayments);
        setServices(nextServices);
        setQuotes(nextQuotes);
        setInvoices(nextInvoices);
        setServiceUsage(nextUsage);
        setNotifications(buildNotifications(nextBookings, nextPayments));
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load Business Central workspace data:",
            error
          );
          setNotifications(["Unable to sync Business Central data"]);
        }
      }
    };

    loadWorkspaceData();

    return () => {
      cancelled = true;
    };
  }, []);

  const pushNotification = (text) =>
    setNotifications((prev) => [text, ...prev].slice(0, 8));

  const scopeByAgency = (rows) => {
    if (!rows || !Array.isArray(rows)) return [];
    if (role === "super_admin") return rows;
    const hasAgencyScopedRows = rows.some((row) => row?.agency_id);
    if (!hasAgencyScopedRows) return rows;
    return rows.filter((row) => row.agency_id === agencyId);
  };

  const scopedClients = scopeByAgency(clients);
  const scopedBookings = scopeByAgency(bookings);
  const scopedPayments = scopeByAgency(payments);
  const scopedServices = scopeByAgency(services);
  const scopedServiceUsage = scopeByAgency(serviceUsage);
  const revenueSeries = useMemo(
    () => buildRevenueSeries(scopedPayments, scopedBookings),
    [scopedPayments, scopedBookings]
  );
  const activityFeed = useMemo(
    () => buildActivityFeed(scopedBookings, scopedPayments),
    [scopedBookings, scopedPayments]
  );

  const saveAiAsTrip = (itinerary, form) => {
    if (!agencyId) return;
    const newTrip = {
      id: `TR-${400 + trips.length + 1}`,
      agency_id: agencyId,
      title: `${form.destination} AI Plan`,
      destination: form.destination,
      duration: Number(form.dates),
      price: Number(form.budget),
      services: itinerary.attractions.join(", "),
      seatsLeft: 8,
    };
    setTrips((prev) => [...prev, newTrip]);
    pushNotification(`AI itinerary saved as trip package ${newTrip.id}`);
  };

  const convertAiToBooking = (_itinerary, form, clientId) => {
    if (!agencyId) return;
    const newBooking = {
      id: `BK-${9000 + bookings.length + 1}`,
      agency_id: agencyId,
      clientId: clientId ?? scopedClients[0]?.id ?? "",
      tripId: "",
      destination: form.destination,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + Number(form.dates) * 86400000)
        .toISOString()
        .slice(0, 10),
      status: "pending",
      paymentStatus: "unpaid",
      amount: Number(form.budget),
    };
    setBookings((prev) => [...prev, newBooking]);
    pushNotification(`AI itinerary converted to booking ${newBooking.id}`);
  };

  const toggleAgencySubscription = (agencyIdValue) => {
    let agencyNameValue = agencyIdValue;
    setTenantAgencies((prev) =>
      prev.map((agency) => {
        if (agency.id !== agencyIdValue) return agency;
        agencyNameValue = agency.name;
        return {
          ...agency,
          subscription_status:
            agency.subscription_status === "active" ? "suspended" : "active",
        };
      })
    );
    pushNotification(`Subscription updated for ${agencyNameValue}`);
  };

  const handleAddAgency = (payload) => {
    setTenantAgencies((prev) => {
      const next = {
        id: `AG-${String(prev.length + 1).padStart(3, "0")}`,
        ...payload,
      };
      return [...prev, next];
    });
    pushNotification(`Agency ${payload.name} created`);
  };

  const editAgency = (agencyIdValue, patch) => {
    setTenantAgencies((prev) =>
      prev.map((agency) =>
        agency.id === agencyIdValue ? { ...agency, ...patch } : agency
      )
    );
    pushNotification(`Agency ${agencyIdValue} updated`);
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
          agencies={tenantAgencies}
          users={users}
          bookings={bookings}
          payments={payments}
          aiLogs={aiUsageLogs}
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
          onImpersonate={impersonateAsAgency}
        />
      );
    if (resolvedModuleKey === "ai_usage_logs")
      return <AIUsageLogsPage logs={aiUsageLogs} agencies={tenantAgencies} />;
    if (resolvedModuleKey === "system_settings")
      return (
        <SystemSettingsPage settings={settings} setSettings={setSettings} />
      );
    if (
      resolvedModuleKey === "agency_dashboard" ||
      resolvedModuleKey === "my_dashboard"
    ) {
      return (
        <DashboardPage
          bookings={scopedBookings}
          clients={scopedClients}
          revenueSeries={revenueSeries}
          activityFeed={activityFeed}
        />
      );
    }
    if (resolvedModuleKey === "staff_management")
      return (
        <StaffManagementPage
          users={users}
          setUsers={setUsers}
          agencyId={agencyId}
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
        />
      );
    }
    if (resolvedModuleKey === "clients") {
      return (
        <ClientsPage
          clients={clients}
          setClients={setClients}
          bookings={scopedBookings}
          canDelete={hasPermission("clients", "delete")}
          agencyId={agencyId}
        />
      );
    }
    if (resolvedModuleKey === "bookings") {
      return <NewBookingsPage agencyId={agencyId} />;
    }
    if (resolvedModuleKey === "quotes") {
      return <QuotesPage agencyId={agencyId} />;
    }
    if (resolvedModuleKey === "agency_finances") {
      return <FinancialDashboard />;
    }
    if (resolvedModuleKey === "payments") {
      return <PaymentsPage />;
    }
    if (resolvedModuleKey === "expenses") {
      return <ExpensesPage />;
    }
    if (resolvedModuleKey === "ai") {
      return (
        <AIPlannerPage
          onSaveAsTrip={saveAiAsTrip}
          onConvertToBooking={convertAiToBooking}
          clients={scopedClients}
        />
      );
    }
    if (resolvedModuleKey === "travel_offers") {
      return <TravelOffersPage />;
    }
    return (
      <DashboardPage
        bookings={scopedBookings}
        clients={scopedClients}
        revenueSeries={revenueSeries}
        activityFeed={activityFeed}
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
      onLanguageChange={setLanguage}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      notifications={notifications}
      pageTitle={activeModuleLabel}
      homePath={`/app/${defaultModuleByRole[role] ?? "platform_overview"}`}
      sessionEmail={sessionUser?.email}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
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
