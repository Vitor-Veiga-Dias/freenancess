export const CONTEXT_TYPES = ["PERSONAL", "BUSINESS"] as const;

export type ContextType = (typeof CONTEXT_TYPES)[number];

export interface FinancialContextEntity {
  id: string;
  userId: string;
  type: ContextType;
  label: string;
  cnpj?: string | null;
}

export function isValidContextType(value: string): value is ContextType {
  return CONTEXT_TYPES.includes(value as ContextType);
}

export function getContextLabel(type: ContextType): string {
  return type === "PERSONAL" ? "Personal" : "Business";
}
