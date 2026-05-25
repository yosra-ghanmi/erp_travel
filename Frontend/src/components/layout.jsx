import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Globe2,
  LogOut,
  MoonStar,
  Search,
  UserRound,
  X,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { tFor, getDir } from "../i18n";
import logo from "../assets/logo.png";

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
  onMarkNotificationAsRead,
  pageTitle,
  homePath,
  sessionEmail,
  onLogout,
  searchQuery,
  onSearchChange,
  children,
}) {
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const languageOptions = [
    { value: "en", label: "EN" },
    { value: "fr", label: "FR" },
    { value: "ar", label: "AR" },
  ];
  const notificationsRef = useRef(null);
  const languageRef = useRef(null);
  const t = tFor(language);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={darkMode ? "dark" : ""} dir={getDir(language)}>
      <div className="flex min-h-screen bg-gray-50 font-['Inter'] transition-colors duration-500 dark:bg-gray-900">
        {/* Sidebar */}
        <aside className="hidden w-72 border-r border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
          <div className="flex-1">
            <Link
              to={homePath}
              className="group mb-10 flex items-center gap-3 rounded-2xl px-2 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 shadow-sm dark:bg-slate-800 transition-transform group-hover:scale-110">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                  NAVIGO
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-blue-600 dark:text-brand-400">
                  ERP Systems
                </span>
              </div>
            </Link>

            <nav className="space-y-1.5">
              {modules.map((module) => {
                const isActive = activeModule === module.key;
                return (
                  <button
                    key={module.key}
                    onClick={() => onNavigate(module.key)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-tight transition-all duration-300 ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 h-6 w-1 rounded-full bg-brand-600 dark:bg-brand-500"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <module.icon
                      className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                        isActive ? "text-brand-600 dark:text-brand-400" : ""
                      }`}
                    />
                    {t(`modules.${module.key}`) ?? module.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto space-y-4">
            {agencyName && (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Current Agency
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {agencyName}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 px-2 text-[10px] font-medium text-slate-400">
              <Sparkles className="h-3 w-3 text-brand-500" />
              <span>Powered by Navigo AI</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden p-4 lg:p-10">
          <header className="mb-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                  {pageTitle}
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  Welcome back to your workspace.
                </p>
              </div>

              <div className="flex flex-1 items-center justify-end gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("header.search_placeholder")}
                    value={searchQuery || ""}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-10 py-3 text-sm font-medium text-gray-700 outline-none ring-blue-500/10 transition-all focus:border-blue-500 focus:ring-1 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange?.("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div ref={languageRef} className="relative">
                    <button
                      onClick={() => setIsLanguageOpen((prev) => !prev)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Globe2 className="h-5 w-5" />
                    </button>
                    <AnimatePresence>
                      {isLanguageOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 z-30 mt-3 w-32 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-premium dark:border-slate-800 dark:bg-slate-900"
                        >
                          {languageOptions.map((item) => (
                            <button
                              key={item.value}
                              onClick={() => {
                                onLanguageChange(item.value);
                                setIsLanguageOpen(false);
                              }}
                              className={`w-full rounded-xl px-3 py-2 text-left text-xs font-bold transition-all ${
                                language === item.value
                                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={onToggleDarkMode}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <MoonStar className="h-5 w-5" />
                  </button>

                  <div ref={notificationsRef} className="relative">
                    <button
                      onClick={() => setIsNotificationsOpen((prev) => !prev)}
                      className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Bell className="h-5 w-5" />
                      {notifications.filter((n) => !n.read).length > 0 && (
                        <span className="absolute right-2.5 top-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
                          {notifications.filter((n) => !n.read).length}
                        </span>
                      )}
                    </button>
                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 z-30 mt-3 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="p-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              Notifications
                            </h4>
                          </div>
                          <div className="max-h-[400px] overflow-y-auto p-2 [scrollbar-width:none] [\&::-webkit-scrollbar]:hidden">
                            {notifications.length > 0 ? (
                              notifications.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className={`mb-2 flex items-start gap-4 rounded-xl border p-4 transition-all ${
                                    item.read
                                      ? "border-transparent bg-gray-50 dark:bg-slate-800/30"
                                      : "border-blue-100 bg-blue-50/50 dark:border-brand-900/30 dark:bg-brand-900/10"
                                  }`}
                                >
                                  <div className="flex-1">
                                    <p
                                      className={`text-xs font-bold ${
                                        item.read
                                          ? "text-gray-500 dark:text-slate-400"
                                          : "text-gray-900 dark:text-white"
                                      }`}
                                    >
                                      {item.message}
                                    </p>
                                    <p className="mt-1 text-[10px] font-medium text-gray-400">
                                      2 hours ago
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-8 text-center text-xs font-medium text-gray-400">
                                All caught up!
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setOpenProfileMenu((prev) => !prev)}
                      className="group flex h-11 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 transition-all hover:bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-brand-900/40 dark:text-brand-400">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="hidden text-left xl:block">
                        <p className="max-w-[100px] truncate text-xs font-bold text-gray-900 dark:text-white">
                          {sessionEmail?.split("@")[0]}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {role}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openProfileMenu ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {openProfileMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 z-30 mt-3 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="border-b border-gray-100 p-3 dark:border-slate-800">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {sessionEmail}
                            </p>
                          </div>
                          <div className="p-1">
                            <button
                              onClick={onLogout}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 transition-all hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
