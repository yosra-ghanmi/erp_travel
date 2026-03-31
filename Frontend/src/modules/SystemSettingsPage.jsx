import { useState } from 'react'
import { Button, Input, Panel } from '../components/ui'

export function SystemSettingsPage({ settings, setSettings }) {
  const [message, setMessage] = useState('')

  const saveSettings = () => {
    setSettings((prev) => ({ ...prev }))
    setMessage('Settings saved successfully.')
  }

  const rotateApiKeys = () => {
    setMessage(`API keys rotated at ${new Date().toLocaleTimeString()}.`)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Platform Config">
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Default Agency Trial (Days)</p>
              <Input type="number" value={settings.trialDays} onChange={(event) => setSettings((prev) => ({ ...prev, trialDays: Number(event.target.value) }))} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Default Platform Currency</p>
              <Input value={settings.currency} onChange={(event) => setSettings((prev) => ({ ...prev, currency: event.target.value }))} />
            </div>
          </div>
        </Panel>
        <Panel title="AI Governance">
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Global AI Rate Limit (Requests/Hour)</p>
              <Input type="number" value={settings.aiRateLimit} onChange={(event) => setSettings((prev) => ({ ...prev, aiRateLimit: Number(event.target.value) }))} />
            </div>
            <Button variant="ghost" onClick={rotateApiKeys}>Rotate API Keys</Button>
          </div>
        </Panel>
        <Panel title="Security">
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Admin Session Timeout (Minutes)</p>
              <Input type="number" value={settings.sessionTimeout} onChange={(event) => setSettings((prev) => ({ ...prev, sessionTimeout: Number(event.target.value) }))} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.mfaSuperAdmin} onChange={(event) => setSettings((prev) => ({ ...prev, mfaSuperAdmin: event.target.checked }))} />
              Enforce MFA for Super Admin
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.strictTenantIsolation} onChange={(event) => setSettings((prev) => ({ ...prev, strictTenantIsolation: event.target.checked }))} />
              Strict Tenant Data Isolation
            </label>
          </div>
        </Panel>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={saveSettings} className="bg-cyan-700 px-6 hover:bg-cyan-800">Save Changes</Button>
        {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
      </div>
    </div>
  )
}
