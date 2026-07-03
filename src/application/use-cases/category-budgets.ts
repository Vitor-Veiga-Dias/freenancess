import type { ContextType } from "@/domain/context/types";
import {
  EXPENSE_CATEGORIES,
  isValidCategory,
  type ExpenseCategory,
} from "@/domain/categories/types";
import {
  computeBudgetProgress,
  validateBudgetInput,
  type BudgetProgress,
  type CategoryBudgetEntity,
} from "@/domain/budgets/types";
import { getUnifiedMonthlySummary } from "@/application/use-cases/financial-summary";
import { roundMoney } from "@/domain/ledger/money-input";
import { prisma } from "@/infrastructure/db/prisma";

import { ensureUserContexts } from "./sync-orchestrator";

export interface CreateCategoryBudgetInput {
  contextType: ContextType;
  category: string;
  month: string;
  limitAmount: number;
}

export type UpdateCategoryBudgetInput = CreateCategoryBudgetInput;

function mapBudget(budget: {
  id: string;
  contextId: string;
  category: string;
  month: string;
  limitAmount: unknown;
}): CategoryBudgetEntity {
  return {
    id: budget.id,
    contextId: budget.contextId,
    category: budget.category as ExpenseCategory,
    month: budget.month,
    limitAmount: Number(budget.limitAmount),
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

function validateExpenseCategory(category: string): category is ExpenseCategory {
  return (
    isValidCategory("DEBIT", category) &&
    EXPENSE_CATEGORIES.includes(category as ExpenseCategory)
  );
}

export async function createCategoryBudget(
  userId: string,
  input: CreateCategoryBudgetInput,
): Promise<CategoryBudgetEntity> {
  validateBudgetInput(input.category, input.limitAmount);

  if (!validateExpenseCategory(input.category)) {
    throw new Error("Budget category must be an expense category");
  }

  const context = await getContextForUser(userId, input.contextType);

  const budget = await prisma.categoryBudget.create({
    data: {
      contextId: context.id,
      category: input.category,
      month: input.month,
      limitAmount: roundMoney(input.limitAmount),
    },
  });

  return mapBudget(budget);
}

export async function updateCategoryBudget(
  userId: string,
  budgetId: string,
  input: UpdateCategoryBudgetInput,
): Promise<CategoryBudgetEntity> {
  validateBudgetInput(input.category, input.limitAmount);

  if (!validateExpenseCategory(input.category)) {
    throw new Error("Budget category must be an expense category");
  }

  const context = await getContextForUser(userId, input.contextType);

  const existing = await prisma.categoryBudget.findFirst({
    where: { id: budgetId, contextId: context.id },
  });

  if (!existing) {
    throw new Error("Budget not found");
  }

  const budget = await prisma.categoryBudget.update({
    where: { id: budgetId },
    data: {
      category: input.category,
      month: input.month,
      limitAmount: roundMoney(input.limitAmount),
    },
  });

  return mapBudget(budget);
}

export async function deleteCategoryBudget(
  userId: string,
  contextType: ContextType,
  budgetId: string,
): Promise<void> {
  const context = await getContextForUser(userId, contextType);

  const existing = await prisma.categoryBudget.findFirst({
    where: { id: budgetId, contextId: context.id },
  });

  if (!existing) {
    throw new Error("Budget not found");
  }

  await prisma.categoryBudget.delete({ where: { id: budgetId } });
}

export async function listBudgetsWithProgress(
  userId: string,
  contextType: ContextType,
  month: string,
): Promise<BudgetProgress[]> {
  const context = await getContextForUser(userId, contextType);

  const [budgets, { summary }] = await Promise.all([
    prisma.categoryBudget.findMany({
      where: { contextId: context.id, month },
      orderBy: { category: "asc" },
    }),
    getUnifiedMonthlySummary(userId, contextType, month),
  ]);

  const spentByCategory = new Map(
    summary.expensesByCategory.map((item) => [item.category, item.total]),
  );

  return budgets.map((budget) =>
    computeBudgetProgress(
      mapBudget(budget),
      spentByCategory.get(budget.category as ExpenseCategory) ?? 0,
    ),
  );
}
