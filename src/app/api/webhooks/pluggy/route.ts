import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/db/prisma";
import { syncConnection } from "@/application/use-cases/sync-orchestrator";

const webhookSchema = z.object({
  event: z.string(),
  itemId: z.string().optional(),
  data: z
    .object({
      itemId: z.string().optional(),
    })
    .optional(),
});

function verifyWebhookSecret(request: Request): boolean {
  const secret = process.env.PLUGGY_WEBHOOK_SECRET;

  if (!secret) {
    return process.env.NODE_ENV === "development";
  }

  const header = request.headers.get("x-pluggy-signature");
  return header === secret;
}

export async function POST(request: Request) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = webhookSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const providerItemId =
    payload.data.itemId ?? payload.data.data?.itemId ?? null;

  if (!providerItemId) {
    return NextResponse.json({ received: true });
  }

  const connection = await prisma.bankConnection.findUnique({
    where: { providerItemId },
  });

  if (!connection) {
    return NextResponse.json({ received: true });
  }

  if (
    payload.data.event === "item/updated" ||
    payload.data.event === "transactions/updated"
  ) {
    await syncConnection(connection.id);
  }

  return NextResponse.json({ received: true });
}
