import { useState } from 'react'
import { users as seedUsers } from '../data/mockData'
import { AuthContext, permissionsMap } from './authCore'

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(seedUsers)
  const [sessionUser, setSessionUser] = useState(null)

  const login = async ({ email, password }) => {
    const matched = users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password)
    if (!matched) throw new Error('Invalid credentials')
    setSessionUser(matched)
    return matched
  }

  const register = async ({ name, email, password, role, agency_id }) => {
    const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase())
    if (exists) throw new Error('Email already exists')
    const created = { id: `USR-${1000 + users.length + 1}`, name, email, password, role, agency_id }
    setUsers((prev) => [...prev, created])
    return created
  }

  const logout = () => setSessionUser(null)

  const impersonateAgency = (agencyId) => {
    const agencyAdmin = users.find((user) => user.role === 'agency_admin' && user.agency_id === agencyId)
    if (!agencyAdmin) return null
    setSessionUser(agencyAdmin)
    return agencyAdmin
  }

  const hasPermission = (resource, action) => {
    if (!sessionUser) return false
    return Boolean(permissionsMap[sessionUser.role]?.[resource]?.[action])
  }

  const value = {
    users,
    setUsers,
    sessionUser,
    role: sessionUser?.role ?? null,
    agencyId: sessionUser?.agency_id ?? null,
    isAuthenticated: Boolean(sessionUser),
    login,
    register,
    logout,
    impersonateAgency,
    hasPermission,
    permissions: sessionUser ? permissionsMap[sessionUser.role] : null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
