import { useState } from 'react'
import { BadgePlus, LogIn, Pencil, Power } from 'lucide-react'
import { Button, DataTable, Input, Panel, Select, StatusBadge } from '../components/ui'

const blankAgency = { name: '', logo: '/logo-agency.png', owner_id: '', subscription_status: 'active' }

export function ManageAgenciesPage({ agencies, users, bookings, onToggleSubscription, onAddAgency, onEditAgency, onImpersonate }) {
  const [form, setForm] = useState(blankAgency)
  const [editingId, setEditingId] = useState('')

  const submitAgency = () => {
    if (!form.name || !form.owner_id) return
    if (editingId && editingId !== 'new') {
      onEditAgency(editingId, form)
    } else {
      onAddAgency(form)
    }
    setEditingId('')
    setForm(blankAgency)
  }

  const startEdit = (agency) => {
    setEditingId(agency.id)
    setForm({
      name: agency.name,
      logo: agency.logo,
      owner_id: agency.owner_id,
      subscription_status: agency.subscription_status,
    })
  }

  const adminUsers = users.filter((user) => user.role === 'agency_admin')

  return (
    <div className="space-y-5">
      <Panel
        title="Manage Agencies"
        right={(
          <Button
            onClick={() => {
              setEditingId('new')
              setForm(blankAgency)
            }}
            className="bg-cyan-700 hover:bg-cyan-800"
          >
            <BadgePlus className="mr-1 h-4 w-4" />
            + Add New Agency
          </Button>
        )}
      >
        <DataTable
          headers={['Agency Name', 'Owner', 'Subscription Status', 'Total Bookings', 'Actions']}
          rows={agencies.map((agency) => {
            const owner = users.find((user) => user.id === agency.owner_id)
            const totalBookings = bookings.filter((booking) => booking.agency_id === agency.id).length
            const subscriptionStatus = agency.subscription_status
            return (
              <tr key={agency.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-3 font-medium">{agency.name}</td>
                <td className="px-2 py-3">{owner?.name ?? '-'}</td>
                <td className="px-2 py-3"><StatusBadge value={subscriptionStatus} /></td>
                <td className="px-2 py-3 text-center">{totalBookings}</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => startEdit(agency)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant={subscriptionStatus === 'active' ? 'danger' : 'success'} onClick={() => onToggleSubscription(agency.id)}>
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button variant="primary" onClick={() => onImpersonate(agency.id)}><LogIn className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            )
          })}
        />
      </Panel>

      {editingId ? (
        <Panel title={editingId === 'new' ? 'Add Agency' : 'Edit Agency'}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Agency Name</p>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Enter agency name" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Owner</p>
              <Select value={form.owner_id} onChange={(event) => setForm((prev) => ({ ...prev, owner_id: event.target.value }))}>
                <option value="">Select owner</option>
                {adminUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Logo URL</p>
              <Input value={form.logo} onChange={(event) => setForm((prev) => ({ ...prev, logo: event.target.value }))} placeholder="/logo-youragency.png" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Subscription Status</p>
              <Select value={form.subscription_status} onChange={(event) => setForm((prev) => ({ ...prev, subscription_status: event.target.value }))}>
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={submitAgency}>{editingId === 'new' ? 'Create Agency' : 'Save Agency'}</Button>
            <Button variant="ghost" onClick={() => { setEditingId(''); setForm(blankAgency) }}>Cancel</Button>
          </div>
        </Panel>
      ) : null}
    </div>
  )
}
