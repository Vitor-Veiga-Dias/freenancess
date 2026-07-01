import { NextResponse } from "next/server";
import { z } from "zod";

import { isValidLocale, LOCALE_COOKIE } from "@/i18n/config";

const bodySchema = z.object({
  locale: z.string(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success || !isValidLocale(parsed.data.locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, locale: parsed.data.locale });

  response.cookies.set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
