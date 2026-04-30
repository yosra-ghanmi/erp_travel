import { useMemo, useState } from 'react'
import { Bot, BriefcaseBusiness, CircleCheck, CircleX, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import p1 from '../assets/p1.jpg'
import { useAuth } from '../context/authCore'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M21.35 11.1H12v2.98h5.38c-.23 1.52-1.15 2.8-2.45 3.66v2.98h3.97c2.33-2.15 3.68-5.32 3.68-9.08 0-.77-.07-1.52-.23-2.24Z" fill="#4285F4" />
      <path d="M12 22c2.65 0 4.87-.88 6.5-2.39l-3.97-2.98c-1.1.75-2.51 1.2-4.03 1.2-3.1 0-5.73-2.1-6.67-4.93H-.3v3.1A10.97 10.97 0 0 0 12 22Z" fill="#34A853" />
      <path d="M3.83 12.9a6.62 6.62 0 0 1 0-1.8V8H-.3A10.95 10.95 0 0 0-.3 16l4.13-3.1Z" fill="#fbb905ff" />
      <path d="M12 4.35c1.44 0 2.74.5 3.76 1.47l2.82-2.82A10.9 10.9 0 0 0 12 1 10.97 10.97 0 0 0-.3 8l4.13 3.1c.94-2.83 3.57-4.93 8.17-4.93Z" fill="#EA4335" />
    </svg>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')

  const canSubmit = useMemo(() => form.email && form.password, [form.email, form.password])
  const isEmailValid = Boolean(form.email.trim()) && emailPattern.test(form.email)
  const isEmailInvalid = Boolean(form.email.trim()) && !emailPattern.test(form.email)
  const isPasswordValid = Boolean(form.password.trim()) && form.password.length >= 6
  const isPasswordInvalid = Boolean(form.password.trim()) && form.password.length < 6

  const validate = () => {
    const nextErrors = {}
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    if (form.email.trim() && !emailPattern.test(form.email)) nextErrors.email = 'Please enter a valid email address.'
    if (!form.password.trim()) nextErrors.password = 'Password is required.'
    if (form.password.trim() && form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setAuthError('')
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      await login({ email: form.email, password: form.password })
      setLoading(false)
      navigate('/')
    } catch {
      setLoading(false)
      setAuthError('Invalid credentials. Try one of the demo tenant accounts.')
    }
  }

  const motionItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeInOut' },
  }
  const MotionDiv = motion.div
  const MotionForm = motion.form
  const MotionP = motion.p

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-50 p-3 font-['Inter'] transition-all duration-300 ease-in-out dark:bg-slate-950 lg:h-[100dvh] lg:overflow-hidden lg:flex lg:items-stretch lg:justify-center lg:p-5">
      <div className="flex min-h-screen w-full items-stretch lg:h-full">
        <div className="w-full max-w-[1280px] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 lg:mx-auto lg:flex lg:h-[640px] lg:max-h-[88vh] lg:items-stretch">
          <section className="relative hidden h-full flex-1 overflow-hidden lg:block">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${p1})` }}
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
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-100/90">
                  Unified bookings, clients, payments, reporting, and intelligent itinerary generation in one premium SaaS workspace.
                </p>
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
              <MotionDiv {...motionItem} className="mb-3 mt-1 text-center">
                <p className="mx-auto mb-1.5 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-[#F97316] transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-orange-200/60 dark:bg-orange-500/10 dark:text-orange-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Welcome back
                </p>
                <div className="flex flex-col items-center justify-center gap-2">
                  <img src={logo} alt="Navigo logo" className="h-10 w-auto object-contain" />
                </div>
                <h2 className="mt-1.5 text-xl font-bold tracking-[-0.01em] text-slate-800 dark:text-white">Sign in to Navigo ERP</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">Use your agency account to continue in your AI-powered operations workspace.</p>
              </MotionDiv>

              <MotionForm {...motionItem} className="space-y-2.5" onSubmit={submit} noValidate>
                <div className="space-y-1.5">
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300 sm:text-sm">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm outline-none transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-slate-950 ${
                        errors.email
                          ? 'border-rose-300 ring-rose-200 dark:border-rose-500/50'
                          : 'dark:border-slate-700'
                      }`}
                      placeholder="you@agency.com"
                    />
                    {isEmailValid ? <CircleCheck className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" /> : null}
                    {isEmailInvalid ? <CircleX className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" /> : null}
                  </div>
                  {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300 sm:text-sm">Password</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      className={`h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-20 text-sm outline-none transition-all duration-300 ease-in-out focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:bg-slate-950 ${
                        errors.password
                          ? 'border-rose-300 ring-rose-200 dark:border-rose-500/50'
                          : 'dark:border-slate-700'
                      }`}
                      placeholder="Enter password"
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
                  {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password}</p> : null}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={(event) => setForm((prev) => ({ ...prev, remember: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 accent-[#F97316]"
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="text-sm font-semibold text-[#F97316] transition-all duration-300 ease-in-out hover:text-orange-600">Forgot password?</Link>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 text-sm font-bold text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" /> : null}
                  {loading ? 'Signing in...' : 'Login'}
                </button>
                {authError ? <p className="text-xs text-rose-600">{authError}</p> : null}

              </MotionForm>

              
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
