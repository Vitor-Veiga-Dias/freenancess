import { Suspense } from "react";

import Link from "next/link";

import { listBudgetsWithProgress } from "@/application/use-cases/category-budgets";
import { buildCategoryChartItems } from "@/domain/budgets/chart-items";
import {
  getMonthlyTrend,
  getUnifiedMonthlySummary,
} from "@/application/use-cases/financial-summary";
import {
  findLargestExpense,
  findTopExpenseCategory,
  formatMonthKey,
  getInvestmentIncome,
  getOperatingBalance,
} from "@/domain/categories/types";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCategoryLabel } from "@/i18n/category-labels";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { requireSession } from "@/infrastructure/auth/session";
import { CategoryExpenseChart } from "@/ui/patterns/category-expense-chart";
import { CategoryBreakdown } from "@/ui/patterns/category-breakdown";
import { MonthPicker } from "@/ui/patterns/month-picker";
import { MonthlyTrend } from "@/ui/patterns/monthly-trend";
import { PageHeader } from "@/ui/patterns/page-header";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { formatCurrency } from "@/ui/tokens/cn";

export const dynamic = "force-dynamic";

async function OverviewContent({
  month,
}: {
  month: string;
}) {
  const session = await requireSession();
  const locale = await getLocale();
  const contextType = await getContextPreference();
  const t = getDictionary(locale);
  const intlLocale = localeToIntl(locale);

  const [{ summary, entries }, trend, budgets] = await Promise.all([
    getUnifiedMonthlySummary(session.user.id, contextType, month),
    getMonthlyTrend(session.user.id, contextType, month),
    listBudgetsWithProgress(session.user.id, contextType, month),
  ]);

  const investmentIncome = getInvestmentIncome(summary);
  const operatingBalance = getOperatingBalance(summary);
  const expenseChartItems = buildCategoryChartItems(
    summary.expensesByCategory,
    budgets,
  );

  const hasEntries =
    summary.totalExpenses > 0 || summary.totalIncome > 0;

  const topCategory = findTopExpenseCategory(summary);
  const largestExpense = findLargestExpense(entries);

  return (
    <>
      {!hasEntries && (
        <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">{t.overview.emptyAll}</p>
          <Link href="/entries">
            <Button>{t.overview.addEntry}</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-widest text-secondary">
            {t.overview.totalExpenses}
          </p>
          <p className="font-mono text-2xl tabular-nums text-primary">
            {formatCurrency(summary.totalExpenses, "BRL", intlLocale)}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-widest text-secondary">
            {t.overview.totalIncome}
          </p>
          <p className="font-mono text-2xl tabular-nums text-accent">
            {formatCurrency(summary.totalIncome, "BRL", intlLocale)}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-widest text-secondary">
            {t.overview.balance}
          </p>
          <p className="font-mono text-2xl tabular-nums text-primary">
            {formatCurrency(operatingBalance, "BRL", intlLocale)}
          </p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-widest text-secondary">
            {t.overview.investments}
          </p>
          <p className="font-mono text-2xl tabular-nums text-accent-secondary">
            {formatCurrency(investmentIncome, "BRL", intlLocale)}
          </p>
        </Card>
        <Card className="space-y-1 p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-xs uppercase tracking-widest text-secondary">
            {t.overview.transactionCount}
          </p>
          <p className="font-mono text-2xl tabular-nums text-primary">
            {summary.transactionCount}
          </p>
        </Card>
      </div>

      {(topCategory || largestExpense) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {topCategory && (
            <Card className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-widest text-secondary">
                {t.overview.topExpenseCategory}
              </p>
              <p className="text-sm font-medium text-primary">
                {getCategoryLabel(t, topCategory.category)}
              </p>
              <p className="font-mono text-sm tabular-nums text-secondary">
                {formatCurrency(topCategory.total, "BRL", intlLocale)}
              </p>
            </Card>
          )}
          {largestExpense && (
            <Card className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-widest text-secondary">
                {t.overview.topExpense}
              </p>
              <p className="text-sm font-medium text-primary">
                {largestExpense.description}
              </p>
              <p className="font-mono text-sm tabular-nums text-secondary">
                {formatCurrency(largestExpense.amount, "BRL", intlLocale)}
                {" · "}
                {largestExpense.source === "bank"
                  ? t.overview.fromBank
                  : t.overview.fromManual}
              </p>
            </Card>
          )}
        </div>
      )}

      <CategoryExpenseChart
        items={expenseChartItems}
        t={t}
        intlLocale={intlLocale}
        title={t.overview.expensesByCategory}
        emptyMessage={t.overview.emptyExpenses}
      />

      <MonthlyTrend points={trend} t={t} intlLocale={intlLocale} />

      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-secondary">
          {t.overview.incomeByCategory}
        </h2>
        <CategoryBreakdown
          items={summary.incomeByCategory}
          t={t}
          intlLocale={intlLocale}
          emptyMessage={t.overview.emptyIncome}
        />
      </section>
    </>
  );
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const params = await searchParams;
  const month = params.month ?? formatMonthKey(new Date());

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t.overview.title} description={t.overview.subtitle} />
        <Suspense fallback={null}>
          <MonthPicker month={month} />
        </Suspense>
      </div>

      <OverviewContent month={month} />
    </div>
  );
}
