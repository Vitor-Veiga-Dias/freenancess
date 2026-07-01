import { listManualEntries } from "@/application/use-cases/manual-entries";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { requireSession } from "@/infrastructure/auth/session";
import { PageHeader } from "@/ui/patterns/page-header";

import { EntriesSection } from "./entries-section";

export const dynamic = "force-dynamic";

export default async function EntriesPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const contextType = await getContextPreference();
  const t = getDictionary(locale);
  const intlLocale = localeToIntl(locale);

  const entries = await listManualEntries(session.user.id, contextType);

  return (
    <div className="space-y-8">
      <PageHeader title={t.entries.title} description={t.entries.subtitle} />

      <EntriesSection
        contextType={contextType}
        entries={entries}
        intlLocale={intlLocale}
      />
    </div>
  );
}
