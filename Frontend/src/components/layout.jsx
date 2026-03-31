import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Globe2, LogOut, MoonStar, Search, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

export function Layout({
  activeModule,
  onNavigate,
  role,
  modules,
  agencyName,
  language,
  onLanguageChange,
  darkMode,
  onToggleDarkMode,
  notifications,
  pageTitle,
  homePath,
  sessionEmail,
  onLogout,
  children,
}) {
  const [openProfileMenu, setOpenProfileMenu] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [notificationsData] = useState([
    'Agency X just joined',
    'AI Limit reached for Agency Y',
  ])
  const languageOptions = [
    { value: 'en', label: 'EN' },
    { value: 'fr', label: 'FR' },
    { value: 'ar', label: 'AR' },
  ]
  const notificationsRef = useRef(null)
  const languageRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <aside className="hidden w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
          <div>
            <Link to={homePath} className="mb-8 flex w-full items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-12 w-12 items-center justify-center overflow-visible">
                <img src={logo} alt="Navigo logo" className="h-10 w-auto max-w-[42px] shrink-0 object-contain" />
              </div>
              <span className="text-xl font-bold tracking-[-0.01em] text-slate-900 dark:text-white">Navigo</span>
            </Link>
            {agencyName ? <p className="text-xs text-slate-500 dark:text-slate-400">{agencyName}</p> : null}
            <nav className="space-y-2">
              {modules.map((module) => (
                <button
                  key={module.key}
                  onClick={() => onNavigate(module.key)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    activeModule === module.key
                      ? 'bg-cyan-100 text-cyan-800 dark:bg-blue-900/40 dark:text-cyan-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <module.icon className="h-4 w-4" />
                  {module.label}
                </button>
              ))}
            </nav>
          </div>
          {role === 'super_admin' ? <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Navigo </p> : null}
        </aside>

        <main className="flex-1 bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-950 lg:p-8">
          <header className="mb-8 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[200px]">
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{pageTitle}</h2>
              </div>
              <div className="w-full max-w-xl flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search agencies, logs, or settings..."
                    className="w-full rounded-xl border border-slate-200 bg-white/70 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div ref={languageRef} className="relative">
                  <button
                    onClick={() => setIsLanguageOpen((prev) => !prev)}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Toggle language"
                  >
                    <Globe2 className="h-4 w-4" />
                  </button>
                  {isLanguageOpen ? (
                    <div className="absolute right-0 z-20 mt-2 w-24 rounded-xl border border-slate-200 bg-white p-1 shadow-soft dark:border-slate-700 dark:bg-slate-900">
                      {languageOptions.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => {
                            onLanguageChange(item.value)
                            setIsLanguageOpen(false)
                          }}
                          className={`w-full rounded-lg px-2 py-1 text-left text-xs transition ${
                            language === item.value
                              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={onToggleDarkMode}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Toggle theme"
                >
                  <MoonStar className="h-4 w-4" />
                </button>
                <div ref={notificationsRef} className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen((prev) => !prev)}
                    className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{notificationsData.length || notifications.length}</span>
                  </button>
                  {isNotificationsOpen ? (
                    <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
                      {notificationsData.map((item) => (
                        <p key={item} className="rounded-lg px-2 py-2 text-xs text-slate-600 dark:text-slate-300">
                          {item}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenProfileMenu((prev) => !prev)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <UserRound className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                    <div className="text-left">
                      <p className="max-w-[130px] truncate text-xs text-slate-600 dark:text-slate-300">{sessionEmail}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Account</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  </button>
                  {openProfileMenu ? (
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
                      <p className="rounded-lg px-2 py-2 text-xs text-slate-500 dark:text-slate-400">{sessionEmail}</p>
                      <p className="rounded-lg px-2 pb-2 text-xs font-medium uppercase text-cyan-700 dark:text-cyan-400">{role.replace('_', ' ')}</p>
                      <button
                        onClick={onLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  )
}
