import {
  BrainCircuit,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  Settings,
  UserPlus2,
  Users,
  Wrench,
  Wallet,
  CreditCard,
  ShoppingCart,
} from "lucide-react";

export const modulesByRole = {
  superadmin: [
    {
      key: "platform_overview",
      label: "Platform Overview",
      icon: LayoutDashboard,
    },
    { key: "manage_agencies", label: "Manage Agencies", icon: Building2 },
    { key: "travel_offers", label: "Travel Offers", icon: ClipboardList },
    { key: "ai_usage_logs", label: "AI Usage Logs", icon: BrainCircuit },
    { key: "system_settings", label: "System Settings", icon: Settings },
  ],
  admin: [
    {
      key: "agency_dashboard",
      label: "Agency Dashboard",
      icon: LayoutDashboard,
    },
    { key: "staff_management", label: "Staff Management", icon: UserPlus2 },
    { key: "services", label: "Services", icon: Wrench },
    { key: "clients", label: "Clients", icon: Users },
    { key: "quotes", label: "Quotes", icon: ReceiptText },
    { key: "bookings", label: "Bookings", icon: ClipboardList },
    { key: "travel_offers", label: "Travel Offers", icon: ClipboardList },
    { key: "ai", label: "AI Planner", icon: BrainCircuit },
    { key: "agency_finances", label: "Financial Dashboard", icon: Wallet },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "expenses", label: "Expenses", icon: ShoppingCart },
  ],
  agent: [
    { key: "my_dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { key: "services", label: "Services", icon: Wrench },
    { key: "clients", label: "Clients", icon: Users },
    { key: "quotes", label: "Quotes", icon: ReceiptText },
    { key: "bookings", label: "Bookings", icon: ClipboardList },
    { key: "ai", label: "AI Planner", icon: BrainCircuit },
  ],
  finance: [
    { key: "agency_finances", label: "Financial Dashboard", icon: Wallet },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "expenses", label: "Expenses", icon: ShoppingCart },
  ],
};

export const defaultModuleByRole = {
  superadmin: "platform_overview",
  admin: "agency_dashboard",
  agent: "my_dashboard",
  finance: "agency_finances",
};
