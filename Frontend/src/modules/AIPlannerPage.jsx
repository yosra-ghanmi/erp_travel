import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPinned, Sparkles } from "lucide-react";
import { Button, Input, Panel, Select } from "../components/ui";
import {
  createQuote,
  fetchServices,
  generatePlannerItinerary,
} from "../services/erpApi";

const formatCurrency = (value) =>
  `${Math.round(Number(value || 0)).toLocaleString()} TND`;

const STYLE_KEYWORDS = {
  adventure: [
    "adventure",
    "hiking",
    "trek",
    "climb",
    "diving",
    "quad",
    "atv",
    "safari",
    "excursion",
  ],
  luxury: ["luxury", "spa", "resort", "private", "premium", "hotel", "suite"],
  family: ["family", "park", "kids", "aquarium", "zoo", "beach", "museum"],
  culture: [
    "culture",
    "museum",
    "heritage",
    "old town",
    "medina",
    "historic",
    "archaeological",
  ],
};

const DAY_COLORS = ["#0f766e", "#2563eb", "#9333ea", "#d97706", "#dc2626"];
const ALL_INCLUDED_RATE = 80;

function normalizePlannerService(service) {
  return {
    id: service.code ?? service.id ?? `SV-${Date.now()}`,
    name: service.name ?? "Unnamed Service",
    serviceType: service.servicetype ?? service.serviceType ?? "Other",
    location: service.location ?? service.destination ?? "",
    description: service.description ?? service.longdescription ?? "",
    price: Number(service.price ?? 0),
    latitude: Number(service.latitude ?? 0),
    longitude: Number(service.longitude ?? 0),
    imageUrl: service.imageurl ?? service.imageUrl ?? "",
  };
}

function isHotelService(service) {
  return /hotel|resort/i.test(String(service?.serviceType || ""));
}

function estimateServiceCost(service, nights, persons) {
  const price = Number(service?.price || 0);
  const baseCost = isHotelService(service)
    ? price * Math.max(Number(nights) || 1, 1)
    : price;
  return baseCost * Math.max(Number(persons) || 1, 1);
}

function scoreService(service, form) {
  const haystack =
    `${service.name} ${service.serviceType} ${service.location} ${service.description}`.toLowerCase();
  const keywords = STYLE_KEYWORDS[form.activityStyle] ?? [];
  let score = 0;

  if (service.latitude && service.longitude) score += 6;
  if (!service.price || service.price <= form.dailyBudget) score += 3;
  if (service.price && service.price <= form.dailyBudget * 1.5) score += 1;
  if (
    form.destination &&
    haystack.includes(String(form.destination).trim().toLowerCase())
  ) {
    score += 4;
  }
  if (keywords.some((keyword) => haystack.includes(keyword))) score += 5;
  if (
    form.activityStyle === "luxury" &&
    /hotel|resort/i.test(service.serviceType)
  ) {
    score += 2;
  }
  if (
    form.activityStyle === "adventure" &&
    /activity/i.test(service.serviceType)
  ) {
    score += 2;
  }

  return score;
}

function selectPlannerServices(services, form) {
  const normalized = (services || []).map(normalizePlannerService);
  const geocoded = normalized.filter(
    (service) => Number(service.latitude) && Number(service.longitude)
  );
  const prioritized = geocoded
    .map((service) => ({ service, score: scoreService(service, form) }))
    .sort((a, b) => b.score - a.score || a.service.price - b.service.price)
    .map((entry) => entry.service);

  const nights = Math.max(Number(form.numberOfNights || 1), 1);
  const persons = Math.max(Number(form.numberOfPersons || 1), 1);
  const extraCost = form.allIncluded ? ALL_INCLUDED_RATE * persons * nights : 0;
  const totalBudget = Number(form.dailyBudget || 0) * nights * persons;

  const withinBudget = prioritized.filter((service) => {
    const serviceCost = estimateServiceCost(service, nights, persons);
    return (
      (!service.price || service.price <= form.dailyBudget * 1.5) &&
      (totalBudget === 0 || serviceCost + extraCost <= totalBudget)
    );
  });

  const pool = withinBudget.length ? withinBudget : prioritized;
  const limit = Math.max(Number(form.numberOfNights || 0) * 3, 4);

  const selected = [];
  let runningCost = extraCost;
  for (const service of pool) {
    const serviceCost = estimateServiceCost(service, nights, persons);
    if (totalBudget > 0 && runningCost + serviceCost > totalBudget) continue;
    selected.push(service);
    runningCost += serviceCost;
    if (selected.length >= limit) break;
  }

  return selected;
}

function hydrateItineraryCoordinates(itinerary, services) {
  const normalizedServices = (services || []).map(normalizePlannerService);
  const days = (itinerary?.days || []).map((day) => ({
    ...day,
    items: (day.items || []).map((item) => {
      if (Number(item.latitude) && Number(item.longitude)) return item;

      const lookup = `${item.title || ""} ${item.location || ""} ${
        item.description || ""
      }`.toLowerCase();
      const matched = normalizedServices.find((service) => {
        const serviceText =
          `${service.name} ${service.location} ${service.description}`.toLowerCase();
        return (
          serviceText.includes(lookup.trim()) ||
          lookup.includes(service.name.toLowerCase()) ||
          lookup.includes(service.location.toLowerCase())
        );
      });

      if (!matched) return item;

      return {
        ...item,
        location: item.location || matched.location,
        latitude: matched.latitude,
        longitude: matched.longitude,
      };
    }),
  }));

  const attractions = Array.from(
    new Set(
      days.flatMap((day) =>
        (day.items || []).map((item) => item.title).filter(Boolean)
      )
    )
  ).slice(0, 8);

  const hotelSuggestions = normalizedServices
    .filter((service) => /hotel|resort/i.test(service.serviceType))
    .slice(0, 3)
    .map((service) => service.name);

  return {
    ...itinerary,
    days,
    attractions,
    hotelSuggestions,
  };
}

function ItineraryLeafletMap({ itinerary, fallbackServices }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [34.0, 9.0],
      6
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds = [];
    const points = [];
    const items = (itinerary?.days || []).flatMap((day, dayIndex) =>
      (day.items || []).map((item) => ({ ...item, dayIndex, day: day.day }))
    );

    items.forEach((item) => {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      if (!lat || !lng) return;

      const color = DAY_COLORS[item.dayIndex % DAY_COLORS.length];
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(layer);

      marker.bindPopup(`
        <div style="min-width: 180px">
          <strong>Day ${item.day}: ${item.title}</strong><br/>
          <span>${item.location || "Mapped stop"}</span><br/>
          <span>${item.description || ""}</span>
        </div>
      `);

      bounds.push([lat, lng]);
      points.push([lat, lng]);
    });

    if (points.length > 1) {
      L.polyline(points, {
        color: "#0f172a",
        weight: 3,
        opacity: 0.65,
        dashArray: "8 6",
      }).addTo(layer);
    }

    if (!bounds.length) {
      (fallbackServices || []).forEach((service) => {
        const lat = Number(service.latitude);
        const lng = Number(service.longitude);
        if (!lat || !lng) return;
        L.circleMarker([lat, lng], {
          radius: 6,
          color: "#64748b",
          weight: 1,
          fillColor: "#94a3b8",
          fillOpacity: 0.7,
        })
          .bindPopup(
            `<strong>${service.name}</strong><br/>${service.location || ""}`
          )
          .addTo(layer);
        bounds.push([lat, lng]);
      });
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [24, 24] });
    } else {
      map.setView([34.0, 9.0], 6);
    }
  }, [itinerary, fallbackServices]);

  return <div ref={containerRef} className="h-[460px] w-full rounded-xl" />;
}

export function AIPlannerPage({ clients }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: "Tunisia",
    dailyBudget: 200,
    numberOfNights: 3,
    activityStyle: "adventure",
    clientNo: "",
    numberOfPersons: 1,
    allIncluded: false,
  });
  const [services, setServices] = useState([]);
  const [matchedServices, setMatchedServices] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalBudget = useMemo(() => {
    const nights = Math.max(Number(form.numberOfNights || 1), 1);
    const persons = Math.max(Number(form.numberOfPersons || 1), 1);
    return Number(form.dailyBudget || 0) * nights * persons;
  }, [form.dailyBudget, form.numberOfNights, form.numberOfPersons]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const rows = await fetchServices();
        setServices((rows || []).map(normalizePlannerService));
      } catch (err) {
        console.error("Failed to load services for planner:", err);
        setError("Unable to load mapped services for AI planning.");
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (!form.clientNo && clients?.length) {
      setForm((prev) => ({
        ...prev,
        clientNo: clients[0].id || clients[0].no,
      }));
    }
  }, [clients, form.clientNo]);

  const generate = async () => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const selectedServices = selectPlannerServices(services, form);
      setMatchedServices(selectedServices);

      if (!selectedServices.length) {
        throw new Error(
          "No geocoded services are available for this planner request."
        );
      }

      const nights = Math.max(Number(form.numberOfNights || 1), 1);
      const persons = Math.max(Number(form.numberOfPersons || 1), 1);
      const allIncludedCost = form.allIncluded
        ? ALL_INCLUDED_RATE * persons * nights
        : 0;

      const payload = {
        client: {
          no: "AI-PLANNER",
          name: "Navigo Planner",
          preferences: form.activityStyle,
        },
        reservation: {
          reservationNo: `PLAN-${Date.now()}`,
          clientNo: "AI-PLANNER",
          serviceCode: selectedServices[0]?.id ?? "",
          reservationDate: new Date().toISOString().slice(0, 10),
          status: "Planned",
        },
        services: selectedServices.map((service) => ({
          code: service.id,
          name: service.name,
          serviceType: service.serviceType,
          destination: service.location,
          price: service.price,
          currencyCode: "TND",
          description: service.description,
          latitude: service.latitude,
          longitude: service.longitude,
          imageUrl: service.imageUrl,
        })),
        days: nights,
        destination: form.destination,
        activityStyle: form.activityStyle,
        dailyBudget: Number(form.dailyBudget),
        totalBudget,
        numberOfNights: nights,
        numberOfPersons: persons,
        allIncluded: form.allIncluded,
      };

      const response = await generatePlannerItinerary(payload);
      const hydrated = hydrateItineraryCoordinates(response, selectedServices);
      hydrated.planningContext = {
        dailyBudget: Number(form.dailyBudget),
        totalBudget,
        numberOfNights: nights,
        numberOfPersons: persons,
        allIncluded: form.allIncluded,
        extraCost: allIncludedCost,
        matchedServices: selectedServices.length,
      };
      setItinerary(hydrated);
    } catch (err) {
      console.error("AI planner generation failed:", err);
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to generate the AI itinerary."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!itinerary) return;
    if (!form.clientNo) {
      setError("Select a client before creating a quote.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      // Calculate total cost based on matched services prices
      const nights = Math.max(Number(form.numberOfNights || 1), 1);
      const persons = Math.max(Number(form.numberOfPersons || 1), 1);
      const allIncludedCost = form.allIncluded
        ? ALL_INCLUDED_RATE * persons * nights
        : 0;
      const totalCost =
        matchedServices.reduce(
          (sum, service) => sum + estimateServiceCost(service, nights, persons),
          0
        ) + allIncludedCost;

      if (totalCost > totalBudget) {
        throw new Error(
          "Selected itinerary exceeds the requested total budget. Reduce budget or nights and try again."
        );
      }

      const quoteData = {
        clientNo: form.clientNo,
        lineType: "Service",
        quantity: persons,
        numberOfNights: nights,
        discount_percent: 0,
        quoteDate: "2026-01-15",
        validUntilDate: "2026-02-15",
        status: "Draft",
        currencyCode: "TND",
        subtotal: totalCost,
        totalAmount: totalCost,
        serviceItems: matchedServices.map((service) => ({
          lineType: "Service",
          serviceCode: service.id,
          quantity: persons,
          numberOfNights: isHotelService(service) ? nights : 0,
        })),
      };

      const result = await createQuote(quoteData);
      const quoteNo = result.quoteno || result.quoteNo || "new quote";
      setMessage(`Quote ${quoteNo} created successfully.`);

      // Navigate to quotes page after successful creation
      setTimeout(() => {
        navigate("/app/quotes");
      }, 1500);
    } catch (err) {
      console.error("Failed to create quote from itinerary:", err);
      setError(
        err?.response?.data?.detail || err.message || "Failed to create quote."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Panel title="Planner Input">
        <div className="space-y-3">
          <Input
            value={form.destination}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, destination: event.target.value }))
            }
            placeholder="Destination"
          />
          <Input
            type="number"
            value={form.dailyBudget}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                dailyBudget: Number(event.target.value),
              }))
            }
            placeholder="Daily Budget"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="number"
              min={1}
              value={form.numberOfNights}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  numberOfNights: Number(event.target.value),
                }))
              }
              placeholder="Number of Nights"
            />
            <Input
              type="number"
              min={1}
              value={form.numberOfPersons}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  numberOfPersons: Number(event.target.value),
                }))
              }
              placeholder="Number of Persons"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="allIncluded"
              type="checkbox"
              checked={form.allIncluded}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  allIncluded: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
            />
            <label
              htmlFor="allIncluded"
              className="text-sm text-slate-700 dark:text-slate-200"
            >
              All inclusive (transport + guide)
            </label>
          </div>
          <Select
            value={form.clientNo}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, clientNo: event.target.value }))
            }
          >
            <option value="">Select Client</option>
            {(clients || []).map((client) => {
              const clientId = client.id || client.no;
              return (
                <option key={clientId} value={clientId}>
                  {client.name || clientId}
                </option>
              );
            })}
          </Select>
          <Select
            value={form.activityStyle}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                activityStyle: event.target.value,
              }))
            }
          >
            <option value="adventure">Adventure</option>
            <option value="luxury">Luxury</option>
            <option value="family">Family</option>
            <option value="culture">Culture</option>
          </Select>
          <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
            <p>
              Daily budget: <strong>{formatCurrency(form.dailyBudget)}</strong>
            </p>
            <p>
              Nights: <strong>{form.numberOfNights}</strong>
            </p>
            <p>
              Total budget: <strong>{formatCurrency(totalBudget)}</strong>
            </p>
          </div>
          {error ? (
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              {message}
            </div>
          ) : null}
          <Button onClick={generate} className="w-full" disabled={busy}>
            {busy ? "Generating..." : "Generate Plan"}
          </Button>
        </div>
      </Panel>

      <Panel title="Leaflet Map">
        <div className="space-y-3">
          <ItineraryLeafletMap
            itinerary={itinerary}
            fallbackServices={matchedServices}
          />
          <p className="text-xs text-slate-500">
            <MapPinned className="mr-1 inline h-3 w-3" />
            The map uses itinerary coordinates first, then falls back to the
            matched service coordinates if needed.
          </p>
        </div>
      </Panel>

      <Panel title="Generated Itinerary">
        {!itinerary ? (
          <p className="text-sm text-slate-500">
            Generate a plan to preview the AI itinerary and plotted route.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              <p className="font-medium text-slate-800 dark:text-slate-800">
                {itinerary.summary}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Matched services: {itinerary.planningContext?.matchedServices} |
                Persons: {itinerary.planningContext?.numberOfPersons} | Daily
                budget {formatCurrency(itinerary.planningContext?.dailyBudget)}{" "}
                | Total budget{" "}
                {formatCurrency(itinerary.planningContext?.totalBudget)}
              </p>
              {itinerary.planningContext?.allIncluded ? (
                <p className="mt-1 text-xs text-slate-500">
                  All-inclusive transport + guide is included in this plan.
                </p>
              ) : null}
            </div>
            <div>
              <p className="mb-2 font-medium">Highlights</p>
              <ul className="space-y-1 text-xs">
                {(itinerary.attractions || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">Daily Plan</p>
              <div className="max-h-56 space-y-2 overflow-auto">
                {(itinerary.days || []).map((day) => (
                  <div
                    key={day.day}
                    className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                  >
                    <p className="font-medium">
                      Day {day.day} {day.theme ? `- ${day.theme}` : ""}
                    </p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {(day.items || []).map((item) => (
                        <li key={`${day.day}-${item.title}-${item.time || ""}`}>
                          • {item.time ? `${item.time} ` : ""}
                          {item.title}
                          {item.location ? `, ${item.location}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-medium">Cost Breakdown</p>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="space-y-1 text-xs">
                  {(matchedServices || []).map((service) => (
                    <div key={service.id} className="flex justify-between">
                      <span>{service.name}</span>
                      <span className="font-medium">
                        {formatCurrency(
                          estimateServiceCost(
                            service,
                            Math.max(Number(form.numberOfNights || 1), 1),
                            Math.max(Number(form.numberOfPersons || 1), 1)
                          )
                        )}
                      </span>
                    </div>
                  ))}
                  {form.allIncluded ? (
                    <div className="flex justify-between text-sm">
                      <span>Transport + Guide</span>
                      <span className="font-medium">
                        {formatCurrency(
                          ALL_INCLUDED_RATE *
                            Math.max(Number(form.numberOfPersons || 1), 1) *
                            Math.max(Number(form.numberOfNights || 1), 1)
                        )}
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-2 border-t border-slate-300 pt-2 dark:border-slate-600">
                    <div className="flex justify-between font-semibold">
                      <span>Total Estimated Cost</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          matchedServices.reduce(
                            (sum, service) =>
                              sum +
                              estimateServiceCost(
                                service,
                                Math.max(Number(form.numberOfNights || 1), 1),
                                Math.max(Number(form.numberOfPersons || 1), 1)
                              ),
                            0
                          ) +
                            (form.allIncluded
                              ? ALL_INCLUDED_RATE *
                                Math.max(Number(form.numberOfPersons || 1), 1) *
                                Math.max(Number(form.numberOfNights || 1), 1)
                              : 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="success"
              className="w-full"
              onClick={handleCreateQuote}
              disabled={busy || !matchedServices.length}
            >
              {busy ? "Processing..." : "Create Quote"}
            </Button>
            <p className="text-xs text-slate-500">
              <Sparkles className="mr-1 inline h-3 w-3" />
              The planner now uses the backend generator and plots the result on
              Leaflet.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}
