import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ListPlus } from "lucide-react";

export interface AppNavItem {
  href: string;
  icon: LucideIcon;
  labelKey: "overview" | "entries";
  descriptionKey: "overviewDescription" | "entriesDescription";
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: "/overview",
    icon: LayoutDashboard,
    labelKey: "overview",
    descriptionKey: "overviewDescription",
  },
  {
    href: "/entries",
    icon: ListPlus,
    labelKey: "entries",
    descriptionKey: "entriesDescription",
  },
];

export function getNavItemForPath(pathname: string): AppNavItem | undefined {
  return APP_NAV_ITEMS.find((item) => pathname === item.href);
}
