import type { EntryCategory } from "@/domain/categories/types";
import type { TransactionType } from "@/domain/ledger/types";

const KEYWORD_MAP: Array<{ keywords: string[]; category: EntryCategory }> = [
  { keywords: ["housing", "moradia", "aluguel", "rent", "condominio"], category: "housing" },
  { keywords: ["food", "aliment", "mercado", "supermercado", "restaurant"], category: "food" },
  { keywords: ["transport", "transporte", "uber", "gasolina", "combustivel"], category: "transport" },
  { keywords: ["health", "saude", "farmacia", "medico", "hospital"], category: "health" },
  { keywords: ["leisure", "lazer", "entretenimento", "cinema"], category: "leisure" },
  { keywords: ["subscription", "assinatura", "utilidade", "internet", "telefone"], category: "subscriptions" },
  { keywords: ["shopping", "compra", "presente", "futilidade"], category: "shopping" },
  { keywords: ["salary", "salario", "recebimento", "pagamento"], category: "salary" },
  { keywords: ["freelance", "autonomo"], category: "freelance" },
  { keywords: ["investment", "investimento", "dividendo"], category: "investment_income" },
];

function fallbackCategory(type: TransactionType): EntryCategory {
  return type === "DEBIT" ? "other_expense" : "other_income";
}

export function normalizeBankCategory(
  rawCategory: string | null | undefined,
  type: TransactionType,
): EntryCategory {
  if (!rawCategory) {
    return fallbackCategory(type);
  }

  const normalized = rawCategory.toLowerCase();

  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      if (type === "DEBIT" && entry.category.endsWith("_income")) continue;
      if (type === "CREDIT" && !entry.category.endsWith("_income") && entry.category !== "salary" && entry.category !== "freelance" && entry.category !== "investment_income") {
        continue;
      }
      return entry.category;
    }
  }

  return fallbackCategory(type);
}

export function isMappedBankCategory(
  rawCategory: string | null | undefined,
): boolean {
  if (!rawCategory) return false;
  const normalized = rawCategory.toLowerCase();
  return KEYWORD_MAP.some((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
}
