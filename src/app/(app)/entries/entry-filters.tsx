"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type EntryCategory,
} from "@/domain/categories/types";
import { useI18n } from "@/i18n/context";
import { getCategoryLabel } from "@/i18n/category-labels";
import { Drawer } from "@/ui/patterns/drawer";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";

const selectClassName =
  "h-10 w-full rounded-full border border-transparent bg-elevated px-4 text-sm text-primary outline-none focus:border-accent/50";

function EntryFiltersFields({
  layout,
}: {
  layout: "mobile" | "desktop";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/entries?${params.toString()}`);
    },
    [router, searchParams],
  );

  const type = searchParams.get("type") ?? "";
  const category = searchParams.get("category") ?? "";
  const isRecurring = searchParams.get("isRecurring") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const categoryOptions: EntryCategory[] =
    type === "CREDIT"
      ? [...INCOME_CATEGORIES]
      : type === "DEBIT"
        ? [...EXPENSE_CATEGORIES]
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const gridClassName =
    layout === "desktop"
      ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      : "flex flex-col gap-4";

  return (
    <div className={gridClassName}>
      <div className="space-y-1.5">
        <label className="text-xs text-secondary">{t.entries.filters.type}</label>
        <select
          value={type}
          onChange={(e) => updateParam("type", e.target.value)}
          className={selectClassName}
        >
          <option value="">{t.entries.filters.allTypes}</option>
          <option value="DEBIT">{t.common.expense}</option>
          <option value="CREDIT">{t.common.income}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-secondary">
          {t.entries.filters.category}
        </label>
        <select
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
          className={selectClassName}
        >
          <option value="">{t.entries.filters.allCategories}</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {getCategoryLabel(t, cat)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-secondary">
          {t.entries.filters.recurring}
        </label>
        <select
          value={isRecurring}
          onChange={(e) => updateParam("isRecurring", e.target.value)}
          className={selectClassName}
        >
          <option value="">{t.entries.filters.allRecurring}</option>
          <option value="true">{t.entries.filters.recurringOnly}</option>
          <option value="false">{t.entries.filters.nonRecurringOnly}</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-secondary">
          {t.entries.filters.dateFrom}
        </label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => updateParam("dateFrom", e.target.value)}
          className="rounded-full"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-secondary">
          {t.entries.filters.dateTo}
        </label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => updateParam("dateTo", e.target.value)}
          className="rounded-full"
        />
      </div>
    </div>
  );
}

export function EntryFilters() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    const keys = ["type", "category", "isRecurring", "dateFrom", "dateTo"];
    return keys.filter((key) => Boolean(searchParams.get(key))).length;
  }, [searchParams]);

  return (
    <>
      <div className="md:hidden">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setFiltersOpen(true)}
          className="h-10 w-full gap-2 rounded-full"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          {t.common.filters}
          {activeFilterCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-medium text-accent-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Drawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title={t.common.filters}
          side="bottom"
          closeLabel={t.common.close}
        >
          <EntryFiltersFields layout="mobile" />
        </Drawer>
      </div>

      <div className="hidden md:block">
        <EntryFiltersFields layout="desktop" />
      </div>
    </>
  );
}
