import { useMemo, useState } from 'react'
import { Button, DataTable, Input, Panel, Select, StatusBadge } from '../components/ui'

const blankService = { name: '', category: 'Transfer', price: 0, active: true }

export function ServicesPage({
  role,
  agencyId,
  services,
  setServices,
  serviceUsage,
  setServiceUsage,
  users,
  clients,
  hasPermission,
}) {
  const [form, setForm] = useState(blankService)
  const [editingId, setEditingId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [message, setMessage] = useState('')

  const agencyServices = useMemo(() => services.filter((service) => service.agency_id === agencyId), [services, agencyId])
  const agencyUsage = useMemo(() => serviceUsage.filter((usage) => usage.agency_id === agencyId), [serviceUsage, agencyId])

  const startEdit = (service) => {
    if (!hasPermission('services', 'update')) return
    setEditingId(service.id)
    setForm({ name: service.name, category: service.category, price: service.price, active: service.active })
  }

  const saveService = () => {
    if (!hasPermission('services', 'create') || !form.name) return
    if (editingId) {
      setServices((prev) => prev.map((service) => (service.id === editingId ? { ...service, ...form, price: Number(form.price) } : service)))
    } else {
      setServices((prev) => [...prev, { id: `SV-${200 + prev.length + 1}`, agency_id: agencyId, ...form, price: Number(form.price) }])
    }
    setEditingId('')
    setForm(blankService)
  }

  const removeService = (serviceId) => {
    if (!hasPermission('services', 'delete')) return
    setServices((prev) => prev.filter((service) => service.id !== serviceId))
  }

  const assignService = (serviceId) => {
    if (!hasPermission('services', 'use')) return
    setServiceUsage((prev) => [
      ...prev,
      {
        id: `SU-${prev.length + 1}`,
        agency_id: agencyId,
        serviceId,
        usedBy: users.find((user) => user.role === role && user.agency_id === agencyId)?.id ?? '',
        clientId: selectedClientId,
        at: new Date().toISOString().slice(0, 10),
      },
    ])
    setMessage(`Service ${serviceId} assigned to client ${selectedClientId}`)
  }

  const canManage = hasPermission('services', 'create')

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel title={canManage ? 'Services Management' : 'Services Catalog'} right={<p className="text-xs text-slate-500">{agencyServices.length} services</p>}>
          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <Select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>
              <option value="">Select client to use service</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </Select>
            {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{message}</p> : null}
          </div>
          <DataTable
            headers={['Service', 'Category', 'Price', 'Status', 'Actions']}
            rows={agencyServices.map((service) => (
              <tr key={service.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{service.name}</p>
                  <p className="text-xs text-slate-500">{service.id}</p>
                </td>
                <td className="px-2 py-3">{service.category}</td>
                <td className="px-2 py-3">${service.price}</td>
                <td className="px-2 py-3"><StatusBadge value={service.active ? 'active' : 'suspended'} /></td>
                <td className="px-2 py-3">
                  <div className="flex gap-2">
                    <Button variant="success" onClick={() => assignService(service.id)} disabled={!selectedClientId}>Use</Button>
                    {canManage ? <Button variant="ghost" onClick={() => startEdit(service)}>Edit</Button> : null}
                    {canManage ? <Button variant="danger" onClick={() => removeService(service.id)}>Delete</Button> : null}
                  </div>
                </td>
              </tr>
            ))}
          />
        </Panel>
      </div>
      <Panel title="Service Form">
        {canManage ? (
          <div className="space-y-3">
            <Input placeholder="Service name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            <Select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
              <option value="Transfer">Transfer</option>
              <option value="Documentation">Documentation</option>
              <option value="Insurance">Insurance</option>
              <option value="Comfort">Comfort</option>
            </Select>
            <Input type="number" placeholder="Price" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />
              Active service
            </label>
            <Button onClick={saveService} className="w-full">{editingId ? 'Update Service' : 'Create Service'}</Button>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>You can use services for clients and bookings.</p>
            <p>Only Agency Admin can create, update, or delete services.</p>
            <p>Total usage entries: {agencyUsage.length}</p>
          </div>
        )}
      </Panel>
    </div>
  )
}
