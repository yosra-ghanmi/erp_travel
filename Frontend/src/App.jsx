import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Layout } from './components/layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/authCore'
import { activityFeed, agencies, aiUsageLogs, initialBookings, initialClients, initialPayments, initialServiceUsage, initialServices, initialTrips, revenueSeries } from './data/mockData'
import { defaultModuleByRole, modulesByRole } from './data/modules'
import { DashboardPage } from './modules/DashboardPage'
import { ClientsPage } from './modules/ClientsPage'
import { BookingsPage } from './modules/BookingsPage'
import { PaymentsPage } from './modules/PaymentsPage'
import { ExpensesPage } from './modules/ExpensesPage'
import { FinancialDashboard } from './modules/FinancialDashboard'
import { AIPlannerPage } from './modules/AIPlannerPage'
import { LoginPage } from './modules/LoginPage'
import { StaffManagementPage } from './modules/StaffManagementPage'
import { ManageAgenciesPage } from './modules/ManageAgenciesPage'
import { PlatformOverviewPage } from './modules/PlatformOverviewPage'
import { AIUsageLogsPage } from './modules/AIUsageLogsPage'
import { SystemSettingsPage } from './modules/SystemSettingsPage'
import { RegisterPage } from './modules/RegisterPage'
import { ForgotPasswordPage } from './modules/ForgotPasswordPage'
import { UnauthorizedPage } from './modules/UnauthorizedPage'
import { ServicesPage } from './modules/ServicesPage'
import { TravelOffersPage } from './modules/TravelOffersPage'

function AppWorkspace() {
  const { users, setUsers, sessionUser, role, agencyId, logout, impersonateAgency, hasPermission } = useAuth()
  const navigate = useNavigate()
  const { moduleKey } = useParams()
  const [language, setLanguage] = useState('en')
  const [darkMode, setDarkMode] = useState(false)
  const [clients, setClients] = useState(initialClients)
  const [bookings, setBookings] = useState(initialBookings)
  const [trips, setTrips] = useState(initialTrips)
  const [payments] = useState(initialPayments)
  const [services, setServices] = useState(initialServices)
  const [serviceUsage, setServiceUsage] = useState(initialServiceUsage)
  const [tenantAgencies, setTenantAgencies] = useState(agencies)
  const [settings, setSettings] = useState({
    trialDays: 14,
    aiRateLimit: 120,
    currency: 'USD',
    sessionTimeout: 180,
    mfaSuperAdmin: true,
    strictTenantIsolation: true,
  })
  const [notifications, setNotifications] = useState([
    'New inquiry from website',
    'Pending payment for BK-9002',
    'Trip seats low for Japan Golden Route',
  ])

  const availableModules = useMemo(() => modulesByRole[role] ?? [], [role])
  const resolvedModuleKey = availableModules.some((module) => module.key === moduleKey)
    ? moduleKey
    : (defaultModuleByRole[role] ?? 'platform_overview')

  const activeModuleLabel = availableModules.find((module) => module.key === resolvedModuleKey)?.label ?? 'Workspace'
  const agencyName = tenantAgencies.find((agency) => agency.id === agencyId)?.name ?? ''

  useEffect(() => {
    document.title = `Navigo | ${activeModuleLabel}`
  }, [activeModuleLabel])

  const pushNotification = (text) => setNotifications((prev) => [text, ...prev].slice(0, 8))

  const scopeByAgency = (rows) => {
    if (!rows || !Array.isArray(rows)) return []
    return role === 'super_admin' ? rows : rows.filter((row) => row.agency_id === agencyId)
  }

  const scopedClients = scopeByAgency(clients)
  const scopedBookings = scopeByAgency(bookings)
  const scopedTrips = scopeByAgency(trips)
  const scopedPayments = scopeByAgency(payments)
  const scopedServices = scopeByAgency(services)
  const scopedServiceUsage = scopeByAgency(serviceUsage)

  const saveAiAsTrip = (itinerary, form) => {
    if (!agencyId) return
    const newTrip = {
      id: `TR-${400 + trips.length + 1}`,
      agency_id: agencyId,
      title: `${form.destination} AI Plan`,
      destination: form.destination,
      duration: Number(form.dates),
      price: Number(form.budget),
      services: itinerary.attractions.join(', '),
      seatsLeft: 8,
    }
    setTrips((prev) => [...prev, newTrip])
    pushNotification(`AI itinerary saved as trip package ${newTrip.id}`)
  }

  const convertAiToBooking = (_itinerary, form, clientId) => {
    if (!agencyId) return
    const newBooking = {
      id: `BK-${9000 + bookings.length + 1}`,
      agency_id: agencyId,
      clientId: clientId ?? scopedClients[0]?.id ?? '',
      tripId: '',
      destination: form.destination,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + Number(form.dates) * 86400000).toISOString().slice(0, 10),
      status: 'pending',
      paymentStatus: 'unpaid',
      amount: Number(form.budget),
    }
    setBookings((prev) => [...prev, newBooking])
    pushNotification(`AI itinerary converted to booking ${newBooking.id}`)
  }

  const toggleAgencySubscription = (agencyIdValue) => {
    let agencyNameValue = agencyIdValue
    setTenantAgencies((prev) => prev.map((agency) => {
      if (agency.id !== agencyIdValue) return agency
      agencyNameValue = agency.name
      return { ...agency, subscription_status: agency.subscription_status === 'active' ? 'suspended' : 'active' }
    }))
    pushNotification(`Subscription updated for ${agencyNameValue}`)
  }

  const handleAddAgency = (payload) => {
    setTenantAgencies((prev) => {
      const next = { id: `AG-${String(prev.length + 1).padStart(3, '0')}`, ...payload }
      return [...prev, next]
    })
    pushNotification(`Agency ${payload.name} created`)
  }

  const editAgency = (agencyIdValue, patch) => {
    setTenantAgencies((prev) => prev.map((agency) => (agency.id === agencyIdValue ? { ...agency, ...patch } : agency)))
    pushNotification(`Agency ${agencyIdValue} updated`)
  }

  const impersonateAsAgency = (targetAgencyId) => {
    const target = impersonateAgency(targetAgencyId)
    if (!target) {
      pushNotification('No agency admin account available for impersonation')
      return
    }
    pushNotification(`Now impersonating ${target.email}`)
    navigate(`/app/${defaultModuleByRole[target.role] ?? 'agency_dashboard'}`)
  }

  const renderModule = () => {
    if (resolvedModuleKey === 'platform_overview') return <PlatformOverviewPage agencies={tenantAgencies} users={users} bookings={bookings} payments={payments} aiLogs={aiUsageLogs} />
    if (resolvedModuleKey === 'manage_agencies') return <ManageAgenciesPage agencies={tenantAgencies} users={users} bookings={bookings} onToggleSubscription={toggleAgencySubscription} onAddAgency={handleAddAgency} onEditAgency={editAgency} onImpersonate={impersonateAsAgency} />
    if (resolvedModuleKey === 'ai_usage_logs') return <AIUsageLogsPage logs={aiUsageLogs} agencies={tenantAgencies} />
    if (resolvedModuleKey === 'system_settings') return <SystemSettingsPage settings={settings} setSettings={setSettings} />
    if (resolvedModuleKey === 'agency_dashboard' || resolvedModuleKey === 'my_dashboard') {
      return <DashboardPage bookings={scopedBookings} clients={scopedClients} revenueSeries={revenueSeries} activityFeed={activityFeed} />
    }
    if (resolvedModuleKey === 'staff_management') return <StaffManagementPage users={users} setUsers={setUsers} agencyId={agencyId} />
    if (resolvedModuleKey === 'services') {
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
      )
    }
    if (resolvedModuleKey === 'clients') {
      return <ClientsPage clients={clients} setClients={setClients} bookings={scopedBookings} canDelete={hasPermission('clients', 'delete')} agencyId={agencyId} />
    }
    if (resolvedModuleKey === 'bookings') {
      return <BookingsPage agencyId={agencyId} />
    }
    if (resolvedModuleKey === 'agency_finances') {
      return <FinancialDashboard />
    }
    if (resolvedModuleKey === 'payments') {
      return <PaymentsPage />
    }
    if (resolvedModuleKey === 'expenses') {
      return <ExpensesPage />
    }
    if (resolvedModuleKey === 'ai') {
      return <AIPlannerPage onSaveAsTrip={saveAiAsTrip} onConvertToBooking={convertAiToBooking} clients={scopedClients} />
    }
    if (resolvedModuleKey === 'travel_offers') {
      return <TravelOffersPage />
    }
    return <DashboardPage bookings={scopedBookings} clients={scopedClients} revenueSeries={revenueSeries} activityFeed={activityFeed} />
  }

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
      homePath={`/app/${defaultModuleByRole[role] ?? 'platform_overview'}`}
      sessionEmail={sessionUser?.email}
      onLogout={() => {
        logout()
        navigate('/login')
      }}
    >
      {renderModule()}
    </Layout>
  )
}

function RoleLandingRedirect() {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={`/app/${defaultModuleByRole[role] ?? 'platform_overview'}`} replace />
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
        element={(
          <ProtectedRoute>
            <AppWorkspace />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
