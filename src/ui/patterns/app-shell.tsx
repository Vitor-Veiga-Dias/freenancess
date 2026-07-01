"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut } from "lucide-react";

import type { ContextType } from "@/domain/context/types";
import { signOut } from "@/infrastructure/auth/client";
import { useI18n } from "@/i18n/context";
import { APP_NAV_ITEMS, getNavItemForPath } from "@/ui/patterns/app-nav";
import { ContextSwitcher } from "@/ui/patterns/context-switcher";
import { LanguageSwitcher } from "@/ui/patterns/language-switcher";
import { cn } from "@/ui/tokens/cn";

interface AppShellProps {
  children: React.ReactNode;
  initialContext?: ContextType;
}

export function AppShell({
  children,
  initialContext = "PERSONAL",
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [context, setContext] = useState<ContextType>(initialContext);
  const [, startTransition] = useTransition();

  const currentNav = getNavItemForPath(pathname);

  const handleContextChange = useCallback(
    (next: ContextType) => {
      if (next === context) return;

      setContext(next);
      startTransition(async () => {
        await fetch("/api/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contextType: next }),
        });
        router.refresh();
      });
    },
    [context, router],
  );

  const contextLabel =
    context === "PERSONAL" ? t.common.personal : t.common.business;

  return (
    <div className="flex min-h-screen flex-col bg-base text-primary md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-subtle bg-base/50 backdrop-blur-md md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-subtle bg-base/60 px-5 backdrop-blur-md">
          <Link href="/overview" className="text-sm font-semibold tracking-tight">
            freenances
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors",
                  isActive
                    ? "bg-elevated text-primary"
                    : "text-secondary hover:bg-elevated/60 hover:text-primary",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {t.nav[item.labelKey]}
                </span>
                <span className="pl-6 text-xs text-tertiary">
                  {t.nav[item.descriptionKey]}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-subtle p-4">
          <LanguageSwitcher className="w-full justify-center" />
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary transition-colors hover:bg-elevated hover:text-primary"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            {t.common.signOut}
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-subtle bg-base/60 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <Link
              href="/overview"
              className="text-sm font-semibold tracking-tight md:hidden"
            >
              freenances
            </Link>

            {currentNav && (
              <div className="hidden min-w-0 flex-1 md:block">
                <p className="truncate text-sm font-medium">
                  {t.nav[currentNav.labelKey]}
                </p>
                <p className="truncate text-xs text-tertiary">
                  {t.nav[currentNav.descriptionKey]}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 md:ml-auto">
              <LanguageSwitcher className="md:hidden" />
              <ContextSwitcher value={context} onChange={handleContextChange} />
              <button
                type="button"
                onClick={() => signOut()}
                className="text-secondary transition-colors hover:text-primary md:hidden"
                aria-label={t.common.signOut}
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:py-8">
          <div className="mb-6 flex items-center gap-2 text-xs text-tertiary">
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>
              {t.nav.viewingContext.replace("{context}", contextLabel.toLowerCase())}
            </span>
          </div>
          {children}
        </main>

        <nav className="sticky bottom-0 border-t border-subtle bg-base/60 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-around px-1 py-2">
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-tertiary hover:text-secondary",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{t.nav[item.labelKey]}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
