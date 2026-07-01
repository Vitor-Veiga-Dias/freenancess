import { Suspense } from "react";

import Link from "next/link";

import { getMonthlySummary } from "@/application/use-cases/manual-entries";
import { formatMonthKey } from "@/domain/categories/types";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { requireSession } from "@/infrastructure/auth/session";
import { CategoryBreakdown } from "@/ui/patterns/category-breakdown";
import { MonthPicker } from "@/ui/patterns/month-picker";
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

  const summary = await getMonthlySummary(
    session.user.id,
    contextType,
    month,
  );

  const hasEntries =
    summary.totalExpenses > 0 || summary.totalIncome > 0;

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

      <div className="grid gap-3 sm:grid-cols-3">
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
            {formatCurrency(summary.balance, "BRL", intlLocale)}
          </p>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-secondary">
          {t.overview.expensesByCategory}
        </h2>
        <CategoryBreakdown
          items={summary.expensesByCategory}
          t={t}
          intlLocale={intlLocale}
          emptyMessage={t.overview.emptyExpenses}
        />
      </section>

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
