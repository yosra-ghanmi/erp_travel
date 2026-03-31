const today = new Date()

export const roleOptions = ['super_admin', 'agency_admin', 'agent', 'finance']

export const agencies = [
  { id: 'AG-001', name: 'Atlas Voyages', logo: '/logo-atlas.png', subscription_status: 'active', owner_id: 'USR-1002' },
  { id: 'AG-002', name: 'BluePalm Travel', logo: '/logo-bluepalm.png', subscription_status: 'suspended', owner_id: 'USR-1004' },
]

export const users = [
  { id: 'USR-1001', name: 'Platform Owner', email: 'super@travelerp.com', password: '123456', role: 'super_admin', agency_id: null },
  { id: 'USR-1002', name: 'Amina Atlas', email: 'admin@atlas.com', password: '123456', role: 'agency_admin', agency_id: 'AG-001' },
  { id: 'USR-1003', name: 'Rayan Agent', email: 'agent@atlas.com', password: '123456', role: 'agent', agency_id: 'AG-001' },
  { id: 'USR-1006', name: 'Salma Finance', email: 'finance@atlas.com', password: '123456', role: 'finance', agency_id: 'AG-001' },
  { id: 'USR-1004', name: 'Sofia BluePalm', email: 'admin@bluepalm.com', password: '123456', role: 'agency_admin', agency_id: 'AG-002' },
  { id: 'USR-1005', name: 'Ilyes Seller', email: 'agent@bluepalm.com', password: '123456', role: 'agent', agency_id: 'AG-002' },
]

export const initialClients = [
  { id: 'CL-1001', agency_id: 'AG-001', name: 'Nora Bennett', email: 'nora@demo.com', phone: '+1 202-555-0143', country: 'USA', status: 'vip', notes: 'Prefers boutique hotels and food tours.' },
  { id: 'CL-1002', agency_id: 'AG-001', name: 'Karim El Amrani', email: 'karim@demo.com', phone: '+212 600-221-991', country: 'Morocco', status: 'active', notes: 'Family traveler, needs kid-friendly activities.' },
  { id: 'CL-1003', agency_id: 'AG-002', name: 'Lucia Romano', email: 'lucia@demo.com', phone: '+39 334-555-8291', country: 'Italy', status: 'active', notes: 'Adventure seeker and frequent repeat client.' },
  { id: 'CL-1004', agency_id: 'AG-002', name: 'Kenji Tanaka', email: 'kenji@demo.com', phone: '+81 80-2211-8734', country: 'Japan', status: 'lead', notes: 'Interested in luxury honeymoon package.' },
]

export const initialTrips = [
  { id: 'TR-401', agency_id: 'AG-001', title: 'Bali Escape', destination: 'Bali', duration: 6, price: 1950, services: 'Hotel, breakfast, airport transfer, snorkel day', seatsLeft: 9 },
  { id: 'TR-402', agency_id: 'AG-001', title: 'Paris & Loire', destination: 'France', duration: 8, price: 2650, services: 'Hotel, train tickets, museum pass', seatsLeft: 5 },
  { id: 'TR-403', agency_id: 'AG-002', title: 'Morocco Desert Loop', destination: 'Morocco', duration: 5, price: 1300, services: 'Riad, desert camp, guided city tours', seatsLeft: 12 },
  { id: 'TR-404', agency_id: 'AG-002', title: 'Japan Golden Route', destination: 'Japan', duration: 10, price: 3900, services: 'Hotel, rail pass, tea ceremony, Fuji day trip', seatsLeft: 4 },
]

export const initialServices = [
  { id: 'SV-201', agency_id: 'AG-001', name: 'Airport Pickup', category: 'Transfer', price: 45, active: true },
  { id: 'SV-202', agency_id: 'AG-001', name: 'Visa Assistance', category: 'Documentation', price: 90, active: true },
  { id: 'SV-203', agency_id: 'AG-002', name: 'Travel Insurance', category: 'Insurance', price: 120, active: true },
  { id: 'SV-204', agency_id: 'AG-002', name: 'VIP Lounge Access', category: 'Comfort', price: 65, active: false },
]

export const initialServiceUsage = [
  { id: 'SU-1', agency_id: 'AG-001', serviceId: 'SV-201', usedBy: 'USR-1003', clientId: 'CL-1001', at: '2026-03-15' },
  { id: 'SU-2', agency_id: 'AG-002', serviceId: 'SV-203', usedBy: 'USR-1005', clientId: 'CL-1003', at: '2026-03-18' },
]

export const initialBookings = [
  { id: 'BK-9001', agency_id: 'AG-001', clientId: 'CL-1001', tripId: 'TR-402', destination: 'France', startDate: '2026-05-12', endDate: '2026-05-20', status: 'confirmed', paymentStatus: 'paid', amount: 2650 },
  { id: 'BK-9002', agency_id: 'AG-001', clientId: 'CL-1002', tripId: 'TR-401', destination: 'Morocco', startDate: '2026-04-02', endDate: '2026-04-07', status: 'pending', paymentStatus: 'partial', amount: 1300 },
  { id: 'BK-9003', agency_id: 'AG-002', clientId: 'CL-1003', tripId: 'TR-403', destination: 'Bali', startDate: '2026-06-14', endDate: '2026-06-20', status: 'confirmed', paymentStatus: 'unpaid', amount: 1950 },
  { id: 'BK-9004', agency_id: 'AG-002', clientId: 'CL-1004', tripId: 'TR-404', destination: 'Japan', startDate: '2026-07-01', endDate: '2026-07-10', status: 'canceled', paymentStatus: 'refunded', amount: 3900 },
]

export const initialPayments = [
  { id: 'PM-701', agency_id: 'AG-001', bookingId: 'BK-9001', method: 'card', amount: 2650, date: '2026-02-12', status: 'paid' },
  { id: 'PM-702', agency_id: 'AG-001', bookingId: 'BK-9002', method: 'bank transfer', amount: 650, date: '2026-03-03', status: 'partial' },
  { id: 'PM-703', agency_id: 'AG-002', bookingId: 'BK-9003', method: 'cash', amount: 0, date: '2026-03-09', status: 'unpaid' },
  { id: 'PM-704', agency_id: 'AG-002', bookingId: 'BK-9004', method: 'card', amount: 3900, date: '2026-02-01', status: 'refunded' },
]

export const revenueSeries = Array.from({ length: 7 }).map((_, index) => {
  const month = new Date(today.getFullYear(), today.getMonth() - 6 + index, 1).toLocaleString('en-US', { month: 'short' })
  return {
    month,
    revenue: [15000, 18000, 21000, 17000, 24000, 26000, 30000][index],
    bookings: [21, 28, 32, 25, 35, 39, 44][index],
  }
})

export const topDestinations = [
  { destination: 'Paris', bookings: 24 },
  { destination: 'Bali', bookings: 18 },
  { destination: 'Marrakech', bookings: 16 },
  { destination: 'Tokyo', bookings: 12 },
  { destination: 'Dubai', bookings: 10 },
]

export const activityFeed = [
  { id: 'EV-1', message: 'New booking BK-9005 created for Lucia Romano', at: '15 minutes ago' },
  { id: 'EV-2', message: 'Payment PM-708 marked as paid', at: '38 minutes ago' },
  { id: 'EV-3', message: 'Trip availability updated: Japan Golden Route', at: '1 hour ago' },
  { id: 'EV-4', message: 'Invoice generated for BK-9002', at: '3 hours ago' },
]

export const aiUsageLogs = [
  { id: 'AI-1', agency_id: 'AG-001', user: 'Amina Atlas', promptTokens: 1290, cost: 1.21, at: '2026-03-20 09:12' },
  { id: 'AI-2', agency_id: 'AG-001', user: 'Rayan Agent', promptTokens: 1040, cost: 0.89, at: '2026-03-20 12:47' },
  { id: 'AI-3', agency_id: 'AG-002', user: 'Sofia BluePalm', promptTokens: 2010, cost: 1.88, at: '2026-03-20 14:04' },
]
