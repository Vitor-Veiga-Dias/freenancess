"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ContextType } from "@/domain/context/types";
import {
  getCategoriesForType,
  type EntryCategory,
} from "@/domain/categories/types";
import type { TransactionEntity } from "@/domain/ledger/types";
import { useI18n } from "@/i18n/context";
import { getCategoryLabel } from "@/i18n/category-labels";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { formatCurrency } from "@/ui/tokens/cn";

interface UnclassifiedTransactionsProps {
  transactions: TransactionEntity[];
  contextType: ContextType;
  intlLocale: string;
}

export function UnclassifiedTransactions({
  transactions,
  contextType,
  intlLocale,
}: UnclassifiedTransactionsProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [category, setCategory] = useState<EntryCategory>("other_expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (transactions.length === 0) {
    return null;
  }

  async function handleClassify(transactionId: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextType, category }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? t.transactions.classifyFailed);
      }

      setActiveId(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.transactions.classifyFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-widest text-secondary">
        {t.transactions.unclassified}
      </p>
      <div className="space-y-3">
        {transactions.map((tx) => {
          const isActive = activeId === tx.id;
          const categories = getCategoriesForType(tx.type);

          return (
            <Card key={tx.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-primary">
                    {tx.description}
                  </p>
                  <p className="text-xs text-tertiary">
                    {new Date(tx.postedAt).toLocaleDateString(intlLocale)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm tabular-nums text-primary">
                    {formatCurrency(tx.amount, "BRL", intlLocale)}
                  </p>
                  <Badge variant="warning">{t.transactions.classify}</Badge>
                </div>
              </div>

              {isActive ? (
                <div className="flex flex-wrap items-end gap-2">
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as EntryCategory)
                    }
                    className="h-9 min-w-[10rem] rounded-lg border border-transparent bg-elevated px-3 text-sm text-primary outline-none focus:border-accent/50"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(t, cat)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={() => handleClassify(tx.id)}
                  >
                    {loading
                      ? t.common.loading
                      : t.transactions.saveClassification}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveId(null)}
                  >
                    {t.common.cancel}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setActiveId(tx.id);
                    setCategory(
                      tx.type === "DEBIT" ? "other_expense" : "other_income",
                    );
                  }}
                >
                  {t.transactions.classify}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </section>
  );
}
