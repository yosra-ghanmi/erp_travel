import jsPDF from 'jspdf'
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Button, DataTable, Panel } from '../components/ui'

export function ReportsPage({ bookings, payments, destinations }) {
  const totalRevenue = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0)
  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length
  const canceledBookings = bookings.filter((booking) => booking.status === 'canceled').length

  const exportCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['total_revenue', totalRevenue],
      ['confirmed_bookings', confirmedBookings],
      ['canceled_bookings', canceledBookings],
    ]
    const csv = rows.map((line) => line.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'travel-reports.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Travel Agency Reports', 20, 20)
    doc.setFontSize(12)
    doc.text(`Total Revenue: $${totalRevenue}`, 20, 40)
    doc.text(`Confirmed Bookings: ${confirmedBookings}`, 20, 50)
    doc.text(`Canceled Bookings: ${canceledBookings}`, 20, 60)
    doc.save('travel-reports.pdf')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Panel title="Financial & Booking Performance">
        <div className="space-y-2 text-sm">
          <p>Total revenue: <span className="font-semibold text-emerald-600">${totalRevenue.toLocaleString()}</span></p>
          <p>Confirmed bookings: <span className="font-semibold">{confirmedBookings}</span></p>
          <p>Canceled bookings: <span className="font-semibold">{canceledBookings}</span></p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={exportCsv}>Export CSV</Button>
          <Button variant="ghost" onClick={exportPdf}>Export PDF</Button>
        </div>
      </Panel>

      <Panel title="Top Destinations">
        <DataTable
          headers={['Destination', 'Bookings']}
          rows={destinations.map((destination) => (
            <tr key={destination.destination} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-2 py-3">{destination.destination}</td>
              <td className="px-2 py-3">{destination.bookings}</td>
            </tr>
          ))}
        />
      </Panel>

      <Panel title="Destination Share">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={destinations} dataKey="bookings" nameKey="destination" cx="50%" cy="50%" outerRadius={90} fill="#0ea5e9" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}
