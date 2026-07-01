import { NextResponse } from "next/server";
import { z } from "zod";

import { isValidContextType } from "@/domain/context/types";
import { CONTEXT_COOKIE } from "@/i18n/config";

const bodySchema = z.object({
  contextType: z.string(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success || !isValidContextType(parsed.data.contextType)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    contextType: parsed.data.contextType,
  });

  response.cookies.set(CONTEXT_COOKIE, parsed.data.contextType, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
