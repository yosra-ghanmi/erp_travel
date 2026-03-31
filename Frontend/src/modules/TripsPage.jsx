import { useState } from 'react'
import { Button, DataTable, Input, Panel } from '../components/ui'

const blankTrip = {
  title: '',
  destination: '',
  duration: 3,
  price: 0,
  services: '',
  seatsLeft: 10,
}

export function TripsPage({ trips, setTrips, bookings }) {
  const [form, setForm] = useState(blankTrip)

  const addTrip = () => {
    if (!form.title || !form.destination) return
    setTrips((prev) => [...prev, { id: `TR-${400 + prev.length + 1}`, ...form, duration: Number(form.duration), price: Number(form.price), seatsLeft: Number(form.seatsLeft) }])
    setForm(blankTrip)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <Panel title="Trips / Packages">
          <DataTable
            headers={['Package', 'Destination', 'Duration', 'Price', 'Services', 'Availability', 'Assigned Bookings']}
            rows={trips.map((trip) => (
              <tr key={trip.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-2 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{trip.title}</p>
                  <p className="text-xs text-slate-500">{trip.id}</p>
                </td>
                <td className="px-2 py-3">{trip.destination}</td>
                <td className="px-2 py-3">{trip.duration} days</td>
                <td className="px-2 py-3">${trip.price}</td>
                <td className="px-2 py-3 text-xs">{trip.services}</td>
                <td className="px-2 py-3">{trip.seatsLeft} seats</td>
                <td className="px-2 py-3">{bookings.filter((booking) => booking.tripId === trip.id).length}</td>
              </tr>
            ))}
          />
        </Panel>
      </div>
      <Panel title="Create Package">
        <div className="space-y-3">
          <Input placeholder="Package title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          <Input placeholder="Destination" value={form.destination} onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))} />
          <Input type="number" placeholder="Duration (days)" value={form.duration} onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))} />
          <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
          <Input placeholder="Included services" value={form.services} onChange={(e) => setForm((prev) => ({ ...prev, services: e.target.value }))} />
          <Input type="number" placeholder="Seats left" value={form.seatsLeft} onChange={(e) => setForm((prev) => ({ ...prev, seatsLeft: e.target.value }))} />
          <Button onClick={addTrip} className="w-full">Create Trip Package</Button>
        </div>
      </Panel>
    </div>
  )
}
