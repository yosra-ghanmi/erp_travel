import { useMemo, useState } from "react";
import { Bot, Sparkles, UserRound } from "lucide-react";
import { Button, Input, Panel, Select } from "../components/ui";

const formatCurrency = (value) => `$${Math.round(value).toLocaleString()}`;

const buildMockItinerary = ({ destination, budget, dates, preference }) => {
  const dayCount = Math.max(3, Math.min(10, Number(dates) || 5));
  const dailyBase = Number(budget || 1500) / dayCount;
  const mood = {
    luxury: ["Rooftop dining", "Private guide", "5-star spa"],
    adventure: ["Hiking tour", "ATV off-road", "Sunrise trek"],
    family: ["Theme park day", "Aquarium visit", "Cooking class"],
    culture: ["Museum route", "Historic walk", "Local market"],
  };

  const days = Array.from({ length: dayCount }).map((_, index) => ({
    day: index + 1,
    title: `Day ${index + 1} in ${destination}`,
    activities: [
      `Morning: ${mood[preference]?.[index % 3] ?? "City exploration"}`,
      "Afternoon: Signature attraction visit",
      "Evening: Local cuisine and leisure",
    ],
    estimatedCost: Math.round(dailyBase),
  }));

  return {
    summary: `A ${dayCount}-day ${preference} itinerary for ${destination}, optimized around a budget of ${formatCurrency(
      budget || 1500
    )}.`,
    hotelSuggestions: [
      "Azure Bay Hotel",
      "The Atlas Residence",
      "City View Boutique",
    ],
    attractions: [
      "Old Town district",
      "Main cultural museum",
      "Panoramic viewpoint",
      "Local artisan market",
    ],
    costBreakdown: {
      accommodation: Math.round((budget || 1500) * 0.45),
      transport: Math.round((budget || 1500) * 0.2),
      activities: Math.round((budget || 1500) * 0.22),
      food: Math.round((budget || 1500) * 0.13),
    },
    days,
  };
};

async function generateWithOpenAI(prompt, apiKey) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      text: { format: { type: "text" } },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate itinerary from AI provider");
  }

  const data = await response.json();
  return data.output_text || "No itinerary generated";
}

export function AIPlannerPage({ onSaveAsTrip, onConvertToBooking, clients }) {
  const [form, setForm] = useState({
    destination: "Bali",
    budget: 2500,
    dates: 5,
    preference: "adventure",
  });
  const [chat, setChat] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Share destination, budget, days, and style. I can generate a full itinerary.",
    },
  ]);
  const [itinerary, setItinerary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [liveApi, setLiveApi] = useState(false);
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const prompt = useMemo(() => {
    return `Generate a detailed travel itinerary for ${
      form.destination
    } within ${formatCurrency(form.budget)} for ${
      form.dates
    } days. Preferences: ${
      form.preference
    }. Output day-by-day activities, 3 hotel suggestions, top attractions, and estimated costs.`;
  }, [form]);

  const generate = async () => {
    setBusy(true);
    setChat((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: prompt },
    ]);
    try {
      if (liveApi && apiKey) {
        const content = await generateWithOpenAI(prompt, apiKey);
        setChat((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", content },
        ]);
      }
      const generated = buildMockItinerary(form);
      setItinerary(generated);
      setChat((prev) => [
        ...prev,
        { id: Date.now() + 2, role: "assistant", content: generated.summary },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Panel title="Itinerary Input">
        <div className="space-y-3">
          <Input
            value={form.destination}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, destination: e.target.value }))
            }
            placeholder="Destination"
          />
          <Input
            type="number"
            value={form.budget}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, budget: Number(e.target.value) }))
            }
            placeholder="Budget"
          />
          <Input
            type="number"
            value={form.dates}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dates: Number(e.target.value) }))
            }
            placeholder="Days"
          />
          <Select
            value={form.preference}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, preference: e.target.value }))
            }
          >
            <option value="luxury">Luxury</option>
            <option value="adventure">Adventure</option>
            <option value="family">Family</option>
            <option value="culture">Culture</option>
          </Select>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={liveApi && Boolean(apiKey)}
              onChange={(e) => setLiveApi(e.target.checked)}
            />
            Use live AI API{" "}
            {apiKey ? "" : "(add VITE_OPENAI_API_KEY to enable)"}
          </label>
          <Button onClick={generate} className="w-full" disabled={busy}>
            {busy ? "Generating..." : "Generate Plan"}
          </Button>
          <Button variant="ghost" onClick={generate} className="w-full">
            Regenerate Plan
          </Button>
        </div>
      </Panel>

      <Panel title="AI Chat Interface">
        <div className="h-[460px] space-y-3 overflow-auto rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          {chat.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-[11px] opacity-80">
                  {message.role === "user" ? (
                    <UserRound className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                  {message.role}
                </div>
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Generated Itinerary">
        {!itinerary ? (
          <p className="text-sm text-slate-500">
            Generate plan to preview editable itinerary.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {itinerary.summary}
              </p>
            </div>
            <div>
              <p className="mb-2 font-medium">Hotels</p>
              <ul className="space-y-1">
                {itinerary.hotelSuggestions.map((hotel) => (
                  <li key={hotel}>• {hotel}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">Daily Plan</p>
              <div className="max-h-40 space-y-2 overflow-auto">
                {itinerary.days.map((day) => (
                  <div
                    key={day.day}
                    className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"
                  >
                    <p className="font-medium">
                      {day.title} ({formatCurrency(day.estimatedCost)})
                    </p>
                    <ul className="text-xs">
                      {day.activities.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Button
                variant="success"
                onClick={() => onSaveAsTrip(itinerary, form)}
              >
                Save as Trip
              </Button>
              <Button
                onClick={() =>
                  onConvertToBooking(itinerary, form, clients[0]?.id)
                }
              >
                Convert to Booking
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              <Sparkles className="mr-1 inline h-3 w-3" />
              Itinerary remains editable through input updates and regenerate.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}
