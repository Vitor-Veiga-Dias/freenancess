import {
  INVESTMENT_INCOME_CATEGORY,
  isFundingIncomeCategory,
  isValidCategory,
} from "@/domain/categories/types";
import type { TransactionType } from "@/domain/ledger/types";

import type { PaymentMode } from "./types";

export interface ManualEntryValidationInput {
  type: TransactionType;
  category: string;
  amount: number;
  paymentMode: PaymentMode;
  installmentNumber: number | null;
  installmentTotal: number | null;
  counterparty: string | null;
  fundedByIncomeCategory?: string | null;
}

export function validateInstallments(
  paymentMode: PaymentMode,
  installmentNumber: number | null,
  installmentTotal: number | null,
): void {
  if (paymentMode === "CASH") {
    if (installmentNumber !== null || installmentTotal !== null) {
      throw new Error("Cash payments cannot have installments");
    }
    return;
  }

  if (installmentTotal === null || installmentNumber === null) {
    throw new Error("Credit payments require installment number and total");
  }

  if (installmentTotal < 2) {
    throw new Error("Credit installment total must be at least 2");
  }

  if (installmentNumber < 1) {
    throw new Error("Installment number must be at least 1");
  }

  if (installmentNumber > installmentTotal) {
    throw new Error("Installment number cannot exceed total");
  }
}

export function validateManualEntryInput(input: ManualEntryValidationInput): void {
  if (input.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (!isValidCategory(input.type, input.category)) {
    throw new Error("Invalid category for entry type");
  }

  if (input.counterparty !== null && input.counterparty.trim().length === 0) {
    throw new Error("Counterparty cannot be empty");
  }

  validateInstallments(
    input.paymentMode,
    input.installmentNumber,
    input.installmentTotal,
  );

  validateFundedByIncomeCategory(
    input.type,
    input.category,
    input.fundedByIncomeCategory ?? null,
  );
}

export function validateFundedByIncomeCategory(
  type: TransactionType,
  category: string,
  fundedByIncomeCategory: string | null,
): void {
  if (fundedByIncomeCategory === null) {
    return;
  }

  if (type !== "CREDIT" || category !== INVESTMENT_INCOME_CATEGORY) {
    throw new Error("Source income is only allowed for investment entries");
  }

  if (!isFundingIncomeCategory(fundedByIncomeCategory)) {
    throw new Error("Invalid source income category");
  }
}
