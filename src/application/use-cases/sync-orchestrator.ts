import type { Prisma } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";
import { createOpenFinanceProvider } from "@/infrastructure/open-finance/pluggy/provider";

const SYNC_LOOKBACK_DAYS = 90;

export async function syncConnection(connectionId: string): Promise<{
  accountsSynced: number;
  transactionsSynced: number;
}> {
  const provider = createOpenFinanceProvider();

  const connection = await prisma.bankConnection.findUniqueOrThrow({
    where: { id: connectionId },
    include: { bankAccounts: true },
  });

  const remoteConnection = await provider.getConnection(connection.providerItemId);
  const remoteAccounts = await provider.listAccounts(connection.providerItemId);

  let accountsSynced = 0;
  let transactionsSynced = 0;

  const since = new Date();
  since.setDate(since.getDate() - SYNC_LOOKBACK_DAYS);

  for (const remoteAccount of remoteAccounts) {
    const account = await prisma.bankAccount.upsert({
      where: { providerId: remoteAccount.providerId },
      create: {
        connectionId: connection.id,
        contextId: connection.contextId,
        providerId: remoteAccount.providerId,
        name: remoteAccount.name,
        type: remoteAccount.type,
        balance: remoteAccount.balance,
        currency: remoteAccount.currency,
        lastSyncedAt: new Date(),
      },
      update: {
        name: remoteAccount.name,
        balance: remoteAccount.balance,
        lastSyncedAt: new Date(),
      },
    });

    accountsSynced += 1;

    const remoteTransactions = await provider.listTransactions(
      remoteAccount.providerId,
      since,
    );

    for (const remoteTx of remoteTransactions) {
      const existing = await prisma.transaction.findUnique({
        where: { sourceId: remoteTx.sourceId },
      });

      if (existing?.isClassified) {
        continue;
      }

      await prisma.transaction.upsert({
        where: { sourceId: remoteTx.sourceId },
        create: {
          accountId: account.id,
          contextId: connection.contextId,
          sourceId: remoteTx.sourceId,
          type: remoteTx.type,
          amount: remoteTx.amount,
          description: remoteTx.description,
          category: remoteTx.category,
          merchantName: remoteTx.merchantName,
          postedAt: remoteTx.postedAt,
        },
        update: {
          amount: remoteTx.amount,
          description: remoteTx.description,
          category: remoteTx.category,
          merchantName: remoteTx.merchantName,
          postedAt: remoteTx.postedAt,
        },
      });

      transactionsSynced += 1;
    }
  }

  await prisma.bankConnection.update({
    where: { id: connection.id },
    data: {
      status: remoteConnection.status,
      institutionName: remoteConnection.institutionName,
      consentExpiresAt: remoteConnection.consentExpiresAt,
      lastSyncedAt: new Date(),
    },
  });

  const connectionOwner = await prisma.bankConnection.findUnique({
    where: { id: connection.id },
    select: { userId: true },
  });

  if (connectionOwner && transactionsSynced > 0) {
    await prisma.domainEvent.create({
      data: {
        userId: connectionOwner.userId,
        type: "TRANSACTION_SYNCED",
        title: "Transactions synced",
        narrative: `${transactionsSynced} new transactions from ${remoteConnection.institutionName}.`,
        metadata: {
          connectionId: connection.id,
          transactionsSynced,
        } satisfies Prisma.JsonObject,
      },
    });
  }

  return { accountsSynced, transactionsSynced };
}

export async function syncAllConnections(): Promise<{
  connectionsProcessed: number;
  totalTransactions: number;
}> {
  const connections = await prisma.bankConnection.findMany({
    where: { status: { in: ["CONNECTED", "PENDING"] } },
  });

  let totalTransactions = 0;

  for (const connection of connections) {
    const result = await syncConnection(connection.id);
    totalTransactions += result.transactionsSynced;
  }

  return {
    connectionsProcessed: connections.length,
    totalTransactions,
  };
}

export async function ensureUserContexts(userId: string) {
  const existing = await prisma.financialContext.findMany({
    where: { userId },
  });

  const types = new Set(existing.map((ctx) => ctx.type));

  if (!types.has("PERSONAL")) {
    await prisma.financialContext.create({
      data: { userId, type: "PERSONAL", label: "Personal" },
    });
  }

  if (!types.has("BUSINESS")) {
    await prisma.financialContext.create({
      data: { userId, type: "BUSINESS", label: "Business" },
    });
  }
}
