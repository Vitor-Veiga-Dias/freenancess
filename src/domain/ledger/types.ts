import type { ContextType } from "@/domain/context/types";

export const TRANSACTION_TYPES = ["CREDIT", "DEBIT"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface TransactionEntity {
  id: string;
  accountId: string;
  contextId: string;
  sourceId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string | null;
  merchantName?: string | null;
  postedAt: Date;
  isClassified: boolean;
}

export interface ClassifyTransactionInput {
  transactionId: string;
  contextId: string;
  contextType: ContextType;
}

export class TransactionContextImmutableError extends Error {
  constructor() {
    super("Transaction context cannot be changed after classification is confirmed");
    this.name = "TransactionContextImmutableError";
  }
}

export function assertContextAssignable(
  transaction: Pick<TransactionEntity, "isClassified" | "contextId">,
  newContextId: string,
): void {
  if (transaction.isClassified && transaction.contextId !== newContextId) {
    throw new TransactionContextImmutableError();
  }
}

export function signedAmount(type: TransactionType, amount: number): number {
  return type === "DEBIT" ? -Math.abs(amount) : Math.abs(amount);
}
