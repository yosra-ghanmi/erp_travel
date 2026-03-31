import { Panel } from '../components/ui'

const StatIconRevenue = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden="true">
    <path d="M4 14c2.4-3 4.7-3 7 0s4.6 3 9 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M11 6c-1.6 0-2.7.9-2.7 2.1 0 3.1 5.4 1.5 5.4 4 0 1.2-1.2 2.1-2.7 2.1-1.2 0-2.2-.5-2.8-1.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const StatIconNeural = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden="true">
    <circle cx="6" cy="6" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="6" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 6h8M7.2 7.3l3.6 3.4M16.8 7.3l-3.6 3.4M7.2 16.7l3.6-3.4M16.8 16.7l-3.6-3.4M8 18h8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const StatIconTenants = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden="true">
    <rect x="4" y="5" width="6" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect x="14" y="5" width="6" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="14" width="6" height="6" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

function PremiumStatCard({ title, value, trend, hint, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-soft transition hover:scale-[1.02] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{trend}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
    </div>
  )
}

export function PlatformOverviewPage({ agencies, users, bookings, payments, aiLogs }) {
  const activeAgencies = agencies.filter((agency) => agency.subscription_status === 'active').length
  const monthlyRevenue = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0)
  const tenantUsers = users.filter((user) => user.role !== 'super_admin').length
  const totalAiCost = aiLogs.reduce((sum, item) => sum + item.cost, 0)

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-xs tracking-wide text-slate-500 dark:text-slate-400">Navigo / Dashboard</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, Admin</p>
        <h1 className="text-3xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Platform Overview</h1>
      </section>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PremiumStatCard title="Active Tenants" value={activeAgencies} trend="+5% this month" hint={`${agencies.length} total agencies`} icon={<StatIconTenants />} />
        <PremiumStatCard title="Platform Revenue" value={`$${monthlyRevenue.toLocaleString()}`} trend="+12% this month" hint="Paid bookings" icon={<StatIconRevenue />} />
        <PremiumStatCard title="AI Spend" value={`$${totalAiCost.toFixed(2)}`} trend="+4% this month" hint={`${aiLogs.length} AI requests`} icon={<StatIconNeural />} />
        <PremiumStatCard title="Tenant Users" value={tenantUsers} trend="+7% this month" hint={`${bookings.length} total bookings`} icon={<StatIconTenants />} />
      </div>
      <Panel title="Super Admin Visibility">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Super admin sees global totals only. Agency-level client and booking detail views are isolated from this role.
        </p>
      </Panel>
    </div>
  )
}
