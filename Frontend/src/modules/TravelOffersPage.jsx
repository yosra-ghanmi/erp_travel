import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import {
  generateItinerary,
  syncOffers,
  createTravelOffer,
  deleteTravelOffer,
} from "../services/erpApi";

export function TravelOffersPage({ role }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: "",
    destination: "",
    summary: "",
    duration_days: 7,
    price: 0,
    currency: "USD",
    highlights: [],
  });

  const isSuperAdmin = role === "superadmin";

  const load = async () => {
    try {
      setLoading(true);
      const response = await syncOffers();
      setOffers(response.offers || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load travel offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const offerToCreate = {
        ...newOffer,
        id: `OFFER-${Date.now()}`,
      };
      await createTravelOffer(offerToCreate);
      setShowAddForm(false);
      setNewOffer({
        title: "",
        destination: "",
        summary: "",
        duration_days: 7,
        price: 0,
        currency: "USD",
        highlights: [],
      });
      await load();
    } catch (err) {
      setError("Failed to create travel offer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      setLoading(true);
      await deleteTravelOffer(offerId);
      await load();
    } catch (err) {
      setError(
        "Failed to delete travel offer. Note: Only locally created offers can be deleted."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (offerId) => {
    try {
      setActiveId(offerId);
      setError("");
      const response = await generateItinerary(offerId);
      setPlan(response);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to generate itinerary.");
    } finally {
      setActiveId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Travel Offers
          </h1>
          <p className="text-sm text-slate-500">
            Sync offers from Business Central and generate premium AI
            itineraries.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Offer
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Create New Travel Offer
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase">
                  Offer Title
                </label>
                <input
                  type="text"
                  required
                  value={newOffer.title}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="e.g. Luxury Safari in Kenya"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase">
                  Destination
                </label>
                <input
                  type="text"
                  required
                  value={newOffer.destination}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, destination: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="e.g. Nairobi & Maasai Mara"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase">
                  Summary
                </label>
                <textarea
                  required
                  value={newOffer.summary}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, summary: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  rows={3}
                  placeholder="Describe the travel offer highlights..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 uppercase">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newOffer.duration_days}
                  onChange={(e) =>
                    setNewOffer({
                      ...newOffer,
                      duration_days: parseInt(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">
                    Price
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newOffer.price}
                    onChange={(e) =>
                      setNewOffer({
                        ...newOffer,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">
                    Currency
                  </label>
                  <select
                    value={newOffer.currency}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, currency: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="TND">TND</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Offer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading && !offers.length ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing offers...
          </div>
        ) : offers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                {isSuperAdmin && String(offer.id).startsWith("OFFER-") && (
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete local offer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {offer.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {offer.destination || "Multiple destinations"}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {offer.summary || "Premium travel offer."}
                  </p>
                  <div className="text-xs text-slate-500">
                    {offer.duration_days
                      ? `${offer.duration_days} days • `
                      : ""}
                    {offer.price
                      ? `${offer.price} ${offer.currency || ""}`
                      : "Pricing on request"}
                  </div>
                </div>
                <button
                  onClick={() => handleGenerate(offer.id)}
                  className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-indigo-600 hover:text-white transition-colors"
                  disabled={activeId === offer.id}
                >
                  {activeId === offer.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    "Generate AI Itinerary"
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">
              No travel offers available.
            </p>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Create your first offer
              </button>
            )}
          </div>
        )}
      </div>

      {plan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {plan.plan?.title || "Premium Itinerary"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{plan.plan?.summary}</p>
          <div className="mt-4 space-y-3">
            {plan.plan?.days?.map((day) => (
              <div
                key={day.day}
                className="rounded-xl border border-slate-200 px-3 py-2"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Day {day.day}: {day.title}
                </p>
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
  );
}
