import { useState, useMemo } from 'react'
import { Button, Input, Panel, Card } from '../components/ui'
import { 
  Settings, 
  Shield, 
  Cpu, 
  Database, 
  Lock, 
  Zap, 
  RefreshCw, 
  Save, 
  Bell, 
  Globe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react'
import { motion } from 'framer-motion'

export function SystemSettingsPage({ settings, setSettings }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const stats = useMemo(() => [
    { label: "System Status", value: "Operational", icon: Activity, color: "text-emerald-500", trend: "99.9% Uptime" },
    { label: "API Health", value: "Excellent", icon: Zap, color: "text-amber-500", trend: "42ms Latency" },
    { label: "Security Level", value: "High", icon: Shield, color: "text-brand-500", trend: "MFA Active" },
    { label: "Storage Use", value: "24.5 GB", icon: Database, color: "text-indigo-500", trend: "Within Limit" },
  ], []);

  const saveSettings = () => {
    setLoading(true)
    setTimeout(() => {
      setSettings((prev) => ({ ...prev }))
      setMessage('Configuration updated successfully.')
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }, 800)
  }

  const rotateApiKeys = () => {
    if (window.confirm("Are you sure you want to rotate all API keys? This may cause temporary downtime.")) {
      setMessage(`API keys rotated at ${new Date().toLocaleTimeString()}.`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/20">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                System Configuration
              </h1>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live Platform
                </span>
                <span>•</span>
                <span>Version 2.4.0-stable</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={saveSettings} 
            disabled={loading}
            className="h-11 rounded-xl bg-brand-500 px-6 font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600"
          >
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group hover:border-brand-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className={`rounded-2xl bg-slate-50 p-3 dark:bg-slate-900 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {stat.trend}
                  </span>
                  <div className="h-1 w-8 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                    <div className="h-full w-2/3 bg-brand-500" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {stat.value}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel 
          title="Platform Config"
          right={<Globe className="h-4 w-4 text-slate-400" />}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Agency Trial Period (Days)
              </label>
              <Input 
                type="number" 
                value={settings.trialDays} 
                onChange={(event) => setSettings((prev) => ({ ...prev, trialDays: Number(event.target.value) }))} 
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Base System Currency
              </label>
              <Input 
                value={settings.currency} 
                onChange={(event) => setSettings((prev) => ({ ...prev, currency: event.target.value }))} 
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          </div>
        </Panel>

        <Panel 
          title="AI Governance"
          right={<Cpu className="h-4 w-4 text-slate-400" />}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Global Request Limit (Req/Hr)
              </label>
              <Input 
                type="number" 
                value={settings.aiRateLimit} 
                onChange={(event) => setSettings((prev) => ({ ...prev, aiRateLimit: Number(event.target.value) }))} 
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <Button 
              variant="ghost" 
              onClick={rotateApiKeys}
              className="w-full h-11 border-2 border-dashed border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-500 hover:border-brand-500 hover:text-brand-500 dark:border-slate-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Rotate API Keys
            </Button>
          </div>
        </Panel>

        <Panel 
          title="Security & Isolation"
          right={<Lock className="h-4 w-4 text-slate-400" />}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Session Timeout (Min)
              </label>
              <Input 
                type="number" 
                value={settings.sessionTimeout} 
                onChange={(event) => setSettings((prev) => ({ ...prev, sessionTimeout: Number(event.target.value) }))} 
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 group cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={settings.mfaSuperAdmin} 
                    onChange={(event) => setSettings((prev) => ({ ...prev, mfaSuperAdmin: event.target.checked }))}
                    className="peer h-5 w-5 appearance-none rounded-lg border-2 border-slate-200 bg-slate-50 transition-all checked:border-brand-500 checked:bg-brand-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <CheckCircle2 className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white transition-colors">
                  Enforce MFA for Super Admins
                </span>
              </label>

              <label className="flex items-center gap-3 group cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={settings.strictTenantIsolation} 
                    onChange={(event) => setSettings((prev) => ({ ...prev, strictTenantIsolation: event.target.checked }))}
                    className="peer h-5 w-5 appearance-none rounded-lg border-2 border-slate-200 bg-slate-50 transition-all checked:border-brand-500 checked:bg-brand-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <CheckCircle2 className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white transition-colors">
                  Strict Tenant Data Isolation
                </span>
              </label>
            </div>
          </div>
        </Panel>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
        >
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-xs font-bold uppercase tracking-widest">{message}</p>
        </motion.div>
      )}
    </div>
  )
}
