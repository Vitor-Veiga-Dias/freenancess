"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ContextType } from "@/domain/context/types";
import {
  FUNDING_INCOME_CATEGORIES,
  getCategoriesForType,
  INVESTMENT_INCOME_CATEGORY,
  type EntryCategory,
} from "@/domain/categories/types";
import type { PaymentMode } from "@/domain/entries/types";
import type { TransactionType } from "@/domain/ledger/types";
import {
  formatMoneyInput,
  parseMoneyInput,
} from "@/domain/ledger/money-input";
import { useI18n } from "@/i18n/context";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";

export interface EntryFormEntry {
  id: string;
  type: TransactionType;
  category: EntryCategory;
  amount: number;
  description: string;
  postedAt: string | Date;
  paymentMode: PaymentMode;
  installmentNumber: number | null;
  installmentTotal: number | null;
  isRecurring: boolean;
  counterparty: string | null;
  fundedByIncomeCategory: EntryCategory | null;
}

interface EntryFormProps {
  contextType: ContextType;
  editingEntry?: EntryFormEntry | null;
  onCancelEdit?: () => void;
  onSuccess?: () => void;
}

function toDateInputValue(value: string | Date): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function EntryForm({
  contextType,
  editingEntry,
  onCancelEdit,
  onSuccess,
}: EntryFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const isEditing = Boolean(editingEntry);

  const [type, setType] = useState<TransactionType>("DEBIT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EntryCategory>("food");
  const [postedAt, setPostedAt] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [installmentNumber, setInstallmentNumber] = useState("");
  const [installmentTotal, setInstallmentTotal] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [counterparty, setCounterparty] = useState("");
  const [fundedByIncomeCategory, setFundedByIncomeCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => getCategoriesForType(type), [type]);

  useEffect(() => {
    if (!editingEntry) {
      setType("DEBIT");
      setAmount("");
      setDescription("");
      setCategory("food");
      setPostedAt(new Date().toISOString().split("T")[0]);
      setPaymentMode("CASH");
      setInstallmentNumber("");
      setInstallmentTotal("");
      setIsRecurring(false);
      setCounterparty("");
      setFundedByIncomeCategory("");
      setError(null);
      return;
    }

    setType(editingEntry.type);
    setAmount(formatMoneyInput(editingEntry.amount));
    setDescription(editingEntry.description);
    setCategory(editingEntry.category);
    setPostedAt(toDateInputValue(editingEntry.postedAt));
    setPaymentMode(editingEntry.paymentMode);
    setInstallmentNumber(
      editingEntry.installmentNumber?.toString() ?? "",
    );
    setInstallmentTotal(editingEntry.installmentTotal?.toString() ?? "");
    setIsRecurring(editingEntry.isRecurring);
    setCounterparty(editingEntry.counterparty ?? "");
    setFundedByIncomeCategory(editingEntry.fundedByIncomeCategory ?? "");
    setError(null);
  }, [editingEntry]);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    const nextCategories = getCategoriesForType(next);
    setCategory(nextCategories[0]);
    setFundedByIncomeCategory("");
  }

  function handleCategoryChange(nextCategory: EntryCategory) {
    setCategory(nextCategory);
    if (nextCategory !== INVESTMENT_INCOME_CATEGORY) {
      setFundedByIncomeCategory("");
    }
  }

  function handleAmountChange(value: string) {
    const sanitized = value.replace(/[^\d.,]/g, "");
    setAmount(sanitized);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseMoneyInput(amount);

    if (parsedAmount === null) {
      setError(t.entries.invalidAmount);
      setLoading(false);
      return;
    }

    const parsedInstallmentNumber =
      paymentMode === "CREDIT" && installmentNumber
        ? Number(installmentNumber)
        : null;
    const parsedInstallmentTotal =
      paymentMode === "CREDIT" && installmentTotal
        ? Number(installmentTotal)
        : null;

    try {
      const response = await fetch(
        isEditing ? `/api/entries/${editingEntry!.id}` : "/api/entries",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contextType,
            type,
            category,
            amount: parsedAmount,
            description,
            postedAt,
            paymentMode,
            installmentNumber: parsedInstallmentNumber,
            installmentTotal: parsedInstallmentTotal,
            isRecurring,
            counterparty: counterparty.trim() || null,
            fundedByIncomeCategory:
              category === INVESTMENT_INCOME_CATEGORY && type === "CREDIT"
                ? fundedByIncomeCategory || null
                : null,
          }),
        },
      );

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          data.error ??
            (isEditing ? t.entries.updateFailed : t.entries.createFailed),
        );
      }

      if (!isEditing) {
        setAmount("");
        setDescription("");
        setCounterparty("");
        setInstallmentNumber("");
        setInstallmentTotal("");
        setIsRecurring(false);
        setPaymentMode("CASH");
        setFundedByIncomeCategory("");
      }

      onCancelEdit?.();
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? t.entries.updateFailed
            : t.entries.createFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isEditing && (
        <p className="text-sm font-medium text-primary">{t.entries.editing}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-secondary">{t.entries.type}</label>
          <div className="inline-flex rounded-full bg-elevated/80 p-1 backdrop-blur-sm">
            {(["DEBIT", "CREDIT"] as const).map((entryType) => (
              <button
                key={entryType}
                type="button"
                onClick={() => handleTypeChange(entryType)}
                className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors ${
                  type === entryType
                    ? "bg-surface text-primary"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {entryType === "DEBIT"
                  ? t.common.expense
                  : t.common.income}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-xs text-secondary">
              {t.entries.amount}
            </label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              required
            />
            <p className="text-xs text-tertiary">{t.entries.amountHint}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-xs text-secondary">
              {t.entries.date}
            </label>
            <Input
              id="date"
              type="date"
              value={postedAt}
              onChange={(e) => setPostedAt(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-xs text-secondary">
            {t.entries.description}
          </label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-xs text-secondary">
            {t.entries.category}
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as EntryCategory)}
            className="h-9 w-full rounded-lg border border-transparent bg-elevated px-3 text-sm text-primary backdrop-blur-sm outline-none focus:border-accent/50"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {t.entries.categories[cat]}
              </option>
            ))}
          </select>
        </div>

        {type === "CREDIT" && category === INVESTMENT_INCOME_CATEGORY && (
          <div className="space-y-2">
            <label htmlFor="fundedByIncome" className="text-xs text-secondary">
              {t.entries.fundedByIncome}
            </label>
            <select
              id="fundedByIncome"
              value={fundedByIncomeCategory}
              onChange={(e) => setFundedByIncomeCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-transparent bg-elevated px-3 text-sm text-primary backdrop-blur-sm outline-none focus:border-accent/50"
            >
              <option value="">{t.entries.fundedByIncomeNone}</option>
              {FUNDING_INCOME_CATEGORIES.map((incomeCategory) => (
                <option key={incomeCategory} value={incomeCategory}>
                  {t.entries.categories[incomeCategory]}
                </option>
              ))}
            </select>
            <p className="text-xs text-tertiary">{t.entries.fundedByIncomeHint}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="counterparty" className="text-xs text-secondary">
            {t.entries.counterparty}
          </label>
          <Input
            id="counterparty"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            maxLength={100}
            placeholder={t.entries.counterpartyHint}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-secondary">
            {t.entries.paymentMode}
          </label>
          <div className="inline-flex rounded-full bg-elevated/80 p-1 backdrop-blur-sm">
            {(["CASH", "CREDIT"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMode(mode)}
                className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors ${
                  paymentMode === mode
                    ? "bg-surface text-primary"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {mode === "CASH" ? t.entries.cash : t.entries.credit}
              </button>
            ))}
          </div>
        </div>

        {paymentMode === "CREDIT" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="installmentNumber" className="text-xs text-secondary">
                {t.entries.installmentNumber}
              </label>
              <Input
                id="installmentNumber"
                type="number"
                min={1}
                value={installmentNumber}
                onChange={(e) => setInstallmentNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="installmentTotal" className="text-xs text-secondary">
                {t.entries.installmentTotal}
              </label>
              <Input
                id="installmentTotal"
                type="number"
                min={2}
                value={installmentTotal}
                onChange={(e) => setInstallmentTotal(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded border-subtle"
          />
          {t.entries.recurring}
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading} className="w-full rounded-full sm:w-auto">
            {loading
              ? t.entries.submitting
              : isEditing
                ? t.entries.save
                : t.entries.submit}
          </Button>
          {isEditing && onCancelEdit && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancelEdit}
              disabled={loading}
            >
              {t.common.cancel}
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
