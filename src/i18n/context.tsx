"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "./config";
import { localeToIntl } from "./config";
import { getDictionary } from "./get-dictionary";
import type { Dictionary } from "@/i18n/types";

interface I18nContextValue {
  locale: Locale;
  intlLocale: string;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;

      startTransition(async () => {
        await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
        setLocaleState(next);
        router.refresh();
      });
    },
    [locale, router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      intlLocale: localeToIntl(locale),
      t: getDictionary(locale),
      setLocale,
      isPending,
    }),
    [locale, setLocale, isPending],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider");
  }

  return context;
}
