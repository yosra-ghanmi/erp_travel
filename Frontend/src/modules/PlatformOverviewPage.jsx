import { Panel } from "../components/ui";

const StatIconRevenue = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 text-slate-600 dark:text-slate-300"
    aria-hidden="true"
  >
    <path
      d="M4 14c2.4-3 4.7-3 7 0s4.6 3 9 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M11 6c-1.6 0-2.7.9-2.7 2.1 0 3.1 5.4 1.5 5.4 4 0 1.2-1.2 2.1-2.7 2.1-1.2 0-2.2-.5-2.8-1.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const StatIconNeural = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 text-slate-600 dark:text-slate-300"
    aria-hidden="true"
  >
    <circle
      cx="6"
      cy="6"
      r="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="18"
      cy="6"
      r="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="12"
      cy="12"
      r="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="6"
      cy="18"
      r="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle
      cx="18"
      cy="18"
      r="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 6h8M7.2 7.3l3.6 3.4M16.8 7.3l-3.6 3.4M7.2 16.7l3.6-3.4M16.8 16.7l-3.6-3.4M8 18h8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const StatIconTenants = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 text-slate-600 dark:text-slate-300"
    aria-hidden="true"
  >
    <rect
      x="4"
      y="5"
      width="6"
      height="6"
      rx="1.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="14"
      y="5"
      width="6"
      height="6"
      rx="1.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="9"
      y="14"
      width="6"
      height="6"
      rx="1.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

function PremiumStatCard({ title, value, trend, hint, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-soft transition hover:scale-[1.02] dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
        {value}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {trend}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

export function PlatformOverviewPage({
  overview,
  agencies,
}) {
  const activeAgencies = overview?.activeAgencyCount ?? 0;
  const totalRevenue = overview?.totalRevenue ?? 0;
  const activeHrUsers = overview?.activeHrUsers ?? 0;
  const registrationTrends = overview?.userRegistrationTrends ?? [];
  const systemLogs = overview?.systemLogs ?? [];
  const latestTrend = registrationTrends.at(-1);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PremiumStatCard
          title="Active Tenants"
          value={activeAgencies}
          trend={`${agencies.length} agencies total`}
          hint={`${agencies.length} total agencies`}
          icon={<StatIconTenants />}
        />
        <PremiumStatCard
          title="Platform Revenue"
          value={`TND ${totalRevenue.toLocaleString()}`}
          trend="Live payment aggregate"
          hint="Sum of payments"
          icon={<StatIconRevenue />}
        />
        <PremiumStatCard
          title="HR Visibility"
          value={activeHrUsers}
          trend="Platform-wide role access"
          hint="Active HR users"
          icon={<StatIconNeural />}
        />
        <PremiumStatCard
          title="Registrations"
          value={latestTrend?.count ?? 0}
          trend={latestTrend?.month ?? "No trend data"}
          hint="Latest monthly signups"
          icon={<StatIconTenants />}
        />
      </div>
      <Panel title="User Registration Trends">
        <div className="space-y-2">
          {registrationTrends.length > 0 ? (
            registrationTrends.map((item) => (
              <div
                key={item.month}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                <span className="text-slate-600 dark:text-slate-300">
                  {item.month}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No user registration data available.
            </p>
          )}
        </div>
      </Panel>
      <Panel title="Real-Time System Logs">
        <div className="space-y-2">
          {systemLogs.length > 0 ? (
            systemLogs.map((log, index) => (
              <div
                key={`${log.created_at}-${index}`}
                className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {log.level}: {log.message}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {log.created_at}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No system logs available.
            </p>
          )}
        </div>
      </Panel>
      <Panel title="Super Admin Visibility">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Superadmin metrics are global, and the HR role remains visible across
          the platform for workforce oversight.
        </p>
      </Panel>
    </div>
  );
}
