export const CONNECTION_STATUSES = [
  "PENDING",
  "CONNECTED",
  "ERROR",
  "REVOKED",
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export interface BankConnectionEntity {
  id: string;
  userId: string;
  contextId: string;
  providerItemId: string;
  institutionName: string;
  status: ConnectionStatus;
  scopes: string[];
  consentExpiresAt?: Date | null;
  lastSyncedAt?: Date | null;
}

export function isConsentExpiringSoon(
  connection: Pick<BankConnectionEntity, "consentExpiresAt" | "status">,
  withinDays = 7,
): boolean {
  if (connection.status !== "CONNECTED" || !connection.consentExpiresAt) {
    return false;
  }

  const threshold = Date.now() + withinDays * 24 * 60 * 60 * 1000;
  return connection.consentExpiresAt.getTime() <= threshold;
}
