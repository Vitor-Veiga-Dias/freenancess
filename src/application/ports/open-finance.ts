import type { ContextType } from "@/domain/context/types";
import type { TransactionType } from "@/domain/ledger/types";
import type { ConnectionStatus } from "@/domain/consent/types";

export interface NormalizedAccount {
  providerId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface NormalizedTransaction {
  sourceId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string;
  merchantName?: string;
  postedAt: Date;
}

export interface NormalizedConnection {
  providerItemId: string;
  institutionName: string;
  status: ConnectionStatus;
  consentExpiresAt?: Date;
}

export interface IOpenFinanceProvider {
  createConnectToken(userId: string, context: ContextType): Promise<string>;
  getConnection(providerItemId: string): Promise<NormalizedConnection>;
  listAccounts(providerItemId: string): Promise<NormalizedAccount[]>;
  listTransactions(
    providerAccountId: string,
    since: Date,
  ): Promise<NormalizedTransaction[]>;
  revokeConnection(providerItemId: string): Promise<void>;
}
