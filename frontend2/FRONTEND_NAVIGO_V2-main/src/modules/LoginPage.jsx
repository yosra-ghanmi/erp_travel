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

  const googleLogin = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    await login({ email: 'agent@atlas.com', password: '123456' })
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-['Inter'] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -50, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-accent-500/10 blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            x: [0, 50, 0],
            y: [0, -100, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 blur-[110px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-[1100px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-2xl lg:h-[680px]"
      >
        {/* Left Section: Visual & Branding */}
        <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden p-12 lg:flex">
          <div className="absolute inset-0">
            <img src={p1} alt="Travel" className="h-full w-full object-cover opacity-50 transition-transform duration-10000 hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/40 via-brand-800/60 to-slate-900/30" />
          </div>

          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold uppercase tracking-widest backdrop-blur-md"
            >
              <img src={logo} alt="Navigo logo" className="h-8 w-auto brightness-0 invert" />
              <span>NAVIGO ERP</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-10 text-5xl font-black leading-[1.1] tracking-tight text-white"
            >
              Elevate your <br />
              <span className="bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">Travel Business</span> <br />
              with AI.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-6 max-w-md text-lg leading-relaxed text-slate-300"
            >
              Experience the future of agency management. Intelligent, unified, and stunningly simple.
            </motion.p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            {[
              { icon: Bot, title: "AI Planner", desc: "Itineraries in seconds" },
              { icon: BriefcaseBusiness, title: "Operations", desc: "Seamless CRM & ERP" }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + (i * 0.1) }}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:bg-white/10"
              >
                <item.icon className="h-6 w-6 text-accent-400 group-hover:scale-110 transition-transform" />
                <h3 className="mt-4 font-bold text-white uppercase text-xs tracking-wider">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="flex flex-1 flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="mx-auto w-full max-w-sm">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-10 text-center lg:text-left"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-4 py-1.5 text-xs font-bold text-accent-400">
                <Sparkles className="h-4 w-4" />
                NEW VERSION 2.0
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">Welcome Back</h2>
              <p className="mt-2 text-slate-400">Enter your credentials to access your workspace.</p>
            </motion.div>

            <form onSubmit={submit} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Work Email</label>
                <div className="group relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-brand-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-12 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-500/10 ${
                      errors.email ? 'border-rose-500/50 bg-rose-500/5' : ''
                    }`}
                    placeholder="name@agency.com"
                  />
                  {isEmailValid && <CircleCheck className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500" />}
                  {isEmailInvalid && <CircleX className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rose-500" />}
                </div>
                {errors.email && <p className="ml-1 text-xs font-medium text-rose-400">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-bold text-slate-300">Password</label>
                  <Link to="/forgot-password" size="sm" className="text-xs font-bold text-brand-400 hover:text-brand-300">
                    Forgot?
                  </Link>
                </div>
                <div className="group relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-brand-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-24 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-500/10 ${
                      errors.password ? 'border-rose-500/50 bg-rose-500/5' : ''
                    }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
                    {isPasswordValid && <CircleCheck className="h-5 w-5 text-emerald-500" />}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {errors.password && <p className="ml-1 text-xs font-medium text-rose-400">{errors.password}</p>}
              </div>

              <div className="flex items-center px-1">
                <label className="flex cursor-pointer items-center gap-3 group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-white/20 bg-white/5 transition-all checked:border-brand-500 checked:bg-brand-500"
                    />
                    <CircleCheck className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                  </div>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Keep me signed in</span>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!canSubmit || loading}
                className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-brand-500 font-black text-white transition-all hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25"
              >
                {loading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "SIGN IN TO WORKSPACE"
                )}
              </motion.button>

              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-rose-500/10 p-4 text-center text-xs font-bold text-rose-400 border border-rose-500/20"
                >
                  {authError}
                </motion.div>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                  <span className="bg-slate-900/0 px-4 text-slate-500">Or continue with</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={googleLogin}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition-all"
              >
                <GoogleIcon />
                Google Account
              </motion.button>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-slate-500">
              New to Navigo?{" "}
              <Link to="/register" className="font-black text-brand-400 hover:text-brand-300 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

