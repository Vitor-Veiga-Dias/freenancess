import type { ContextType } from "@/domain/context/types";
import {
  buildMonthlyTrend,
  buildUnifiedMonthlySummary,
  formatMonthKey,
  getMonthBounds,
  isValidCategory,
  matchesMonthKey,
  type EntryCategory,
  type IncomeCategory,
  type MonthlySummary,
  type MonthlyTrendPoint,
  type UnifiedSummaryEntry,
} from "@/domain/categories/types";
import { normalizeBankCategory } from "@/domain/categories/bank-mapping";
import type { TransactionType } from "@/domain/ledger/types";
import { prisma } from "@/infrastructure/db/prisma";

import { ensureUserContexts } from "./sync-orchestrator";

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

function mapManualToUnified(entry: {
  type: TransactionType;
  category: string;
  amount: unknown;
  description: string;
  fundedByIncomeCategory?: string | null;
}): UnifiedSummaryEntry {
  return {
    type: entry.type,
    category: entry.category as EntryCategory,
    amount: Number(entry.amount),
    description: entry.description,
    source: "manual",
    fundedByIncomeCategory:
      (entry.fundedByIncomeCategory as IncomeCategory | null) ?? null,
  };
}

function mapBankToUnified(tx: {
  type: TransactionType;
  category: string | null;
  amount: unknown;
  description: string;
  isClassified: boolean;
}): UnifiedSummaryEntry {
  const category =
    tx.isClassified && tx.category && isValidCategory(tx.type, tx.category)
      ? (tx.category as EntryCategory)
      : normalizeBankCategory(tx.category, tx.type);

  return {
    type: tx.type,
    category,
    amount: Number(tx.amount),
    description: tx.description,
    source: "bank",
    fundedByIncomeCategory: null,
  };
}

async function fetchUnifiedEntriesForRange(
  userId: string,
  contextId: string,
  start: Date,
  end: Date,
  monthKey?: string,
): Promise<UnifiedSummaryEntry[]> {
  const [manualEntries, bankTransactions] = await Promise.all([
    prisma.manualEntry.findMany({
      where: {
        userId,
        contextId,
        postedAt: { gte: start, lt: end },
      },
    }),
    prisma.transaction.findMany({
      where: {
        contextId,
        postedAt: { gte: start, lt: end },
      },
    }),
  ]);

  const manual = monthKey
    ? manualEntries.filter((entry) => matchesMonthKey(entry.postedAt, monthKey))
    : manualEntries;

  const bank = monthKey
    ? bankTransactions.filter((tx) => matchesMonthKey(tx.postedAt, monthKey))
    : bankTransactions;

  return [
    ...manual.map(mapManualToUnified),
    ...bank.map(mapBankToUnified),
  ];
}

function getPreviousMonths(month: string, count: number): string[] {
  const [year, monthIndex] = month.split("-").map(Number);
  const months: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, monthIndex - 1 - offset, 1));
    months.push(formatMonthKey(date));
  }

  return months;
}

export async function getUnifiedMonthlySummary(
  userId: string,
  contextType: ContextType,
  month: string,
): Promise<{ summary: MonthlySummary; entries: UnifiedSummaryEntry[] }> {
  const context = await getContextForUser(userId, contextType);
  const { start, end } = getMonthBounds(month);
  const entries = await fetchUnifiedEntriesForRange(
    userId,
    context.id,
    start,
    end,
    month,
  );

  return {
    summary: buildUnifiedMonthlySummary(entries),
    entries,
  };
}

export async function getMonthlyTrend(
  userId: string,
  contextType: ContextType,
  month: string,
  months = 6,
): Promise<MonthlyTrendPoint[]> {
  const context = await getContextForUser(userId, contextType);
  const monthKeys = getPreviousMonths(month, months);
  const entriesByMonth = new Map<string, UnifiedSummaryEntry[]>();

  await Promise.all(
    monthKeys.map(async (monthKey) => {
      const { start, end } = getMonthBounds(monthKey);
      const entries = await fetchUnifiedEntriesForRange(
        userId,
        context.id,
        start,
        end,
        monthKey,
      );
      entriesByMonth.set(monthKey, entries);
    }),
  );

  return buildMonthlyTrend(entriesByMonth, monthKeys);
}
