"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOut } from "@/infrastructure/auth/client";
import { useI18n } from "@/i18n/context";
import { APP_NAV_ITEMS } from "@/ui/patterns/app-nav";
import { LanguageSwitcher } from "@/ui/patterns/language-switcher";
import { cn } from "@/ui/tokens/cn";

interface AppSidebarNavProps {
  onNavigate?: () => void;
  showFooter?: boolean;
}

export function AppSidebarNav({
  onNavigate,
  showFooter = true,
}: AppSidebarNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      <nav className="flex-1 space-y-1 p-3">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex flex-col gap-0.5 rounded-2xl px-3 py-2.5 transition-colors",
                isActive
                  ? "bg-elevated text-primary"
                  : "text-secondary hover:bg-elevated/60 hover:text-primary",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isActive ? "bg-surface" : "bg-elevated/80",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </span>
                {t.nav[item.labelKey]}
              </span>
              <span className="pl-10 text-xs text-tertiary">
                {t.nav[item.descriptionKey]}
              </span>
            </Link>
          );
        })}
      </nav>

      {showFooter && (
        <div className="space-y-3 border-t border-subtle p-4">
          <LanguageSwitcher className="w-full justify-center" />
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm text-secondary transition-colors hover:bg-elevated hover:text-primary"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            {t.common.signOut}
          </button>
        </div>
      )}
    </>
  );
}
