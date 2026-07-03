import { Suspense } from "react";

import { listManualEntries } from "@/application/use-cases/manual-entries";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { requireSession } from "@/infrastructure/auth/session";
import { PageHeader } from "@/ui/patterns/page-header";
import { Card } from "@/ui/primitives/card";

import { EntriesSection } from "./entries-section";
import { EntryFilters } from "./entry-filters";
import { parseEntriesSearchParams } from "./utils";

export const dynamic = "force-dynamic";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    category?: string;
    isRecurring?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    limit?: string;
  }>;
}) {
  const session = await requireSession();
  const locale = await getLocale();
  const contextType = await getContextPreference();
  const t = getDictionary(locale);
  const intlLocale = localeToIntl(locale);
  const params = await searchParams;
  const filters = parseEntriesSearchParams(params);

  const { entries, total, page, limit } = await listManualEntries(
    session.user.id,
    contextType,
    filters,
  );

  return (
    <div className="space-y-8">
      <PageHeader title={t.entries.title} description={t.entries.subtitle} />

      <Suspense fallback={null}>
        <EntryFilters />
      </Suspense>

      {total > 0 && (
        <p className="text-xs text-tertiary">
          {t.entries.filters.resultsCount
            .replace("{count}", String(total))
            .replace("{page}", String(page))}
        </p>
      )}

      <EntriesSection
        contextType={contextType}
        entries={entries}
        intlLocale={intlLocale}
      />

      {total > limit && (
        <Card className="p-4 text-sm text-secondary">
          {t.entries.filters.showingPage
            .replace("{shown}", String(entries.length))
            .replace("{total}", String(total))}
        </Card>
      )}
    </div>
  );
}
