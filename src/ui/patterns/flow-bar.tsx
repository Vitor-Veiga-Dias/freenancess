import type { MoneyFlow } from "@/domain/flows/types";
import { flowUtilization } from "@/domain/flows/types";
import { cn, formatCurrency } from "@/ui/tokens/cn";

interface FlowBarProps {
  flows: MoneyFlow[];
  contextAccent?: "personal" | "business";
  intlLocale?: string;
}

const accentMap = {
  personal: "bg-accent",
  business: "bg-accent-secondary",
};

export function FlowBar({
  flows,
  contextAccent = "personal",
  intlLocale = "pt-BR",
}: FlowBarProps) {
  const totalAllocated = flows.reduce((sum, flow) => sum + flow.allocated, 0);

  return (
    <div className="space-y-4">
      <div className="flex h-2 overflow-hidden rounded-full bg-elevated">
        {flows.map((flow) => {
          const width =
            totalAllocated > 0
              ? (flow.allocated / totalAllocated) * 100
              : 100 / flows.length;

          return (
            <div
              key={flow.type}
              className={cn("h-full transition-all duration-200", accentMap[contextAccent])}
              style={{ width: `${width}%`, opacity: 0.4 + flowUtilization(flow) * 0.6 }}
              title={`${flow.label}: ${formatCurrency(flow.allocated, "BRL", intlLocale)}`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {flows.map((flow) => (
          <div key={flow.type} className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-secondary">
              {flow.label}
            </p>
            <p className="font-mono text-sm tabular-nums text-primary">
              {formatCurrency(flow.allocated, "BRL", intlLocale)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
