import { Suspense } from "react";

import { listBudgetsWithProgress } from "@/application/use-cases/category-budgets";
import { formatMonthKey } from "@/domain/categories/types";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { requireSession } from "@/infrastructure/auth/session";
import { MonthPicker } from "@/ui/patterns/month-picker";
import { PageHeader } from "@/ui/patterns/page-header";

import { BudgetForm, BudgetList } from "./budget-section";

export const dynamic = "force-dynamic";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requireSession();
  const locale = await getLocale();
  const contextType = await getContextPreference();
  const t = getDictionary(locale);
  const intlLocale = localeToIntl(locale);
  const params = await searchParams;
  const month = params.month ?? formatMonthKey(new Date());

  const budgets = await listBudgetsWithProgress(
    session.user.id,
    contextType,
    month,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t.budgets.title} description={t.budgets.subtitle} />
        <Suspense fallback={null}>
          <MonthPicker month={month} />
        </Suspense>
      </div>

      <BudgetForm contextType={contextType} month={month} />
      <div className="pb-24 md:pb-0">
        <BudgetList
          budgets={budgets}
          contextType={contextType}
          intlLocale={intlLocale}
        />
      </div>
    </div>
  );
}
