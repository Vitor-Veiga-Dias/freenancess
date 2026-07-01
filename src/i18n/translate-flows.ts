import type { MoneyFlow } from "@/domain/flows/types";
import type { Dictionary } from "@/i18n/types";

export function translateMoneyFlows(
  flows: MoneyFlow[],
  t: Dictionary,
): MoneyFlow[] {
  return flows.map((flow) => ({
    ...flow,
    label: t.flowLabels[flow.type],
  }));
}
