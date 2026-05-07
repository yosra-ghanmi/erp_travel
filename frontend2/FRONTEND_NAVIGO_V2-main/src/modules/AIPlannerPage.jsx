import { useMemo, useState, useEffect, useRef } from "react";
import { Bot, Sparkles, UserRound, MapPin, DollarSign, Calendar, Compass, Send, Hotel, Map, ChevronRight, CheckCircle2, Wand2, RefreshCw, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, Panel, Select } from "../components/ui";

const formatCurrency = (value) => `$${Math.round(value).toLocaleString()}`;

const buildMockItinerary = ({ destination, budget, dates, preference }) => {
  const dayCount = Math.max(3, Math.min(10, Number(dates) || 5));
  const dailyBase = Number(budget || 1500) / dayCount;
  const mood = {
    luxury: ["Rooftop dining at sunset", "Private guided gallery tour", "Premium spa & wellness session"],
    adventure: ["Guided mountain trek", "Off-road ATV jungle expedition", "Sunrise canyon hike"],
    family: ["Interactive theme park day", "Educational aquarium visit", "Private family cooking class"],
    culture: ["Historic district museum route", "Local artisan workshop tour", "Ancient landmark walking tour"],
  };

  const days = Array.from({ length: dayCount }).map((_, index) => ({
    day: index + 1,
    title: `Day ${index + 1} in ${destination}`,
    activities: [
      `Morning: ${mood[preference]?.[index % 3] ?? "City exploration and local coffee"}`,
      "Afternoon: Signature landmark and cultural immersion",
      "Evening: Fine dining and evening leisure walk",
    ],
    estimatedCost: Math.round(dailyBase),
  }));

  return {
    summary: `A curated ${dayCount}-day ${preference} experience in ${destination}, optimized for a ${formatCurrency(budget || 1500)} budget.`,
    hotelSuggestions: [
      { name: "Azure Bay Resort", price: "Premium", rating: 4.9 },
      { name: "The Atlas Residence", price: "Moderate", rating: 4.7 },
      { name: "City View Boutique", price: "Boutique", rating: 4.8 },
    ],
    attractions: [
      "Historic Old Town",
      "Main National Museum",
      "Panoramic Sky Deck",
      "Local Artisan Market",
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
      content: "Hello! I'm your AI Travel Architect. Tell me where you'd like to go, your budget, and what kind of experience you're looking for.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [itinerary, setItinerary] = useState(null);
  const [busy, setBusy] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: `I want a ${form.dates}-day ${form.preference} trip to ${form.destination} with a budget of ${formatCurrency(form.budget)}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChat(prev => [...prev, userMessage]);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    const generated = buildMockItinerary(form);
    setItinerary(generated);
    
    const aiMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: `Excellent choice! I've designed a custom ${form.preference} itinerary for ${form.destination}. You can see the full breakdown in the itinerary panel.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChat(prev => [...prev, aiMessage]);
    setBusy(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            AI Planner <span className="text-brand-500">.</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Architect your next dream journey with advanced intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 dark:border-slate-900 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Used by 2.4k+ agents
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:h-[calc(100vh-220px)] lg:flex-row">
        {/* Left Column: Input & Controls */}
        <div className="flex flex-col gap-6 lg:w-[380px]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-shrink-0"
        >
          <Panel 
            title={
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-brand-500" />
                <span>Planner Controls</span>
              </div>
            }
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    value={form.destination}
                    onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                    placeholder="e.g. Bali, Paris..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Budget</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white font-bold"
                      value={form.budget}
                      onChange={(e) => setForm((prev) => ({ ...prev, budget: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Days</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="number"
                      className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white font-bold"
                      value={form.dates}
                      onChange={(e) => setForm((prev) => ({ ...prev, dates: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Travel Style</label>
                <div className="relative">
                  <Compass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Select
                    className="pl-10 h-12 bg-slate-50/50 border-transparent focus:bg-white"
                    value={form.preference}
                    onChange={(e) => setForm((prev) => ({ ...prev, preference: e.target.value }))}
                  >
                    <option value="luxury">Luxury & Comfort</option>
                    <option value="adventure">Action & Adventure</option>
                    <option value="family">Family Friendly</option>
                    <option value="culture">Cultural Immersion</option>
                  </Select>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={generate} 
                  className="w-full h-14 text-lg shadow-premium" 
                  disabled={busy}
                >
                  {busy ? (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Architecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      <span>Generate Masterpiece</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </Panel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block"
        >
          <Panel className="bg-gradient-to-br from-brand-600 to-brand-800 text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
              <Bot size={120} />
            </div>
            <h3 className="text-lg font-bold mb-2">Pro Tip</h3>
            <p className="text-sm text-brand-100">
              Our AI considers local weather patterns and seasonal peak times to optimize your daily routes.
            </p>
          </Panel>
        </motion.div>
      </div>

      {/* Middle Column: Chat Interface */}
      <div className="flex flex-col flex-1 gap-6 lg:min-w-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col h-full overflow-hidden"
        >
          <Panel 
            className="flex flex-col h-full"
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                  </div>
                  <div>
                    <p className="font-black text-sm tracking-tight text-slate-900 dark:text-white">Navigo AI Assistant</p>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                      Online & Ready
                    </p>
                  </div>
                </div>
              </div>
            }
          >
            <div className="flex flex-col h-[500px] lg:h-full">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {chat.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-4 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`h-10 w-10 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform hover:scale-110 ${
                          message.role === "user" 
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" 
                            : "bg-brand-50 text-brand-500 dark:bg-brand-900/20"
                        }`}>
                          {message.role === "user" ? <UserRound className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1">
                          <div className={`rounded-[1.5rem] px-5 py-4 text-sm leading-relaxed shadow-soft ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-tr-none"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700"
                          }`}>
                            {message.content}
                          </div>
                          <p className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {busy && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center">
                      <Bot className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] rounded-tl-none px-6 py-4 border border-slate-100 dark:border-slate-700 shadow-soft">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-brand-500/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-brand-500/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-6 relative">
                <Input 
                  placeholder="Ask me to adjust something..." 
                  className="pr-14 h-14 bg-slate-50/50 dark:bg-slate-900/50 border-transparent focus:bg-white transition-all rounded-2xl"
                  onKeyDown={(e) => e.key === 'Enter' && generate()}
                />
                <button 
                  onClick={generate}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/20"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Panel>
        </motion.div>
      </div>

      {/* Right Column: Itinerary Preview */}
      <div className="flex flex-col flex-1 gap-6 lg:w-[450px]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-full"
        >
          <Panel 
            className="h-full flex flex-col"
            title={
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-brand-500" />
                <span>Itinerary Masterplan</span>
              </div>
            }
          >
            {!itinerary ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                  <Compass className="h-8 w-8 text-slate-300 animate-spin-slow" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">No Plan Active</h3>
                <p className="text-sm text-slate-500 max-w-[200px] mt-2">
                  Fill in your preferences and generate a custom AI itinerary.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-gradient-to-r from-brand-50 to-brand-100/50 dark:from-brand-950/30 dark:to-slate-800 p-4 border border-brand-100/50 dark:border-brand-900/30"
                >
                  <p className="text-sm font-medium text-brand-900 dark:text-brand-200 leading-relaxed">
                    <Sparkles className="h-4 w-4 inline-block mr-2 text-brand-500" />
                    {itinerary.summary}
                  </p>
                </motion.div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Budget Allocation
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(itinerary.costBreakdown).map(([key, val]) => (
                      <div key={key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{key}</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    Premium Stays
                  </h4>
                  <div className="grid gap-3">
                    {itinerary.hotelSuggestions.map((hotel, i) => (
                      <motion.div
                        key={hotel.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-premium transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 transition-colors">
                            <Hotel className="h-6 w-6 text-slate-400 group-hover:text-brand-500" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{hotel.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase tracking-widest">{hotel.price}</span>
                              <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">★ {hotel.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight className="h-4 w-4 text-brand-500" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Daily Journey
                  </h4>
                  <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-1 before:bg-gradient-to-b before:from-brand-500/20 before:via-brand-500/5 before:to-transparent">
                    {itinerary.days.map((day, i) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        className="relative pl-14"
                      >
                        <div className="absolute left-4 top-1 h-5 w-5 rounded-full bg-white dark:bg-slate-900 border-4 border-brand-500 z-10 shadow-lg shadow-brand-500/20" />
                        <div className="p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-black text-sm tracking-tight">Day {day.day}</h5>
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] font-black text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full uppercase tracking-widest">
                                {formatCurrency(day.estimatedCost)}
                              </span>
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {day.activities.map((activity, idx) => (
                              <li key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                </div>
                                <span className="pt-0.5 leading-relaxed font-medium">{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-0 pt-6 pb-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl mt-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="success"
                      className="h-14 rounded-2xl shadow-premium text-lg"
                      onClick={() => onSaveAsTrip(itinerary, form)}
                    >
                      Save Trip
                    </Button>
                    <Button
                      className="h-14 rounded-2xl shadow-premium text-lg"
                      onClick={() => onConvertToBooking(itinerary, form, clients?.[0]?.id)}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
