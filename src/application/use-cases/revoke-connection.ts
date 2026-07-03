import { prisma } from "@/infrastructure/db/prisma";
import { createOpenFinanceProvider } from "@/infrastructure/open-finance/pluggy/provider";

export async function revokeConnection(
  userId: string,
  connectionId: string,
): Promise<void> {
  const connection = await prisma.bankConnection.findFirst({
    where: { id: connectionId, userId },
  });

  if (!connection) {
    throw new Error("Connection not found");
  }

  const provider = createOpenFinanceProvider();
  await provider.revokeConnection(connection.providerItemId);

  await prisma.bankConnection.update({
    where: { id: connectionId },
    data: { status: "REVOKED" },
  });

  await prisma.domainEvent.create({
    data: {
      userId,
      type: "CONNECTION_REVOKED",
      title: "Connection revoked",
      narrative: `${connection.institutionName} was disconnected from Open Finance.`,
      metadata: { connectionId, institutionName: connection.institutionName },
    },
  });
}
