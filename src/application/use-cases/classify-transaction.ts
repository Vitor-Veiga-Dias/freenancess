import type { ContextType } from "@/domain/context/types";
import {
  isValidCategory,
} from "@/domain/categories/types";
import { isMappedBankCategory } from "@/domain/categories/bank-mapping";
import type { TransactionEntity, TransactionType } from "@/domain/ledger/types";
import { prisma } from "@/infrastructure/db/prisma";

import { ensureUserContexts } from "./sync-orchestrator";

export interface ClassifyTransactionInput {
  contextType: ContextType;
  category: string;
}

function mapTransaction(tx: {
  id: string;
  accountId: string;
  contextId: string;
  sourceId: string;
  type: TransactionType;
  amount: unknown;
  description: string;
  category: string | null;
  merchantName: string | null;
  postedAt: Date;
  isClassified: boolean;
}): TransactionEntity {
  return {
    id: tx.id,
    accountId: tx.accountId,
    contextId: tx.contextId,
    sourceId: tx.sourceId,
    type: tx.type,
    amount: Number(tx.amount),
    description: tx.description,
    category: tx.category,
    merchantName: tx.merchantName,
    postedAt: tx.postedAt,
    isClassified: tx.isClassified,
  };
}

async function getContextForUser(userId: string, contextType: ContextType) {
  await ensureUserContexts(userId);

  return prisma.financialContext.findUniqueOrThrow({
    where: {
      userId_type: {
        userId,
        type: contextType,
      },
    },
  });
}

export async function listUnclassifiedTransactions(
  userId: string,
  contextType: ContextType,
  limit = 20,
): Promise<TransactionEntity[]> {
  const context = await getContextForUser(userId, contextType);

  const transactions = await prisma.transaction.findMany({
    where: {
      contextId: context.id,
      OR: [{ isClassified: false }, { category: null }],
    },
    orderBy: { postedAt: "desc" },
    take: limit,
  });

  return transactions
    .filter((tx) => !isMappedBankCategory(tx.category))
    .map(mapTransaction);
}

export async function classifyTransaction(
  userId: string,
  transactionId: string,
  input: ClassifyTransactionInput,
): Promise<TransactionEntity> {
  const context = await getContextForUser(userId, input.contextType);

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      contextId: context.id,
      context: { userId },
    },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (!isValidCategory(transaction.type, input.category)) {
    throw new Error("Invalid category for transaction type");
  }

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      category: input.category,
      isClassified: true,
    },
  });

  return mapTransaction(updated);
}
