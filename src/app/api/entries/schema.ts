import { z } from "zod";

import { normalizePostedAt } from "@/domain/categories/dates";

export const entryFieldsSchema = z.object({
  contextType: z.enum(["PERSONAL", "BUSINESS"]),
  type: z.enum(["CREDIT", "DEBIT"]),
  category: z.string(),
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
  postedAt: z.string().optional(),
  paymentMode: z.enum(["CASH", "CREDIT"]).default("CASH"),
  installmentNumber: z.number().int().positive().nullable().optional(),
  installmentTotal: z.number().int().positive().nullable().optional(),
  isRecurring: z.boolean().default(false),
  counterparty: z.string().max(100).nullable().optional(),
  fundedByIncomeCategory: z.string().nullable().optional(),
});

export function parseEntryFields(data: z.infer<typeof entryFieldsSchema>) {
  const paymentMode = data.paymentMode;
  const installmentNumber =
    paymentMode === "CREDIT" ? (data.installmentNumber ?? null) : null;
  const installmentTotal =
    paymentMode === "CREDIT" ? (data.installmentTotal ?? null) : null;

  return {
    contextType: data.contextType,
    type: data.type,
    category: data.category,
    amount: data.amount,
    description: data.description,
    postedAt: data.postedAt
      ? normalizePostedAt(data.postedAt)
      : normalizePostedAt(new Date()),
    paymentMode,
    installmentNumber,
    installmentTotal,
    isRecurring: data.isRecurring,
    counterparty: data.counterparty ?? null,
    fundedByIncomeCategory: data.fundedByIncomeCategory ?? null,
  };
}
