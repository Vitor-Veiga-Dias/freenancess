import { cookies } from "next/headers";

import type { ContextType } from "@/domain/context/types";
import { isValidContextType } from "@/domain/context/types";

import {
  CONTEXT_COOKIE,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isValidLocale,
  type Locale,
} from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;

  if (value && isValidLocale(value)) {
    return value;
  }

  return DEFAULT_LOCALE;
}

export async function getContextPreference(): Promise<ContextType> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CONTEXT_COOKIE)?.value;

  if (value && isValidContextType(value)) {
    return value;
  }

  return "PERSONAL";
}
