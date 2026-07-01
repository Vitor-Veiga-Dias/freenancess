"use client";

import { LOCALES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/context";
import { cn } from "@/ui/tokens/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t, isPending } = useI18n();

  return (
    <div
      className={cn("inline-flex rounded-lg bg-elevated/80 p-1 backdrop-blur-sm", className)}
      role="group"
      aria-label={t.language.label}
    >
      {LOCALES.map((code) => {
        const isActive = locale === code;

        return (
          <button
            key={code}
            type="button"
            disabled={isPending}
            onClick={() => setLocale(code as Locale)}
            className={cn(
              "inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium transition-colors duration-150",
              isActive
                ? "bg-surface text-primary"
                : "text-secondary hover:text-primary",
            )}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
