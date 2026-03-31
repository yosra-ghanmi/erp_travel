import { useMemo, useState } from 'react'
import { Card, DataTable, Panel, Select } from '../components/ui'

export function AIUsageLogsPage({ logs, agencies }) {
  const [agencyFilter, setAgencyFilter] = useState('all')

  const filteredLogs = useMemo(
    () => logs.filter((log) => agencyFilter === 'all' || log.agency_id === agencyFilter),
    [logs, agencyFilter],
  )

  const totalApiCost = filteredLogs.reduce((sum, log) => sum + log.cost, 0)
  const totalTokens = filteredLogs.reduce((sum, log) => sum + log.promptTokens, 0)
  const avgTokens = filteredLogs.length ? Math.round(totalTokens / filteredLogs.length) : 0
  const activityCountByAgency = filteredLogs.reduce((acc, item) => {
    acc[item.agency_id] = (acc[item.agency_id] ?? 0) + 1
    return acc
  }, {})
  const mostActiveAgencyId = Object.entries(activityCountByAgency).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostActiveTenant = agencies.find((agency) => agency.id === mostActiveAgencyId)?.name ?? 'N/A'

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total API Cost (MTD)" value={`$${totalApiCost.toFixed(2)}`} hint="Current month-to-date AI cost" />
        <Card title="Avg. Tokens/Request" value={avgTokens} hint={`${filteredLogs.length} total requests`} />
        <Card title="Most Active Tenant" value={mostActiveTenant} hint="By request volume" />
      </div>
      <Panel
        title="AI Usage Logs"
        right={(
          <div className="w-56">
            <Select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)}>
              <option value="all">All agencies</option>
              {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
            </Select>
          </div>
        )}
      >
        <DataTable
          headers={['Agency', 'User', 'Tokens', 'Cost', 'Timestamp']}
          rows={filteredLogs.map((log) => (
            <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-2 py-3 font-medium">{agencies.find((agency) => agency.id === log.agency_id)?.name ?? '-'}</td>
              <td className="px-2 py-3">{log.user}</td>
              <td className="px-2 py-3 text-right tabular-nums">{log.promptTokens.toLocaleString()}</td>
              <td className="px-2 py-3 text-right tabular-nums">${log.cost.toFixed(2)}</td>
              <td className="px-2 py-3 text-xs">{log.at}</td>
            </tr>
          ))}
        />
      </Panel>
    </div>
  )
}
