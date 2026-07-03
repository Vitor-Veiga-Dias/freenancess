import type { ContextType } from "@/domain/context/types";
import {
  buildMonthlySummary,
  getMonthBounds,
  matchesMonthKey,
  type EntryCategory,
  type ManualEntryEntity,
  type MonthlySummary,
} from "@/domain/categories/types";
import { normalizePostedAt } from "@/domain/categories/dates";
import type { PaymentMode } from "@/domain/entries/types";
import { validateManualEntryInput } from "@/domain/entries/validators";
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
  paymentMode: PaymentMode;
  installmentNumber: number | null;
  installmentTotal: number | null;
  isRecurring: boolean;
  counterparty: string | null;
  fundedByIncomeCategory: string | null;
}

export type UpdateManualEntryInput = CreateManualEntryInput;

export interface ListManualEntriesFilters {
  month?: string;
  type?: TransactionType;
  category?: string;
  isRecurring?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface ListManualEntriesResult {
  entries: ManualEntryEntity[];
  total: number;
  page: number;
  limit: number;
}

function mapEntry(entry: {
  id: string;
  userId: string;
  contextId: string;
  type: TransactionType;
  category: string;
  amount: unknown;
  description: string;
  postedAt: Date;
  paymentMode: PaymentMode;
  installmentNumber: number | null;
  installmentTotal: number | null;
  isRecurring: boolean;
  counterparty: string | null;
  fundedByIncomeCategory: string | null;
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
    paymentMode: entry.paymentMode,
    installmentNumber: entry.installmentNumber,
    installmentTotal: entry.installmentTotal,
    isRecurring: entry.isRecurring,
    counterparty: entry.counterparty,
    fundedByIncomeCategory: entry.fundedByIncomeCategory as ManualEntryEntity["fundedByIncomeCategory"],
  };
}

function mapEntryRow(
  entry: Parameters<typeof mapEntry>[0] & { fundedByIncomeCategory?: string | null },
): ManualEntryEntity {
  return mapEntry({
    ...entry,
    fundedByIncomeCategory: entry.fundedByIncomeCategory ?? null,
  });
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

function normalizeCounterparty(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeFundedByIncomeCategory(
  category: string,
  type: TransactionType,
  value: string | null,
): string | null {
  if (value === null || value.trim().length === 0) {
    return null;
  }

  if (type !== "CREDIT" || category !== "investment_income") {
    return null;
  }

  return value.trim();
}

function validateEntryInput(input: CreateManualEntryInput) {
  validateManualEntryInput({
    type: input.type,
    category: input.category,
    amount: input.amount,
    paymentMode: input.paymentMode,
    installmentNumber: input.installmentNumber,
    installmentTotal: input.installmentTotal,
    counterparty: input.counterparty,
    fundedByIncomeCategory: input.fundedByIncomeCategory,
  });
}

function buildPostedAtFilter(filters: ListManualEntriesFilters) {
  if (filters.month) {
    const { start, end } = getMonthBounds(filters.month);
    return { gte: start, lt: end };
  }

  if (filters.dateFrom || filters.dateTo) {
    const range: { gte?: Date; lte?: Date } = {};
    if (filters.dateFrom) range.gte = filters.dateFrom;
    if (filters.dateTo) range.lte = filters.dateTo;
    return range;
  }

  return undefined;
}

export async function createManualEntry(
  userId: string,
  input: CreateManualEntryInput,
): Promise<ManualEntryEntity> {
  validateEntryInput(input);

  const context = await getContextForUser(userId, input.contextType);

  const entry = await prisma.manualEntry.create({
    data: {
      userId,
      contextId: context.id,
      type: input.type,
      category: input.category,
      amount: roundMoney(input.amount),
      description: input.description.trim(),
      postedAt: normalizePostedAt(input.postedAt),
      paymentMode: input.paymentMode,
      installmentNumber: input.installmentNumber,
      installmentTotal: input.installmentTotal,
      isRecurring: input.isRecurring,
      counterparty: normalizeCounterparty(input.counterparty),
      fundedByIncomeCategory: normalizeFundedByIncomeCategory(
        input.category,
        input.type,
        input.fundedByIncomeCategory,
      ),
    },
  });

  return mapEntryRow(entry);
}

export async function updateManualEntry(
  userId: string,
  entryId: string,
  input: UpdateManualEntryInput,
): Promise<ManualEntryEntity> {
  validateEntryInput(input);

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
      postedAt: normalizePostedAt(input.postedAt),
      paymentMode: input.paymentMode,
      installmentNumber: input.installmentNumber,
      installmentTotal: input.installmentTotal,
      isRecurring: input.isRecurring,
      counterparty: normalizeCounterparty(input.counterparty),
      fundedByIncomeCategory: normalizeFundedByIncomeCategory(
        input.category,
        input.type,
        input.fundedByIncomeCategory,
      ),
    },
  });

  return mapEntryRow(entry);
}

export async function listManualEntries(
  userId: string,
  contextType: ContextType,
  filters: ListManualEntriesFilters = {},
): Promise<ListManualEntriesResult> {
  const context = await getContextForUser(userId, contextType);
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const skip = (page - 1) * limit;

  const where = {
    userId,
    contextId: context.id,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.isRecurring !== undefined
      ? { isRecurring: filters.isRecurring }
      : {}),
    ...(buildPostedAtFilter(filters)
      ? { postedAt: buildPostedAtFilter(filters) }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.manualEntry.findMany({
      where,
      orderBy: { postedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.manualEntry.count({ where }),
  ]);

  const filteredEntries = filters.month
    ? entries.filter((entry) => matchesMonthKey(entry.postedAt, filters.month!))
    : entries;

  return {
    entries: filteredEntries.map(mapEntryRow),
    total: filters.month ? filteredEntries.length : total,
    page,
    limit,
  };
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
  const { entries } = await listManualEntries(userId, contextType, { month });

  return buildMonthlySummary(entries);
}
