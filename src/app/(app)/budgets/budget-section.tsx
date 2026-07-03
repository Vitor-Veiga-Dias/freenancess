"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import type { ContextType } from "@/domain/context/types";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/domain/categories/types";
import type { BudgetProgress } from "@/domain/budgets/types";
import {
  parseMoneyInput,
} from "@/domain/ledger/money-input";
import { useI18n } from "@/i18n/context";
import { getCategoryLabel } from "@/i18n/category-labels";
import { ResponsiveFormShell } from "@/ui/patterns/responsive-form-shell";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { Input } from "@/ui/primitives/input";
import { formatCurrency } from "@/ui/tokens/cn";

const budgetSelectClassName =
  "h-10 w-full rounded-full border border-transparent bg-elevated px-4 text-sm text-primary outline-none focus:border-accent/50";

interface BudgetFormFieldsProps {
  contextType: ContextType;
  month: string;
  onSuccess?: () => void;
}

function BudgetFormFields({ contextType, month, onSuccess }: BudgetFormFieldsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [limitAmount, setLimitAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseMoneyInput(limitAmount);

    if (parsedAmount === null) {
      setError(t.entries.invalidAmount);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contextType,
          category,
          month,
          limitAmount: parsedAmount,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t.budgets.createFailed);
      }

      setLimitAmount("");
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.budgets.createFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs text-secondary">{t.budgets.category}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className={budgetSelectClassName}
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryLabel(t, cat)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-secondary">{t.budgets.limit}</label>
          <Input
            value={limitAmount}
            onChange={(e) =>
              setLimitAmount(e.target.value.replace(/[^\d.,]/g, ""))
            }
            placeholder="0,00"
            required
            className="rounded-full"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full sm:w-auto"
          >
            {loading ? t.entries.submitting : t.budgets.add}
          </Button>
        </div>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
    </>
  );
}

interface BudgetFormProps {
  contextType: ContextType;
  month: string;
}

export function BudgetForm({ contextType, month }: BudgetFormProps) {
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <ResponsiveFormShell
      open={formOpen}
      onOpenChange={setFormOpen}
      title={t.budgets.add}
      triggerLabel={t.budgets.add}
      closeLabel={t.common.close}
    >
      <BudgetFormFields
        contextType={contextType}
        month={month}
        onSuccess={() => setFormOpen(false)}
      />
    </ResponsiveFormShell>
  );
}

interface BudgetListProps {
  budgets: BudgetProgress[];
  contextType: ContextType;
  intlLocale: string;
}

export function BudgetList({
  budgets,
  contextType,
  intlLocale,
}: BudgetListProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (budgets.length === 0) {
    return <Card className="p-5 text-sm text-secondary">{t.budgets.empty}</Card>;
  }

  async function handleDelete(budgetId: string) {
    setDeletingId(budgetId);

    try {
      const response = await fetch(
        `/api/budgets/${budgetId}?contextType=${contextType}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(t.budgets.deleteFailed);
      }

      router.refresh();
    } catch {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {budgets.map((item) => {
        const width = Math.min(item.percentUsed * 100, 100);

        return (
          <Card key={item.budget.id} className="space-y-3 rounded-2xl p-4 md:rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">
                  {getCategoryLabel(t, item.budget.category)}
                </p>
                <p className="text-xs text-tertiary">
                  {t.budgets.spent}{" "}
                  {formatCurrency(item.spent, "BRL", intlLocale)} /{" "}
                  {formatCurrency(item.budget.limitAmount, "BRL", intlLocale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.isOverBudget && (
                  <Badge variant="danger">{t.budgets.overBudget}</Badge>
                )}
                {!item.isOverBudget && item.isNearLimit && (
                  <Badge variant="warning">{t.budgets.nearLimit}</Badge>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(item.budget.id)}
                  disabled={deletingId === item.budget.id}
                  className="rounded-lg p-1.5 text-tertiary transition-colors hover:bg-elevated hover:text-danger"
                  aria-label={t.common.delete}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-elevated">
                <div
                  className={`h-full rounded-full ${
                    item.isOverBudget
                      ? "bg-danger"
                      : item.isNearLimit
                        ? "bg-warning"
                        : "bg-accent"
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className="text-xs text-secondary">
                {t.budgets.remaining}{" "}
                {formatCurrency(item.remaining, "BRL", intlLocale)} ·{" "}
                {Math.round(item.percentUsed * 100)}%
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
