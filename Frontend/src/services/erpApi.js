import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

export const syncOffers = async () => {
  const { data } = await api.get('/api/sync-offers')
  return data
}

export const generateItinerary = async (travelOfferId) => {
  const { data } = await api.post('/api/generate-itinerary', { travelOfferId })
  return data
}

// Clients
export const fetchClients = async () => {
  const { data } = await api.get('/api/clients')
  return data.clients
}

export const createClient = async (clientData) => {
  const { data } = await api.post('/api/clients', clientData)
  return data
}

// Bookings
export const fetchBookings = async () => {
  const { data } = await api.get('/api/bookings')
  return data.bookings
}

export const createBooking = async (bookingData) => {
  const { data } = await api.post('/api/bookings', bookingData)
  return data
}

// Payments
export const fetchPayments = async () => {
  const { data } = await api.get('/api/payments')
  return data.payments
}

export const createPayment = async (paymentData) => {
  const { data } = await api.post('/api/payments', paymentData)
  return data
}

// Expenses
export const fetchExpenses = async () => {
  const { data } = await api.get('/api/expenses')
  return data.expenses
}

export const createExpense = async (expenseData) => {
  const { data } = await api.post('/api/expenses', expenseData)
  return data
}

// Services
export const fetchServices = async () => {
  const { data } = await api.get('/api/services')
  return data.services
}
