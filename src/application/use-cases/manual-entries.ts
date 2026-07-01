import type { ContextType } from "@/domain/context/types";
import {
  buildMonthlySummary,
  getMonthBounds,
  isValidCategory,
  type EntryCategory,
  type ManualEntryEntity,
  type MonthlySummary,
} from "@/domain/categories/types";
import type { TransactionType } from "@/domain/ledger/types";
import { roundMoney } from "@/domain/ledger/money-input";
import { prisma } from "@/infrastructure/db/prisma";

import { ensureUserContexts } from "./sync-orchestrator";

export interface CreateManualEntryInput {
  contextType: ContextType;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  postedAt: Date;
}

export type UpdateManualEntryInput = CreateManualEntryInput;

function mapEntry(entry: {
  id: string;
  userId: string;
  contextId: string;
  type: TransactionType;
  category: string;
  amount: unknown;
  description: string;
  postedAt: Date;
}): ManualEntryEntity {
  return {
    id: entry.id,
    userId: entry.userId,
    contextId: entry.contextId,
    type: entry.type,
    category: entry.category as EntryCategory,
    amount: Number(entry.amount),
    description: entry.description,
    postedAt: entry.postedAt,
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

function validateEntryInput(
  type: TransactionType,
  category: string,
  amount: number,
) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (!isValidCategory(type, category)) {
    throw new Error("Invalid category for entry type");
  }
}

export async function createManualEntry(
  userId: string,
  input: CreateManualEntryInput,
): Promise<ManualEntryEntity> {
  validateEntryInput(input.type, input.category, input.amount);

  const context = await getContextForUser(userId, input.contextType);

  const entry = await prisma.manualEntry.create({
    data: {
      userId,
      contextId: context.id,
      type: input.type,
      category: input.category,
      amount: roundMoney(input.amount),
      description: input.description.trim(),
      postedAt: input.postedAt,
    },
  });

  return mapEntry(entry);
}

export async function updateManualEntry(
  userId: string,
  entryId: string,
  input: UpdateManualEntryInput,
): Promise<ManualEntryEntity> {
  validateEntryInput(input.type, input.category, input.amount);

  const existing = await prisma.manualEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!existing) {
    throw new Error("Entry not found");
  }

  const context = await getContextForUser(userId, input.contextType);

  const entry = await prisma.manualEntry.update({
    where: { id: entryId },
    data: {
      contextId: context.id,
      type: input.type,
      category: input.category,
      amount: roundMoney(input.amount),
      description: input.description.trim(),
      postedAt: input.postedAt,
    },
  });

  return mapEntry(entry);
}

export async function listManualEntries(
  userId: string,
  contextType: ContextType,
  month?: string,
): Promise<ManualEntryEntity[]> {
  const context = await getContextForUser(userId, contextType);
  const where: {
    userId: string;
    contextId: string;
    postedAt?: { gte: Date; lt: Date };
  } = {
    userId,
    contextId: context.id,
  };

  if (month) {
    const { start, end } = getMonthBounds(month);
    where.postedAt = { gte: start, lt: end };
  }

  const entries = await prisma.manualEntry.findMany({
    where,
    orderBy: { postedAt: "desc" },
  });

  return entries.map(mapEntry);
}

export async function deleteManualEntry(
  userId: string,
  entryId: string,
): Promise<void> {
  const entry = await prisma.manualEntry.findFirst({
    where: { id: entryId, userId },
  });

  if (!entry) {
    throw new Error("Entry not found");
  }

  await prisma.manualEntry.delete({
    where: { id: entryId },
  });
}

export async function getMonthlySummary(
  userId: string,
  contextType: ContextType,
  month: string,
): Promise<MonthlySummary> {
  const entries = await listManualEntries(userId, contextType, month);

  return buildMonthlySummary(entries);
}
