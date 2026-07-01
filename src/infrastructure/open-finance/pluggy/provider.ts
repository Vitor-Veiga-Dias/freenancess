import type { ContextType } from "@/domain/context/types";
import type { ConnectionStatus } from "@/domain/consent/types";
import type {
  IOpenFinanceProvider,
  NormalizedAccount,
  NormalizedConnection,
  NormalizedTransaction,
} from "@/application/ports/open-finance";

const PLUGGY_API_URL = "https://api.pluggy.ai";

interface PluggyConnectTokenResponse {
  accessToken: string;
}

interface PluggyItemResponse {
  id: string;
  status: string;
  connector: { name: string };
}

interface PluggyAccountResponse {
  id: string;
  name: string;
  type: string;
  balance: number;
  currencyCode: string;
}

interface PluggyTransactionResponse {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  category?: string;
  merchant?: { name?: string };
  date: string;
}

async function getPluggyApiKey(): Promise<string> {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Pluggy credentials are not configured");
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!response.ok) {
    throw new Error(`Pluggy auth failed: ${response.status}`);
  }

  const data = (await response.json()) as { apiKey: string };
  return data.apiKey;
}

function mapItemStatus(status: string): ConnectionStatus {
  switch (status) {
    case "UPDATED":
    case "LOGIN_IN_PROGRESS":
      return "CONNECTED";
    case "OUTDATED":
      return "ERROR";
    case "WAITING_USER_INPUT":
      return "PENDING";
    default:
      return "ERROR";
  }
}

export class PluggyOpenFinanceProvider implements IOpenFinanceProvider {
  async createConnectToken(userId: string, context: ContextType): Promise<string> {
    const apiKey = await getPluggyApiKey();

    const response = await fetch(`${PLUGGY_API_URL}/connect_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        clientUserId: `${userId}:${context}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create connect token: ${response.status}`);
    }

    const data = (await response.json()) as PluggyConnectTokenResponse;
    return data.accessToken;
  }

  async getConnection(providerItemId: string): Promise<NormalizedConnection> {
    const apiKey = await getPluggyApiKey();

    const response = await fetch(`${PLUGGY_API_URL}/items/${providerItemId}`, {
      headers: { "X-API-KEY": apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item: ${response.status}`);
    }

    const item = (await response.json()) as PluggyItemResponse;

    return {
      providerItemId: item.id,
      institutionName: item.connector.name,
      status: mapItemStatus(item.status),
    };
  }

  async listAccounts(providerItemId: string): Promise<NormalizedAccount[]> {
    const apiKey = await getPluggyApiKey();

    const response = await fetch(
      `${PLUGGY_API_URL}/accounts?itemId=${providerItemId}`,
      { headers: { "X-API-KEY": apiKey } },
    );

    if (!response.ok) {
      throw new Error(`Failed to list accounts: ${response.status}`);
    }

    const data = (await response.json()) as { results: PluggyAccountResponse[] };

    return data.results.map((account) => ({
      providerId: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currencyCode,
    }));
  }

  async listTransactions(
    providerAccountId: string,
    since: Date,
  ): Promise<NormalizedTransaction[]> {
    const apiKey = await getPluggyApiKey();
    const from = since.toISOString().split("T")[0];

    const response = await fetch(
      `${PLUGGY_API_URL}/transactions?accountId=${providerAccountId}&from=${from}&pageSize=500`,
      { headers: { "X-API-KEY": apiKey } },
    );

    if (!response.ok) {
      throw new Error(`Failed to list transactions: ${response.status}`);
    }

    const data = (await response.json()) as { results: PluggyTransactionResponse[] };

    return data.results.map((tx) => ({
      sourceId: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      merchantName: tx.merchant?.name,
      postedAt: new Date(tx.date),
    }));
  }

  async revokeConnection(providerItemId: string): Promise<void> {
    const apiKey = await getPluggyApiKey();

    const response = await fetch(`${PLUGGY_API_URL}/items/${providerItemId}`, {
      method: "DELETE",
      headers: { "X-API-KEY": apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to revoke connection: ${response.status}`);
    }
  }
}

export class StubOpenFinanceProvider implements IOpenFinanceProvider {
  async createConnectToken(): Promise<string> {
    return "stub-connect-token";
  }

  async getConnection(providerItemId: string): Promise<NormalizedConnection> {
    return {
      providerItemId,
      institutionName: "Demo Bank",
      status: "CONNECTED",
      consentExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    };
  }

  async listAccounts(): Promise<NormalizedAccount[]> {
    return [
      {
        providerId: "stub-account-1",
        name: "Checking Account",
        type: "CHECKING",
        balance: 12450.32,
        currency: "BRL",
      },
    ];
  }

  async listTransactions(
    _providerAccountId: string,
    since: Date,
  ): Promise<NormalizedTransaction[]> {
    return [
      {
        sourceId: `stub-tx-${Date.now()}`,
        type: "DEBIT",
        amount: 27.9,
        description: "Spotify subscription",
        category: "Subscription",
        merchantName: "Spotify",
        postedAt: since,
      },
    ];
  }

  async revokeConnection(): Promise<void> {
    return;
  }
}

export function createOpenFinanceProvider(): IOpenFinanceProvider {
  const hasCredentials =
    process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET;

  return hasCredentials
    ? new PluggyOpenFinanceProvider()
    : new StubOpenFinanceProvider();
}
