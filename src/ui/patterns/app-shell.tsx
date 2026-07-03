"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut, Menu } from "lucide-react";

import type { ContextType } from "@/domain/context/types";
import { signOut } from "@/infrastructure/auth/client";
import { useI18n } from "@/i18n/context";
import { AppSidebarNav } from "@/ui/patterns/app-sidebar-nav";
import { getNavItemForPath } from "@/ui/patterns/app-nav";
import { BrandLogo } from "@/ui/patterns/brand-logo";
import { Drawer } from "@/ui/patterns/drawer";
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
  const [navOpen, setNavOpen] = useState(false);
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
          <BrandLogo href="/overview" size="sm" />
        </div>
        <AppSidebarNav />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-subtle bg-base/60 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label={t.common.menu}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevated text-primary transition-colors hover:bg-elevated/80 md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center md:justify-start">
              <BrandLogo
                href="/overview"
                size="sm"
                variant="round"
                className="md:hidden"
              />
              <div className="hidden md:block">
                <BrandLogo href="/overview" size="sm" />
              </div>
            </div>

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

            <div className="flex shrink-0 items-center gap-2 md:ml-auto">
              <LanguageSwitcher className="md:hidden" />
              <ContextSwitcher value={context} onChange={handleContextChange} />
            </div>
          </div>
        </header>

        <Drawer
          open={navOpen}
          onClose={() => setNavOpen(false)}
          title={t.common.menu}
          side="left"
          closeLabel={t.common.close}
        >
          <div className="-mx-1 flex min-h-[70dvh] flex-col">
            <div className="mb-5 flex justify-center">
              <BrandLogo href="/overview" size="md" />
            </div>
            <AppSidebarNav
              onNavigate={() => setNavOpen(false)}
              showFooter={false}
            />
            <div className="mt-auto space-y-3 border-t border-subtle pt-4">
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
          </div>
        </Drawer>

        <main
          className={cn(
            "mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8 lg:max-w-7xl lg:px-8",
            "pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-8",
          )}
        >
          <div className="mb-6 flex items-center gap-2 text-xs text-tertiary">
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>
              {t.nav.viewingContext.replace("{context}", contextLabel.toLowerCase())}
            </span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
