import { NextResponse } from "next/server";
import { z } from "zod";

import { findInstitution } from "@/domain/open-finance/institutions";
import { isValidContextType } from "@/domain/context/types";
import {
  ensureUserContexts,
  syncConnection,
} from "@/application/use-cases/sync-orchestrator";
import { getServerSession } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/db/prisma";
import { createOpenFinanceProvider } from "@/infrastructure/open-finance/pluggy/provider";

const bodySchema = z.object({
  contextType: z.string(),
  institutionId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success || !isValidContextType(parsed.data.contextType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const institution = findInstitution(parsed.data.institutionId);

  if (!institution) {
    return NextResponse.json({ error: "Institution not found" }, { status: 404 });
  }

  await ensureUserContexts(session.user.id);

  const context = await prisma.financialContext.findUnique({
    where: {
      userId_type: {
        userId: session.user.id,
        type: parsed.data.contextType,
      },
    },
  });

  if (!context) {
    return NextResponse.json({ error: "Context not found" }, { status: 404 });
  }

  const provider = createOpenFinanceProvider();
  const connectToken = await provider.createConnectToken(
    session.user.id,
    parsed.data.contextType,
  );

  const isStub = connectToken === "stub-connect-token";
  const providerItemId = `stub-item-${session.user.id}-${context.type}-${institution.id}`;

  if (isStub) {
    const connection = await prisma.bankConnection.upsert({
      where: { providerItemId },
      create: {
        userId: session.user.id,
        contextId: context.id,
        providerItemId,
        institutionName: institution.name,
        status: "CONNECTED",
        scopes: ["accounts", "transactions"],
        consentExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      update: {
        institutionName: institution.name,
        status: "CONNECTED",
        lastSyncedAt: new Date(),
      },
    });

    await syncConnection(connection.id);

    return NextResponse.json({
      connectToken,
      institutionName: institution.name,
      mode: "stub",
    });
  }

  return NextResponse.json({
    connectToken,
    institutionName: institution.name,
    mode: "pluggy",
  });
}
