import { useState, useEffect } from 'react'
import { Button, DataTable, Input, Panel, Select } from '../components/ui'
import { fetchPayments, createPayment, fetchBookings, fetchClients } from '../services/erpApi'

const initialForm = {
  clientNo: '',
  bookingId: '',
  amount: 0,
  method: 'card',
  date: new Date().toISOString().split('T')[0]
}

export function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [bookings, setBookings] = useState([])
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pData, bData, cData] = await Promise.all([fetchPayments(), fetchBookings(), fetchClients()])
        setPayments(pData || [])
        setBookings(bData || [])
        setClients(cData || [])
      } catch (err) {
        console.error("Failed to load payments data:", err)
      }
    }
    loadData()
  }, [])

  const savePayment = async () => {
    if (!form.clientNo || !form.bookingId || !form.amount) return
    setLoading(true)
    setError('')
    try {
      const result = await createPayment(form)
      setPayments((prev) => [...prev, result])
      setForm(initialForm)
    } catch (err) {
      setError('Failed to save payment to Business Central.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel title="Payments History" right={<p className="text-xs text-slate-500">{payments.length} records</p>}>
          {error && <div className="mb-4 text-xs text-rose-500 font-medium">{error}</div>}
          <DataTable
            headers={['Payment ID', 'Client', 'Booking', 'Method', 'Amount', 'Date']}
            rows={payments.map((payment) => (
              <tr key={payment.paymentid} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-3 text-xs font-mono">{payment.paymentid}</td>
                <td className="px-2 py-3">
                  {clients.find(c => (c.no || c.id) === payment.clientno)?.name || payment.clientno}
                </td>
                <td className="px-2 py-3 text-xs font-mono">{payment.bookingid}</td>
                <td className="px-2 py-3 text-xs uppercase">{payment.method}</td>
                <td className="px-2 py-3 font-bold text-emerald-600">${payment.amount}</td>
                <td className="px-2 py-3 text-xs">{payment.date}</td>
              </tr>
            ))}
          />
        </Panel>
      </div>
      <Panel title="Record New Payment">
        <div className="space-y-3">
          <Select value={form.clientNo} onChange={(e) => setForm((prev) => ({ ...prev, clientNo: e.target.value }))}>
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.no || client.id} value={client.no || client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Select value={form.bookingId} onChange={(e) => setForm((prev) => ({ ...prev, bookingId: e.target.value }))}>
            <option value="">Select booking</option>
            {bookings.filter(b => b.clientno === form.clientNo).map((booking) => (
              <option key={booking.bookingid} value={booking.bookingid}>
                {booking.tripname} (${booking.amount})
              </option>
            ))}
          </Select>
          <Input type="number" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="Amount Paid" />
          <Select value={form.method} onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}>
            <option value="card">Credit Card</option>
            <option value="cash">Cash</option>
            <option value="transfer">Bank Transfer</option>
          </Select>
          <Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
          <Button onClick={savePayment} className="w-full" disabled={loading}>
            {loading ? 'Processing...' : 'Save Payment'}
          </Button>
        </div>
      </Panel>
    </div>
  )
}
