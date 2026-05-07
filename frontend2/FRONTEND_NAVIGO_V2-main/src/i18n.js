export const resources = {
  en: {
    modules: {
      platform_overview: 'Platform Overview',
      manage_agencies: 'Manage Agencies',
      travel_offers: 'Travel Offers',
      ai_usage_logs: 'AI Usage Logs',
      system_settings: 'System Settings',
      agency_dashboard: 'Agency Dashboard',
      staff_management: 'Staff Management',
      services: 'Services',
      clients: 'Clients',
      bookings: 'Bookings',
      ai: 'AI Planner',
      agency_finances: 'Financial Dashboard',
      payments: 'Payments',
      expenses: 'Expenses',
      my_dashboard: 'My Dashboard',
    },
    header: {
      search_placeholder: 'Search agencies, logs, or settings...',
    },
    account: {
      account: 'Account',
      sign_out: 'Sign Out',
      powered_by: 'Powered by Navigo',
    },
  },
  fr: {
    modules: {
      platform_overview: 'Aperçu de la Plateforme',
      manage_agencies: 'Gérer les Agences',
      travel_offers: 'Offres de Voyage',
      ai_usage_logs: "Journaux d'utilisation IA",
      system_settings: 'Paramètres Système',
      agency_dashboard: "Tableau de bord de l'Agence",
      staff_management: 'Gestion du Personnel',
      services: 'Services',
      clients: 'Clients',
      bookings: 'Réservations',
      ai: 'Planificateur IA',
      agency_finances: 'Tableau de bord Financier',
      payments: 'Paiements',
      expenses: 'Dépenses',
      my_dashboard: 'Mon Tableau de bord',
    },
    header: {
      search_placeholder: 'Rechercher agences, journaux ou paramètres...',
    },
    account: {
      account: 'Compte',
      sign_out: 'Se Déconnecter',
      powered_by: 'Propulsé par Navigo',
    },
  },
  ar: {
    modules: {
      platform_overview: 'نظرة عامة على المنصة',
      manage_agencies: 'إدارة الوكالات',
      travel_offers: 'عروض السفر',
      ai_usage_logs: 'سجلات استخدام الذكاء الاصطناعي',
      system_settings: 'إعدادات النظام',
      agency_dashboard: 'لوحة تحكم الوكالة',
      staff_management: 'إدارة الموظفين',
      services: 'الخدمات',
      clients: 'العملاء',
      bookings: 'الحجوزات',
      ai: 'مخطط الذكاء الاصطناعي',
      agency_finances: 'لوحة التحكم المالية',
      payments: 'المدفوعات',
      expenses: 'المصروفات',
      my_dashboard: 'لوحتي',
    },
    header: {
      search_placeholder: 'ابحث عن الوكالات أو السجلات أو الإعدادات...',
    },
    account: {
      account: 'الحساب',
      sign_out: 'تسجيل الخروج',
      powered_by: 'بدعم من Navigo',
    },
  },
}

export function tFor(lang) {
  const dict = resources[lang] || resources.en
  return function t(path) {
    const parts = path.split('.')
    let node = dict
    for (const p of parts) {
      if (!node || typeof node !== 'object') return undefined
      node = node[p]
    }
    return node ?? undefined
  }
}

export function getDir(lang) {
  return lang === 'ar' ? 'rtl' : 'ltr'
}
