import {
  type LucideIcon,
  LayoutDashboard,
  Bot,
  ShoppingBag,
  Briefcase,
  Settings,
  History,
} from "lucide-react";

export type AppNavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { id: "ip-assistant", label: "IP Assistant", to: "/", icon: LayoutDashboard },
  { id: "ip-imagine", label: "IP Imagine", to: "/ip-imagine", icon: Bot },
  { id: "settings", label: "Settings", to: "/settings", icon: Settings },
  { id: "history", label: "Chat History", to: "/history", icon: History },
];
