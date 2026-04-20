import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export const permissionsMap = {
  superadmin: {
    agencies: { create: true, read: true, update: true, delete: true },
    staff: { create: false, read: false, update: false, delete: false },
    clients: { create: false, read: false, update: false, delete: false },
    bookings: { create: false, read: false, update: false, delete: false },
    services: { create: false, read: false, update: false, delete: false, use: false },
    finances: { create: false, read: true, update: false, delete: false },
    ai: { create: false, read: true, update: false, delete: false },
  },
  admin: {
    agencies: { create: false, read: true, update: true, delete: false },
    staff: { create: true, read: true, update: true, delete: true },
    clients: { create: true, read: true, update: true, delete: true },
    bookings: { create: true, read: true, update: true, delete: true },
    services: { create: true, read: true, update: true, delete: true, use: true },
    finances: { create: false, read: true, update: false, delete: false },
    ai: { create: true, read: true, update: true, delete: false },
  },
  agent: {
    agencies: { create: false, read: false, update: false, delete: false },
    staff: { create: false, read: false, update: false, delete: false },
    clients: { create: true, read: true, update: true, delete: false },
    bookings: { create: true, read: true, update: true, delete: false },
    services: { create: false, read: true, update: false, delete: false, use: true },
    finances: { create: false, read: false, update: false, delete: false },
    ai: { create: true, read: true, update: true, delete: false },
  },
  finance: {
    agencies: { create: false, read: true, update: false, delete: false },
    staff: { create: false, read: true, update: false, delete: false },
    clients: { create: false, read: true, update: false, delete: false },
    bookings: { create: false, read: true, update: false, delete: false },
    services: { create: false, read: false, update: false, delete: false, use: false },
    finances: { create: false, read: true, update: false, delete: false },
    ai: { create: false, read: false, update: false, delete: false },
  },
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
