export const LOCALES = ["en", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";

export const LOCALE_COOKIE = "freenances-locale";

export const CONTEXT_COOKIE = "freenances-context";

export function isValidLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localeToIntl(locale: Locale): string {
  return locale === "pt" ? "pt-BR" : "en-US";
}
