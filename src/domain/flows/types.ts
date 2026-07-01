export const MONEY_FLOW_TYPES = [
  "OBLIGATIONS",
  "RESERVES",
  "DISCRETIONARY",
  "INVESTMENT",
] as const;

export type MoneyFlowType = (typeof MONEY_FLOW_TYPES)[number];

export interface MoneyFlow {
  type: MoneyFlowType;
  label: string;
  allocated: number;
  limit: number;
}

export const FLOW_LABELS: Record<MoneyFlowType, string> = {
  OBLIGATIONS: "Obligations",
  RESERVES: "Reserves",
  DISCRETIONARY: "Discretionary",
  INVESTMENT: "Investment",
};

export const DEFAULT_FLOW_LIMITS: Record<MoneyFlowType, number> = {
  OBLIGATIONS: 0.4,
  RESERVES: 0.2,
  DISCRETIONARY: 0.25,
  INVESTMENT: 0.15,
};

export function buildMoneyFlows(
  allocations: Partial<Record<MoneyFlowType, number>>,
  totalBudget: number,
): MoneyFlow[] {
  return MONEY_FLOW_TYPES.map((type) => {
    const allocated = allocations[type] ?? 0;
    return {
      type,
      label: FLOW_LABELS[type],
      allocated,
      limit: totalBudget * DEFAULT_FLOW_LIMITS[type],
    };
  });
}

export function flowUtilization(flow: MoneyFlow): number {
  if (flow.limit <= 0) return 0;
  return Math.min(flow.allocated / flow.limit, 1);
}
