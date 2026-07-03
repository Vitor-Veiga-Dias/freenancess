export const PAYMENT_MODES = ["CASH", "CREDIT"] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export interface ManualEntryFields {
  paymentMode: PaymentMode;
  installmentNumber: number | null;
  installmentTotal: number | null;
  isRecurring: boolean;
  counterparty: string | null;
  fundedByIncomeCategory: string | null;
}
