import type { MonthlyTrendPoint } from "@/domain/categories/types";
import type { Dictionary } from "@/i18n/types";
import { Card } from "@/ui/primitives/card";
import { formatCurrency } from "@/ui/tokens/cn";

interface MonthlyTrendProps {
  points: MonthlyTrendPoint[];
  t: Dictionary;
  intlLocale: string;
}

export function MonthlyTrend({ points, t, intlLocale }: MonthlyTrendProps) {
  const maxValue = Math.max(
    ...points.map((point) => Math.max(point.totalExpenses, point.totalIncome)),
    1,
  );

  return (
    <Card className="space-y-4 p-5">
      <h2 className="text-xs font-medium uppercase tracking-widest text-secondary">
        {t.overview.monthlyTrend}
      </h2>
      <div className="space-y-3">
        {points.map((point) => {
          const expenseWidth = (point.totalExpenses / maxValue) * 100;
          const incomeWidth = (point.totalIncome / maxValue) * 100;

          return (
            <div key={point.month} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-secondary">
                <span>{point.month}</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(point.balance, "BRL", intlLocale)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${expenseWidth}%` }}
                  />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-accent/70"
                    style={{ width: `${incomeWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
