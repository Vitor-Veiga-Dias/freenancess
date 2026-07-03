import type { ExpenseCategory } from "@/domain/categories/types";

export interface CategoryBudgetEntity {
  id: string;
  contextId: string;
  category: ExpenseCategory;
  month: string;
  limitAmount: number;
}

export interface BudgetProgress {
  budget: CategoryBudgetEntity;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}

export function computeBudgetProgress(
  budget: CategoryBudgetEntity,
  spentInCategory: number,
): BudgetProgress {
  const spent = Math.max(spentInCategory, 0);
  const remaining = budget.limitAmount - spent;
  const percentUsed =
    budget.limitAmount > 0 ? spent / budget.limitAmount : 0;

  return {
    budget,
    spent,
    remaining,
    percentUsed,
    isOverBudget: spent > budget.limitAmount,
    isNearLimit: percentUsed >= 0.9 && spent <= budget.limitAmount,
  };
}

export function validateBudgetInput(category: string, limitAmount: number): void {
  if (limitAmount <= 0) {
    throw new Error("Budget limit must be greater than zero");
  }

  if (!category || category.length === 0) {
    throw new Error("Category is required");
  }
}
