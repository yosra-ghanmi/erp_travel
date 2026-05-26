import { Loader2, Plus, Trash2, X, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, IconButton, Input, Panel } from "../components/ui";
import {
  syncOffers,
  createTravelOffer,
  deleteTravelOffer,
  updateTravelOffer,
} from "../services/erpApi";

export function TravelOffersPage({ role, searchQuery }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [newOffer, setNewOffer] = useState({
    title: "",
    destination: "",
    summary: "",
    duration_days: 7,
    price: 0,
    currency: "TND",
    startDate: "2026-01-15",
    endDate: "2026-02-15",
    highlights: [],
  });

  const isSuperAdmin = role === "superadmin";

  const filteredOffers = useMemo(() => {
    if (!searchQuery) return offers;
    const q = searchQuery.toLowerCase();
    return offers.filter((offer) => {
      const title = String(offer.title || "").toLowerCase();
      const destination = String(offer.destination || "").toLowerCase();
      const summary = String(offer.summary || "").toLowerCase();
      return (
        title.includes(q) || destination.includes(q) || summary.includes(q)
      );
    });
  }, [offers, searchQuery]);

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
      if (editingOffer) {
        await updateTravelOffer(editingOffer.id, newOffer);
      } else {
        const offerToCreate = {
          ...newOffer,
          id: `OFFER-${Date.now()}`,
        };
        await createTravelOffer(offerToCreate);
      }
      setShowAddForm(false);
      setEditingOffer(null);
      setNewOffer({
        title: "",
        destination: "",
        summary: "",
        duration_days: 7,
        price: 0,
        currency: "TND",
        startDate: "2026-01-15",
        endDate: "2026-02-15",
        highlights: [],
      });
      await load();
    } catch (err) {
      setError(
        editingOffer
          ? "Failed to update travel offer."
          : "Failed to create travel offer."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setNewOffer({
      title: offer.title,
      destination: offer.destination,
      summary: offer.summary,
      duration_days: offer.duration_days || offer.durationDays,
      price: offer.price,
      currency: offer.currency || offer.currencyCode,
      startDate: offer.startDate || offer.start_date,
      endDate: offer.endDate || offer.end_date,
      highlights: offer.highlights || [],
    });
    setShowAddForm(true);
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      setLoading(true);
      await deleteTravelOffer(offerId);
      await load();
    } catch (err) {
      setError("Failed to delete travel offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Sync offers from Business Central.
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Offer
          </Button>
        )}
      </div>

      {showAddForm && (
        <Panel
          title={editingOffer ? "Edit Travel Offer" : "Create New Travel Offer"}
          right={
            <IconButton
              icon={X}
              onClick={() => {
                setShowAddForm(false);
                setEditingOffer(null);
                setNewOffer({
                  title: "",
                  destination: "",
                  summary: "",
                  duration_days: 7,
                  price: 0,
                  currency: "TND",
                  startDate: "2026-01-15",
                  endDate: "2026-02-15",
                  highlights: [],
                });
              }}
            />
          }
        >
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                  Offer Title
                </label>
                <Input
                  type="text"
                  required
                  value={newOffer.title}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, title: e.target.value })
                  }
                  placeholder="e.g. Luxury Safari in Kenya"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                  Destination
                </label>
                <Input
                  type="text"
                  required
                  value={newOffer.destination}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, destination: e.target.value })
                  }
                  placeholder="e.g. Nairobi & Maasai Mara"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                  Summary
                </label>
                <textarea
                  required
                  value={newOffer.summary}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, summary: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  rows={3}
                  placeholder="Describe the travel offer highlights..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                  Duration (Days)
                </label>
                <Input
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
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                    Price
                  </label>
                  <Input
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
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                    Currency
                  </label>
                  <Input
                    type="text"
                    required
                    value={newOffer.currency}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, currency: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    required
                    value={newOffer.startDate}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400">
                    End Date
                  </label>
                  <Input
                    type="date"
                    required
                    value={newOffer.endDate}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingOffer(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingOffer ? "Update Offer" : "Create Offer"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 shadow-sm">
        {loading && !offers.length ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing offers...
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
              >
                {offer.imageUrl && (
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-brand-500/10 dark:text-brand-400">
                      {offer.destination}
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {offer.price} {offer.currency || offer.currencyCode}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold leading-tight text-gray-900 dark:text-white">
                    {offer.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-500 dark:text-slate-400 line-clamp-3">
                    {offer.summary}
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Duration
                      </span>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {offer.duration_days || offer.durationDays} Days
                      </span>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex gap-1">
                        <IconButton
                          icon={Pencil}
                          onClick={() => handleEditOffer(offer)}
                          title="Edit offer"
                        />
                        <IconButton
                          icon={Trash2}
                          variant="danger"
                          onClick={() => handleDeleteOffer(offer.id)}
                          title="Delete local offer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery
                ? `No travel offers found matching "${searchQuery}"`
                : "No travel offers available."}
            </p>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Create your first offer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
