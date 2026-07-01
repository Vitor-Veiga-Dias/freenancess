import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { PageHeader } from "@/ui/patterns/page-header";
import { Card } from "@/ui/primitives/card";

export default async function SandboxPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="space-y-8">
      <PageHeader title={t.sandbox.title} description={t.sandbox.subtitle} />

      <Card className="space-y-3 p-5">
        <p className="text-sm text-primary">{t.sandbox.exampleQuestion}</p>
        <p className="text-sm text-secondary">{t.sandbox.exampleAnswer}</p>
      </Card>
    </div>
  );
}
