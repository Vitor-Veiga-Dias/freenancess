"use client";

import type { CategoryChartItem } from "@/domain/budgets/chart-items";
import type { EntryCategory } from "@/domain/categories/types";
import { getCategoryLabel } from "@/i18n/category-labels";
import type { Dictionary } from "@/i18n/types";
import { Card } from "@/ui/primitives/card";
import { cn, formatCurrency } from "@/ui/tokens/cn";

interface CategoryExpenseChartProps {
  items: CategoryChartItem[];
  t: Dictionary;
  intlLocale: string;
  emptyMessage: string;
  title: string;
}

export function CategoryExpenseChart({
  items,
  t,
  intlLocale,
  emptyMessage,
  title,
}: CategoryExpenseChartProps) {
  if (items.length === 0) {
    return (
      <Card className="p-5 text-sm text-secondary">{emptyMessage}</Card>
    );
  }

  const maxValue = Math.max(
    ...items.map((item) => Math.max(item.total, item.budgetLimit ?? 0)),
    1,
  );

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-xs font-medium uppercase tracking-widest text-secondary">
        {title}
      </h2>
      <div className="flex h-52 items-end gap-2 sm:gap-3">
        {items.map((item) => {
          const spentHeight = `${(item.total / maxValue) * 100}%`;
          const budgetHeight = item.budgetLimit
            ? `${(item.budgetLimit / maxValue) * 100}%`
            : undefined;
          const label = getCategoryLabel(t, item.category as EntryCategory);

          return (
            <div
              key={item.category}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
            >
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-[12rem] rounded-lg border border-subtle bg-surface px-3 py-2 text-left shadow-lg group-hover:block group-focus-within:block"
              >
                <p className="text-xs font-medium text-primary">{label}</p>
                <p className="mt-1 font-mono text-xs tabular-nums text-secondary">
                  {t.overview.chartSpent}:{" "}
                  {formatCurrency(item.total, "BRL", intlLocale)}
                </p>
                {item.budgetLimit != null && (
                  <p className="font-mono text-xs tabular-nums text-secondary">
                    {t.overview.chartBudget}:{" "}
                    {formatCurrency(item.budgetLimit, "BRL", intlLocale)}
                  </p>
                )}
                <p className="mt-1 text-xs text-tertiary">
                  {item.budgetLimit != null && item.percentOfBudget != null
                    ? t.overview.chartOfBudget.replace(
                        "{percent}",
                        item.percentOfBudget.toFixed(0),
                      )
                    : t.overview.chartOfTotal.replace(
                        "{percent}",
                        item.percentage.toFixed(0),
                      )}
                </p>
                {item.isOverBudget && (
                  <p className="mt-1 text-xs text-danger">
                    {t.overview.chartOverBudget}
                  </p>
                )}
              </div>

              <div className="relative flex h-40 w-full items-end justify-center">
                {budgetHeight && (
                  <div
                    className="absolute bottom-0 w-[70%] rounded-t-md border border-dashed border-accent/35 bg-accent/10"
                    style={{ height: budgetHeight }}
                    aria-hidden
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 w-[70%] rounded-t-md transition-all",
                    item.isOverBudget ? "bg-danger/80" : "bg-accent",
                  )}
                  style={{ height: spentHeight, minHeight: item.total > 0 ? "4px" : "0" }}
                />
              </div>

              <p className="mt-2 w-full truncate text-center text-[10px] leading-tight text-tertiary sm:text-xs">
                {label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-tertiary">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-accent" />
          {t.overview.chartLegendSpent}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm border border-dashed border-accent/35 bg-accent/10" />
          {t.overview.chartLegendBudget}
        </span>
      </div>
    </Card>
  );
}
