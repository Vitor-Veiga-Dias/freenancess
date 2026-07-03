import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListPlus,
  PiggyBank,
  Radio,
  Landmark,
} from "lucide-react";

export type AppNavLabelKey =
  | "overview"
  | "entries"
  | "budgets"
  | "feed"
  | "connections";

export type AppNavDescriptionKey =
  | "overviewDescription"
  | "entriesDescription"
  | "budgetsDescription"
  | "feedDescription"
  | "connectionsDescription";

export interface AppNavItem {
  href: string;
  icon: LucideIcon;
  labelKey: AppNavLabelKey;
  descriptionKey: AppNavDescriptionKey;
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
  {
    href: "/budgets",
    icon: PiggyBank,
    labelKey: "budgets",
    descriptionKey: "budgetsDescription",
  },
  {
    href: "/feed",
    icon: Radio,
    labelKey: "feed",
    descriptionKey: "feedDescription",
  },
  {
    href: "/connections",
    icon: Landmark,
    labelKey: "connections",
    descriptionKey: "connectionsDescription",
  },
];

export function getNavItemForPath(pathname: string): AppNavItem | undefined {
  return APP_NAV_ITEMS.find((item) => pathname === item.href);
}
