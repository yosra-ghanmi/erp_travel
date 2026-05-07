import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Sparkles, CircleCheck } from 'lucide-react'
import logo from '../assets/logo.png'
import p1 from '../assets/p1.jpg'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!email) return
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSent(true)
    setLoading(false)
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
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-[1000px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/40 shadow-2xl backdrop-blur-2xl lg:h-[600px]"
      >
        {/* Left Section: Visual */}
        <div className="relative hidden w-[40%] flex-col justify-between overflow-hidden p-12 lg:flex">
          <div className="absolute inset-0">
            <img src={p1} alt="Travel" className="h-full w-full object-cover opacity-50 transition-transform duration-10000 hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/60 via-brand-900/80 to-slate-950" />
          </div>

          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold uppercase tracking-widest backdrop-blur-md text-white"
            >
              <img src={logo} alt="Navigo logo" className="h-8 w-auto brightness-0 invert" />
              <span>NAVIGO ERP</span>
            </motion.div>
            
            <h1 className="mt-10 text-4xl font-black leading-[1.1] tracking-tight text-white">
              Secure your <br />
              <span className="bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">Workspace</span>.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Don't worry, it happens to the best of us. We'll help you get back in.
            </p>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="flex flex-1 flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="mx-auto w-full max-w-sm">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 text-center lg:text-left"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-4 py-1.5 text-xs font-bold text-accent-400">
                <Sparkles className="h-4 w-4" />
                RECOVERY MODE
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white">Reset Password</h2>
              <p className="mt-2 text-slate-400">Enter your email and we'll send you a recovery link.</p>
            </motion.div>

            {!sent ? (
              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Work Email</label>
                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-brand-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-brand-500/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-500/10"
                      placeholder="name@agency.com"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-brand-500 font-black text-white transition-all hover:bg-brand-600 disabled:opacity-50 shadow-lg shadow-brand-500/25"
                >
                  {loading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "SEND RECOVERY LINK"
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <CircleCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Check your email</h3>
                <p className="mt-2 text-sm text-slate-400">
                  We've sent a password reset link to <span className="font-bold text-emerald-400">{email}</span>.
                </p>
                <button 
                  onClick={() => setSent(false)}
                  className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Didn't get it? Try again
                </button>
              </motion.div>
            )}

            <div className="mt-8 flex justify-center">
              <Link 
                to="/login" 
                className="group flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
