import { useState } from 'react'
import { Bot, BriefcaseBusiness, ChevronDown, CircleCheck, CircleX, Eye, EyeOff, LockKeyhole, Mail, Sparkles, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { agencies } from '../data/mockData'
import { useAuth } from '../context/authCore'
import logo from '../assets/logo.png'
import p2 from '../assets/p2.jpg'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', agency_id: agencies[0]?.id ?? '', role: 'admin' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isNameValid = form.name.trim().length >= 2
  const isNameInvalid = Boolean(form.name.trim()) && form.name.trim().length < 2
  const isEmailValid = Boolean(form.email.trim()) && emailPattern.test(form.email)
  const isEmailInvalid = Boolean(form.email.trim()) && !emailPattern.test(form.email)
  const isPasswordValid = Boolean(form.password.trim()) && form.password.length >= 6
  const isPasswordInvalid = Boolean(form.password.trim()) && form.password.length < 6

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setOk('')
    try {
      await register(form)
      setOk('Account created. You can now log in.')
      setTimeout(() => navigate('/login'), 700)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-50 p-3 font-['Inter'] transition-all duration-300 ease-in-out dark:bg-slate-950 lg:h-[100dvh] lg:overflow-hidden lg:flex lg:items-stretch lg:justify-center lg:p-5">
      <div className="flex min-h-screen w-full items-stretch lg:h-full">
        <div className="w-full max-w-[1280px] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 lg:mx-auto lg:flex lg:h-[640px] lg:max-h-[88vh] lg:items-stretch">
          <section className="relative hidden h-full flex-1 overflow-hidden lg:block">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${p2})` }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[#0EA5E9]/30" />
            <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white xl:p-12">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-widest backdrop-blur-xl">
                  <img src={logo} alt="Navigo logo" className="h-7 w-auto object-contain" />
                  NAVIGO ERP
                </div>
                <h1 className="mt-8 max-w-lg text-3xl font-extrabold leading-tight tracking-[-0.01em]">
                  Manage your travel agency smarter <span className="text-[#F97316]">with AI</span>
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl xl:p-5">
                  <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.85)]" />
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-orange-300" />
                    <p className="text-xs uppercase tracking-widest text-slate-200">AI PLANNER</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">Generate day-by-day trips in seconds.</p>
                </div>
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl xl:p-5">
                  <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.85)]" />
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-orange-300" />
                    <p className="text-xs uppercase tracking-widest text-slate-200">OPERATIONS</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-100">Handle CRM, bookings, and invoices with ease.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative h-full min-h-0 w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-white p-4 transition-all duration-300 ease-in-out dark:bg-slate-900 sm:p-6 lg:flex-1 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(14,165,233,0.08),transparent_55%)]" />
            <div className="relative mx-auto flex h-full w-full max-w-md flex-col justify-center py-3">
              <div className="mb-3 mt-1 text-center">
                  <p className="mx-auto mb-1.5 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[#F97316] transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-orange-200/60 dark:bg-orange-500/10 dark:text-orange-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Welcome back
                  </p>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <img src={logo} alt="Navigo logo" className="h-10 w-auto object-contain" />
                  </div>
                  <h2 className="mt-1.5 text-xl font-bold tracking-[-0.01em] text-slate-800 dark:text-white">Create Account</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">Set up your Navigo workspace access and start managing your agency with AI.</p>
                </div>

                <form className="space-y-2.5" onSubmit={submit}>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="Full name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm outline-none transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                    />
                    {isNameValid ? <CircleCheck className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" /> : null}
                    {isNameInvalid ? <CircleX className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" /> : null}
                  </div>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="Email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm outline-none transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                    />
                    {isEmailValid ? <CircleCheck className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" /> : null}
                    {isEmailInvalid ? <CircleX className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" /> : null}
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-20 text-sm outline-none transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                    />
                    {isPasswordValid ? <CircleCheck className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" /> : null}
                    {isPasswordInvalid ? <CircleX className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" /> : null}
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={form.role}
                      onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-9 text-sm outline-none transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="admin">Agency Admin</option>
                      <option value="agent">Agent</option>
                      <option value="finance">Finance</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select
                      value={form.agency_id}
                      onChange={(event) => setForm((prev) => ({ ...prev, agency_id: event.target.value }))}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-9 text-sm outline-none transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950"
                    >
                      {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  {error ? <p className="text-xs text-rose-600">{error}</p> : null}
                  {ok ? <p className="text-xs text-emerald-600">{ok}</p> : null}
                  <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 text-sm font-bold text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                    Create Account
                  </button>
                </form>
              <p className="pb-1 pt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account? <Link to="/login" className="font-bold text-[#F97316] transition-all duration-300 ease-in-out hover:text-orange-600">Back to login</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
