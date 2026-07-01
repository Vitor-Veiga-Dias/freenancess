import type { TransactionType } from "@/domain/ledger/types";

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

export interface ManualEntryEntity {
  id: string;
  userId: string;
  contextId: string;
  type: TransactionType;
  category: EntryCategory;
  amount: number;
  description: string;
  postedAt: Date;
}

export interface CategoryAggregate {
  category: EntryCategory;
  total: number;
  percentage: number;
}

export interface MonthlySummary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expensesByCategory: CategoryAggregate[];
  incomeByCategory: CategoryAggregate[];
}

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

  const totals = new Map<string, number>();

  for (const entry of filtered) {
    totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.amount);
  }

  const categories =
    type === "DEBIT" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

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
  entries: Pick<ManualEntryEntity, "type" | "category" | "amount">[],
): MonthlySummary {
  const totalExpenses = entries
    .filter((entry) => entry.type === "DEBIT")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalIncome = entries
    .filter((entry) => entry.type === "CREDIT")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    totalExpenses,
    totalIncome,
    balance: totalIncome - totalExpenses,
    expensesByCategory: aggregateByCategory(entries, "DEBIT"),
    incomeByCategory: aggregateByCategory(entries, "CREDIT"),
  };
}

export function getMonthBounds(month: string): { start: Date; end: Date } {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));

  return { start, end };
}

export function formatMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}
