import type { ManualEntryFields } from "@/domain/entries/types";
import type { TransactionType } from "@/domain/ledger/types";

import {
  formatMonthKey,
  getMonthBounds,
  matchesMonthKey,
} from "./dates";

export { formatMonthKey, getMonthBounds, matchesMonthKey } from "./dates";

export const EXPENSE_CATEGORIES = [
  "housing",
  "food",
  "transport",
  "health",
  "leisure",
  "subscriptions",
  "shopping",
  "other_expense",
] as const;

export const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "investment_income",
  "other_income",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type EntryCategory = ExpenseCategory | IncomeCategory;

export interface ManualEntryEntity extends ManualEntryFields {
  id: string;
  userId: string;
  contextId: string;
  type: TransactionType;
  category: EntryCategory;
  amount: number;
  description: string;
  postedAt: Date;
  fundedByIncomeCategory: IncomeCategory | null;
}

export interface CategoryAggregate {
  category: EntryCategory;
  total: number;
  percentage: number;
}

export interface MonthlySummary {
  totalExpenses: number;
  totalIncome: number;
  investmentTotal: number;
  balance: number;
  expensesByCategory: CategoryAggregate[];
  incomeByCategory: CategoryAggregate[];
  transactionCount: number;
}

export const INVESTMENT_INCOME_CATEGORY: IncomeCategory = "investment_income";

export const FUNDING_INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "other_income",
] as const;

export type FundingIncomeCategory = (typeof FUNDING_INCOME_CATEGORIES)[number];

export function isFundingIncomeCategory(
  category: string,
): category is FundingIncomeCategory {
  return FUNDING_INCOME_CATEGORIES.includes(category as FundingIncomeCategory);
}

export function isFundedInvestmentEntry(
  entry: Pick<ManualEntryEntity, "type" | "category"> & {
    fundedByIncomeCategory?: IncomeCategory | null;
  },
): boolean {
  return (
    entry.type === "CREDIT" &&
    entry.category === INVESTMENT_INCOME_CATEGORY &&
    entry.fundedByIncomeCategory != null &&
    isFundingIncomeCategory(entry.fundedByIncomeCategory)
  );
}

export function getInvestmentIncome(summary: MonthlySummary): number {
  return summary.investmentTotal;
}

export function getOperatingBalance(summary: MonthlySummary): number {
  return summary.totalIncome - getInvestmentIncome(summary) - summary.totalExpenses;
}

export interface MonthlyTrendPoint {
  month: string;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
}

export interface UnifiedSummaryEntry {
  type: TransactionType;
  category: EntryCategory;
  amount: number;
  description: string;
  source: "manual" | "bank";
  fundedByIncomeCategory: IncomeCategory | null;
}

type SummaryEntryInput = Pick<
  ManualEntryEntity,
  "type" | "category" | "amount" | "fundedByIncomeCategory"
>;

export function getCategoriesForType(type: TransactionType): EntryCategory[] {
  return type === "DEBIT"
    ? [...EXPENSE_CATEGORIES]
    : [...INCOME_CATEGORIES];
}

export function isValidCategory(
  type: TransactionType,
  category: string,
): category is EntryCategory {
  if (type === "DEBIT") {
    return EXPENSE_CATEGORIES.includes(category as ExpenseCategory);
  }

  return INCOME_CATEGORIES.includes(category as IncomeCategory);
}

export function aggregateByCategory(
  entries: Pick<ManualEntryEntity, "type" | "category" | "amount">[],
  type: TransactionType,
): CategoryAggregate[] {
  const filtered = entries.filter((entry) => entry.type === type);
  const total = filtered.reduce((sum, entry) => sum + entry.amount, 0);
  const categories =
    type === "DEBIT" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const totals = new Map<string, number>();

  for (const entry of filtered) {
    const categoryKey = isValidCategory(type, entry.category)
      ? entry.category
      : type === "DEBIT"
        ? "other_expense"
        : "other_income";
    totals.set(
      categoryKey,
      (totals.get(categoryKey) ?? 0) + entry.amount,
    );
  }

  return categories
    .map((category) => ({
      category,
      total: totals.get(category) ?? 0,
      percentage: total > 0 ? ((totals.get(category) ?? 0) / total) * 100 : 0,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function buildMonthlySummary(
  entries: SummaryEntryInput[],
): MonthlySummary {
  const totalExpenses = entries
    .filter((entry) => entry.type === "DEBIT")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const incomeEntries = entries.filter((entry) => entry.type === "CREDIT");
  const countableIncomeEntries = incomeEntries.filter(
    (entry) => !isFundedInvestmentEntry(entry),
  );

  const totalIncome = countableIncomeEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

  const investmentTotal = incomeEntries
    .filter((entry) => entry.category === INVESTMENT_INCOME_CATEGORY)
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    totalExpenses,
    totalIncome,
    investmentTotal,
    balance: totalIncome - totalExpenses,
    expensesByCategory: aggregateByCategory(entries, "DEBIT"),
    incomeByCategory: aggregateByCategory(countableIncomeEntries, "CREDIT"),
    transactionCount: entries.length,
  };
}

export function buildUnifiedMonthlySummary(
  entries: UnifiedSummaryEntry[],
): MonthlySummary {
  return buildMonthlySummary(entries);
}

export function buildMonthlyTrend(
  entriesByMonth: Map<string, UnifiedSummaryEntry[]>,
  months: string[],
): MonthlyTrendPoint[] {
  return months.map((month) => {
    const entries = entriesByMonth.get(month) ?? [];
    const summary = buildMonthlySummary(entries);

    return {
      month,
      totalExpenses: summary.totalExpenses,
      totalIncome: summary.totalIncome,
      balance: summary.balance,
    };
  });
}

export function findTopExpenseCategory(
  summary: MonthlySummary,
): CategoryAggregate | null {
  if (summary.expensesByCategory.length === 0) return null;
  return summary.expensesByCategory[0];
}

export function findLargestExpense(
  entries: UnifiedSummaryEntry[],
): UnifiedSummaryEntry | null {
  const expenses = entries.filter((entry) => entry.type === "DEBIT");
  if (expenses.length === 0) return null;

  return expenses.reduce((max, entry) =>
    entry.amount > max.amount ? entry : max,
  );
}