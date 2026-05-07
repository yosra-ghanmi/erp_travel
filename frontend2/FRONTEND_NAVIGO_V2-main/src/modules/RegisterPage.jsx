import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, BriefcaseBusiness, ChevronDown, CircleCheck, CircleX, Eye, EyeOff, LockKeyhole, Mail, Sparkles, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { agencies } from '../data/mockData'
import { useAuth } from '../context/authCore'
import logo from '../assets/logo.png'
import p2 from '../assets/p2.jpg'

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

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', agency_id: agencies[0]?.id ?? '', role: 'admin' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    try {
      await register(form)
      setOk('Account created successfully!')
      setLoading(false)
      setTimeout(() => navigate('/login'), 1500)
    } catch (requestError) {
      setError(requestError.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-['Inter'] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[5%] -right-[5%] w-[45%] h-[45%] rounded-full bg-brand-500/20 blur-[130px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 80, 0],
            y: [0, -60, 0]
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-accent-500/15 blur-[110px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-[1150px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-2xl lg:h-[720px]"
      >
        {/* Left Section: Visual */}
        <div className="relative hidden w-[40%] flex-col justify-between overflow-hidden p-12 lg:flex">
          <div className="absolute inset-0">
            <img src={p2} alt="Travel Registration" className="h-full w-full object-cover opacity-50 transition-transform duration-10000 hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/70 via-brand-900/90 to-slate-950" />
          </div>

          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold uppercase tracking-widest backdrop-blur-md"
            >
              <img src={logo} alt="Navigo logo" className="h-8 w-auto brightness-0 invert" />
              <span>NAVIGO ERP</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 text-4xl font-black leading-[1.1] tracking-tight text-white"
            >
              Join the <br />
              <span className="bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">AI Revolution</span> <br />
              in Travel.
            </motion.h1>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <Sparkles className="h-6 w-6 text-accent-400" />
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                "Navigo transformed how we handle our 200+ monthly bookings. The AI Planner is a game changer."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-500/20 border border-brand-500/40" />
                <div>
                  <p className="text-xs font-bold text-white">Sarah Jenkins</p>
                  <p className="text-[10px] text-slate-400">CEO, Atlas Travel</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="flex flex-1 flex-col justify-center p-8 sm:p-12 lg:p-16 overflow-y-auto custom-scrollbar">
          <div className="mx-auto w-full max-w-md">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center lg:text-left"
            >
              <h2 className="text-3xl font-black tracking-tight text-white">Create Account</h2>
              <p className="mt-2 text-slate-400">Join thousands of agencies growing with AI.</p>
            </motion.div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="group relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400" />
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-500/10"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-500/10"
                      placeholder="john@agency.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="group relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-12 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-500/10"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label>
                  <div className="relative">
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10"
                    >
                      <option value="admin" className="bg-slate-900">Agency Admin</option>
                      <option value="agent" className="bg-slate-900">Agent</option>
                      <option value="finance" className="bg-slate-900">Finance</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Agency</label>
                  <div className="relative">
                    <select
                      value={form.agency_id}
                      onChange={(e) => setForm({ ...form, agency_id: e.target.value })}
                      className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10"
                    >
                      {agencies.map((agency) => <option key={agency.id} value={agency.id} className="bg-slate-900">{agency.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-brand-500 font-black text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "CREATE ACCOUNT"}
              </motion.button>

              {error && <p className="text-center text-xs font-bold text-rose-400">{error}</p>}
              {ok && <p className="text-center text-xs font-bold text-emerald-400">{ok}</p>}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <span className="bg-slate-900/0 px-4">Or join with</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ scale: 0.99 }}
                type="button"
                className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white transition-all"
              >
                <GoogleIcon />
                Google Account
              </motion.button>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-black text-brand-400 hover:text-brand-300 transition-colors">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

