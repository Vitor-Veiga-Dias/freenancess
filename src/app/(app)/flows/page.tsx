import { buildMoneyFlows, MONEY_FLOW_TYPES } from "@/domain/flows/types";
import { signedAmount } from "@/domain/ledger/types";
import { requireSession } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/db/prisma";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { translateMoneyFlows } from "@/i18n/translate-flows";
import { FlowBar } from "@/ui/patterns/flow-bar";
import { PageHeader } from "@/ui/patterns/page-header";
import { Card } from "@/ui/primitives/card";
import { formatCurrency } from "@/ui/tokens/cn";

export default async function FlowsPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const contextType = await getContextPreference();
  const t = getDictionary(locale);
  const intlLocale = localeToIntl(locale);

  const transactions = await prisma.transaction.findMany({
    where: {
      context: { userId: session.user.id, type: contextType },
    },
    orderBy: { postedAt: "desc" },
    take: 200,
  });

  const totalOutflow = transactions
    .filter((tx) => tx.type === "DEBIT")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const flowAllocations = MONEY_FLOW_TYPES.reduce(
    (acc, flowType, index) => {
      const slice = transactions.filter(
        (_, i) => i % MONEY_FLOW_TYPES.length === index,
      );
      const total = slice.reduce(
        (sum, tx) => sum + Math.abs(signedAmount(tx.type, Number(tx.amount))),
        0,
      );
      acc[flowType] = total;
      return acc;
    },
    {} as Partial<Record<(typeof MONEY_FLOW_TYPES)[number], number>>,
  );

  const flows = translateMoneyFlows(
    buildMoneyFlows(flowAllocations, Math.max(totalOutflow, 1)),
    t,
  );

  return (
    <div className="space-y-8">
      <PageHeader title={t.flows.title} description={t.flows.subtitle} />

      <FlowBar
        flows={flows}
        contextAccent={contextType === "PERSONAL" ? "personal" : "business"}
        intlLocale={intlLocale}
      />

      <div className="grid gap-3">
        {flows.map((flow) => (
          <Card key={flow.type} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-primary">{flow.label}</p>
              <p className="text-xs text-tertiary">
                {t.common.limit}{" "}
                {formatCurrency(flow.limit, "BRL", intlLocale)}
              </p>
            </div>
            <p className="font-mono text-sm tabular-nums text-primary">
              {formatCurrency(flow.allocated, "BRL", intlLocale)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
