import type { CategoryAggregate, ExpenseCategory } from "@/domain/categories/types";

import type { BudgetProgress } from "./types";

export interface CategoryChartItem extends CategoryAggregate {
  budgetLimit?: number;
  percentOfBudget?: number;
  isOverBudget?: boolean;
}

function mergeBudgets(
  items: CategoryAggregate[],
  budgets: BudgetProgress[],
): CategoryChartItem[] {
  const budgetByCategory = new Map(
    budgets.map((progress) => [progress.budget.category, progress]),
  );

  return items.map((item) => {
    const progress = budgetByCategory.get(item.category as ExpenseCategory);

    if (!progress) {
      return item;
    }

    return {
      ...item,
      budgetLimit: progress.budget.limitAmount,
      percentOfBudget: progress.percentUsed * 100,
      isOverBudget: progress.isOverBudget,
    };
  });
}

export function buildCategoryChartItems(
  items: CategoryAggregate[],
  budgets: BudgetProgress[],
): CategoryChartItem[] {
  const merged = mergeBudgets(items, budgets);
  const budgetOnly = budgets
    .filter(
      (progress) =>
        !merged.some((item) => item.category === progress.budget.category),
    )
    .map((progress) => ({
      category: progress.budget.category,
      total: progress.spent,
      percentage: 0,
      budgetLimit: progress.budget.limitAmount,
      percentOfBudget: progress.percentUsed * 100,
      isOverBudget: progress.isOverBudget,
    }));

  return [...merged, ...budgetOnly].sort((a, b) => b.total - a.total);
}
