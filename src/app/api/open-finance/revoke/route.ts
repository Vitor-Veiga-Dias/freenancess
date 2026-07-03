import { NextResponse } from "next/server";
import { z } from "zod";

import { revokeConnection } from "@/application/use-cases/revoke-connection";
import { getServerSession } from "@/infrastructure/auth/session";

const revokeSchema = z.object({
  connectionId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = revokeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await revokeConnection(session.user.id, parsed.data.connectionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revoke connection";

    const status = message === "Connection not found" ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
