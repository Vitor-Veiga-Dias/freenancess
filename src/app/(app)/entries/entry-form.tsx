"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ContextType } from "@/domain/context/types";
import {
  getCategoriesForType,
  type EntryCategory,
} from "@/domain/categories/types";
import type { TransactionType } from "@/domain/ledger/types";
import {
  formatMoneyInput,
  parseMoneyInput,
} from "@/domain/ledger/money-input";
import { useI18n } from "@/i18n/context";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { Input } from "@/ui/primitives/input";

export interface EntryFormEntry {
  id: string;
  type: TransactionType;
  category: EntryCategory;
  amount: number;
  description: string;
  postedAt: string | Date;
}

interface EntryFormProps {
  contextType: ContextType;
  editingEntry?: EntryFormEntry | null;
  onCancelEdit?: () => void;
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
      setError(null);
      return;
    }

    setType(editingEntry.type);
    setAmount(formatMoneyInput(editingEntry.amount));
    setDescription(editingEntry.description);
    setCategory(editingEntry.category);
    setPostedAt(toDateInputValue(editingEntry.postedAt));
    setError(null);
  }, [editingEntry]);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    const nextCategories = getCategoriesForType(next);
    setCategory(nextCategories[0]);
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
            postedAt: new Date(`${postedAt}T12:00:00`).toISOString(),
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
      }

      onCancelEdit?.();
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
    <Card className="space-y-4 p-5">
      {isEditing && (
        <p className="text-sm font-medium text-primary">{t.entries.editing}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-secondary">{t.entries.type}</label>
          <div className="inline-flex rounded-lg bg-elevated/80 p-1 backdrop-blur-sm">
            {(["DEBIT", "CREDIT"] as const).map((entryType) => (
              <button
                key={entryType}
                type="button"
                onClick={() => handleTypeChange(entryType)}
                className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors ${
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
            onChange={(e) => setCategory(e.target.value as EntryCategory)}
            className="h-9 w-full rounded-lg border border-transparent bg-elevated px-3 text-sm text-primary backdrop-blur-sm outline-none focus:border-accent/50"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {t.entries.categories[cat]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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
    </Card>
  );
}
