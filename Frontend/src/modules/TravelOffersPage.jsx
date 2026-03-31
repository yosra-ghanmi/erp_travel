import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { generateItinerary, syncOffers } from '../services/erpApi'

export function TravelOffersPage() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [plan, setPlan] = useState(null)

  const hasOffers = useMemo(() => offers.length > 0, [offers])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const response = await syncOffers()
        setOffers(response.offers || [])
        setError('')
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to load travel offers.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleGenerate = async (offerId) => {
    try {
      setActiveId(offerId)
      setError('')
      const response = await generateItinerary(offerId)
      setPlan(response)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to generate itinerary.')
    } finally {
      setActiveId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Travel Offers</h1>
        <p className="text-sm text-slate-500">Sync offers from Business Central and generate premium AI itineraries.</p>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div> : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing offers...
          </div>
        ) : hasOffers ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <div key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">{offer.title}</p>
                  <p className="text-xs text-slate-500">{offer.destination || 'Multiple destinations'}</p>
                  <p className="text-sm text-slate-600">{offer.summary || 'Premium travel offer.'}</p>
                  <div className="text-xs text-slate-500">
                    {offer.duration_days ? `${offer.duration_days} days • ` : ''}
                    {offer.price ? `${offer.price} ${offer.currency || ''}` : 'Pricing on request'}
                  </div>
                </div>
                <button
                  onClick={() => handleGenerate(offer.id)}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                  disabled={activeId === offer.id}
                >
                  {activeId === offer.id ? 'Generating...' : 'Generate AI Itinerary'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No travel offers available.</p>
        )}
      </div>

      {plan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{plan.plan?.title || 'Premium Itinerary'}</h2>
          <p className="mt-1 text-sm text-slate-500">{plan.plan?.summary}</p>
          <div className="mt-4 space-y-3">
            {plan.plan?.days?.map((day) => (
              <div key={day.day} className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">Day {day.day}: {day.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {day.activities?.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
