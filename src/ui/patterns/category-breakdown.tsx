import type { CategoryAggregate } from "@/domain/categories/types";
import type { EntryCategory } from "@/domain/categories/types";
import { getCategoryLabel } from "@/i18n/category-labels";
import type { Dictionary } from "@/i18n/types";
import { Card } from "@/ui/primitives/card";
import { formatCurrency } from "@/ui/tokens/cn";

interface CategoryBreakdownProps {
  items: CategoryAggregate[];
  t: Dictionary;
  intlLocale: string;
  emptyMessage: string;
}

export function CategoryBreakdown({
  items,
  t,
  intlLocale,
  emptyMessage,
}: CategoryBreakdownProps) {
  if (items.length === 0) {
    return (
      <Card className="p-5 text-sm text-secondary">{emptyMessage}</Card>
    );
  }

  const maxTotal = Math.max(...items.map((item) => item.total));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.category} className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-primary">
              {getCategoryLabel(t, item.category as EntryCategory)}
            </p>
            <p className="font-mono text-sm tabular-nums text-primary">
              {formatCurrency(item.total, "BRL", intlLocale)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{
                  width: `${maxTotal > 0 ? (item.total / maxTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs tabular-nums text-tertiary">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
