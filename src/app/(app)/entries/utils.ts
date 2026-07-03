import type { ListManualEntriesFilters } from "@/application/use-cases/manual-entries";
import type { TransactionType } from "@/domain/ledger/types";

export function parseEntriesSearchParams(searchParams: {
  type?: string;
  category?: string;
  isRecurring?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
}): ListManualEntriesFilters {
  const typeParam = searchParams.type;
  const isRecurringParam = searchParams.isRecurring;

  return {
    type:
      typeParam === "CREDIT" || typeParam === "DEBIT"
        ? (typeParam as TransactionType)
        : undefined,
    category: searchParams.category,
    isRecurring:
      isRecurringParam === "true"
        ? true
        : isRecurringParam === "false"
          ? false
          : undefined,
    dateFrom: searchParams.dateFrom
      ? new Date(`${searchParams.dateFrom}T00:00:00`)
      : undefined,
    dateTo: searchParams.dateTo
      ? new Date(`${searchParams.dateTo}T23:59:59`)
      : undefined,
    page: searchParams.page ? Number(searchParams.page) : undefined,
    limit: searchParams.limit ? Number(searchParams.limit) : undefined,
  };
}
