import type { ContextType } from "@/domain/context/types";
import { buildMoneyFlows, MONEY_FLOW_TYPES } from "@/domain/flows/types";
import { toNarrativeFeedItem } from "@/domain/insights/types";
import { signedAmount } from "@/domain/ledger/types";
import { listUnclassifiedTransactions } from "@/application/use-cases/classify-transaction";
import { requireSession } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/db/prisma";
import { localeToIntl } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getContextPreference, getLocale } from "@/i18n/locale";
import { translateMoneyFlows } from "@/i18n/translate-flows";
import { FlowBar } from "@/ui/patterns/flow-bar";
import { NarrativeCard } from "@/ui/patterns/narrative-card";
import { formatCurrency } from "@/ui/tokens/cn";

import { UnclassifiedTransactions } from "./unclassified-transactions";

async function getFeedData(userId: string, contextType: ContextType) {
  const [events, accounts, transactions] = await Promise.all([
    prisma.domainEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.bankAccount.findMany({
      where: { context: { userId, type: contextType } },
    }),
    prisma.transaction.findMany({
      where: { context: { userId, type: contextType } },
      orderBy: { postedAt: "desc" },
      take: 100,
    }),
  ]);

  const balance = accounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0,
  );

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

  return {
    balance,
    flows: buildMoneyFlows(flowAllocations, Math.max(balance, 1)),
    events,
  };
}

export default async function FeedPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const contextType = await getContextPreference();
  const t = getDictionary(locale);
  const intlLocale = localeToIntl(locale);

  const [{ balance, flows, events }, unclassified] = await Promise.all([
    getFeedData(session.user.id, contextType),
    listUnclassifiedTransactions(session.user.id, contextType),
  ]);

  const translatedFlows = translateMoneyFlows(flows, t);
  const contextLabel =
    contextType === "PERSONAL" ? t.common.personal : t.common.business;

  const isEmptyFeed = events.length === 0;

  const feedItems = isEmptyFeed
      ? [
          toNarrativeFeedItem({
            id: "placeholder-1",
            userId: session.user.id,
            type: "TRANSACTION_SYNCED",
            title: t.feed.placeholderTitle,
            narrative: t.feed.placeholderNarrative,
            createdAt: new Date(),
          }),
        ]
      : events.map((event) =>
          toNarrativeFeedItem({
            id: event.id,
            userId: event.userId,
            type: event.type,
            title: event.title,
            narrative: event.narrative,
            metadata: event.metadata as Record<string, unknown> | null,
            createdAt: event.createdAt,
          }),
        );

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="font-mono text-4xl font-medium tabular-nums tracking-tight text-primary">
          {formatCurrency(balance, "BRL", intlLocale)}
        </p>
        <p className="text-sm text-secondary">
          {t.common.available} · {contextLabel.toLowerCase()}
        </p>
      </section>

      <section className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-secondary">
          {t.feed.moneyFlow}
        </p>
        <FlowBar
          flows={translatedFlows}
          contextAccent={contextType === "PERSONAL" ? "personal" : "business"}
          intlLocale={intlLocale}
        />
      </section>

      <UnclassifiedTransactions
        transactions={unclassified}
        contextType={contextType}
        intlLocale={intlLocale}
      />

      <section className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-secondary">
          {t.feed.narrativeFeed}
        </p>
        <div className="space-y-3">
          {feedItems.map((item) => (
            <NarrativeCard
              key={item.id}
              item={item}
              action={
                isEmptyFeed
                  ? {
                      href: "/connections",
                      label: t.feed.placeholderAction,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
