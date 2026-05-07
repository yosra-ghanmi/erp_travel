import { useMemo, useState } from 'react'
import { Button, DataTable, Input, Panel, Select, StatusBadge, Card } from '../components/ui'
import { 
  Users, 
  Shield, 
  UserPlus, 
  Mail, 
  Trash2, 
  Search, 
  Plus, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react'
import { motion } from 'framer-motion'

const blankStaff = { name: '', email: '', role: 'agent' }

export function StaffManagementPage({ users, setUsers, agencyId, searchQuery }) {
  const [form, setForm] = useState(blankStaff)
  const [localSearch, setLocalSearch] = useState("")

  const staffMembers = useMemo(() => {
    const list = users.filter((user) => user.agency_id === agencyId && user.role !== 'superadmin')
    const q = (localSearch || searchQuery || "").toLowerCase();
    if (!q) return list
    return list.filter((user) => 
      user.name.toLowerCase().includes(q) || 
      user.email.toLowerCase().includes(q) || 
      user.role.toLowerCase().includes(q)
    )
  }, [users, agencyId, searchQuery, localSearch])

  const stats = useMemo(() => {
    const list = users.filter((user) => user.agency_id === agencyId && user.role !== 'superadmin')
    return [
      { label: "Total Staff", value: list.length, icon: Users, color: "text-brand-500", trend: "Active" },
      { label: "Administrators", value: list.filter(u => u.role === 'admin').length, icon: Shield, color: "text-emerald-500", trend: "System" },
      { label: "Agents", value: list.filter(u => u.role === 'agent').length, icon: UserCheck, color: "text-amber-500", trend: "Ops" },
      { label: "Available Seats", value: "8/10", icon: Plus, color: "text-indigo-500", trend: "Limit" },
    ];
  }, [users, agencyId]);

  const inviteStaff = () => {
    if (!form.name || !form.email) return
    setUsers((prev) => [
      ...prev,
      {
        id: `USR-${1000 + prev.length + 1}`,
        name: form.name,
        email: form.email,
        password: '123456',
        role: form.role,
        agency_id: agencyId,
      },
    ])
    setForm(blankStaff)
  }

  const deleteStaff = (id) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      setUsers(prev => prev.filter(u => u.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Staff Management
              </h1>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Team Overview
                </span>
                <span>•</span>
                <span>{staffMembers.length} active members</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center -space-x-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 w-10 rounded-xl border-2 border-white bg-slate-100 dark:border-slate-900 dark:bg-slate-800"
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 40}`}
                alt="Avatar"
                className="h-full w-full rounded-xl"
              />
            </div>
          ))}
          <div className="z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-brand-500 text-[10px] font-black text-white dark:border-slate-900">
            +5
          </div>
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
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
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
        <div className="xl:col-span-2">
          <Panel 
            title="Team Directory"
            right={
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="h-9 w-64 rounded-xl border-slate-200 bg-slate-50 pl-10 text-xs font-medium focus:border-brand-500 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>
              </div>
            }
          >
            <DataTable
              headers={['Staff Member', 'Contact Info', 'Role', 'Actions']}
              rows={staffMembers.map((user) => (
                <tr key={user.id} className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                          alt={user.name}
                          className="h-full w-full"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge 
                      value={user.role === 'admin' ? 'vip' : 'active'} 
                      label={user.role.toUpperCase()}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-brand-500">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteStaff(user.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            />
          </Panel>
        </div>

        <Panel 
          title="Add Team Member"
          right={
            <div className="rounded-full bg-brand-50 px-2 py-1 dark:bg-brand-900/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">
                New Hire
              </span>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex justify-center pb-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <UserPlus className="h-8 w-8 text-slate-400" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-lg">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Full Name
              </label>
              <Input 
                placeholder="e.g. John Doe" 
                value={form.name} 
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} 
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <Input 
                placeholder="john@example.com" 
                value={form.email} 
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} 
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Access Level
              </label>
              <Select 
                value={form.role} 
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="h-11 rounded-xl border-slate-200 bg-slate-50 font-bold dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="agent">Agent (Standard)</option>
                <option value="admin">Agency Admin (Full)</option>
                <option value="finance">Finance (Billing Only)</option>
              </Select>
            </div>

            <Button 
              onClick={inviteStaff} 
              className="mt-4 h-12 w-full rounded-2xl shadow-premium font-black uppercase tracking-widest text-sm"
              disabled={!form.name || !form.email}
            >
              Create Account
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
