"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import type { ManualEntryEntity } from "@/domain/categories/types";
import type { EntryCategory } from "@/domain/categories/types";
import { useI18n } from "@/i18n/context";
import { getCategoryLabel } from "@/i18n/category-labels";
import { Badge } from "@/ui/primitives/badge";
import { Card } from "@/ui/primitives/card";
import { formatCurrency } from "@/ui/tokens/cn";

import type { EntryFormEntry } from "./entry-form";

interface EntryListProps {
  entries: Array<Omit<ManualEntryEntity, "postedAt"> & { postedAt: string | Date }>;
  intlLocale: string;
  editingEntryId?: string | null;
  onEdit: (entry: EntryFormEntry) => void;
}

export function EntryList({
  entries,
  intlLocale,
  editingEntryId,
  onEdit,
}: EntryListProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return <Card className="p-5 text-sm text-secondary">{t.entries.empty}</Card>;
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/entries/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error(t.entries.deleteFailed);
      }

      router.refresh();
    } catch {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isEditing = editingEntryId === entry.id;

        return (
          <Card
            key={entry.id}
            className={`flex items-center justify-between gap-4 p-4 ${
              isEditing ? "border-accent/40" : ""
            }`}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-primary">
                  {entry.description}
                </p>
                <Badge variant={entry.type === "CREDIT" ? "success" : "default"}>
                  {getCategoryLabel(t, entry.category as EntryCategory)}
                </Badge>
              </div>
              <p className="text-xs text-tertiary">
                {new Date(entry.postedAt).toLocaleDateString(intlLocale)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p
                className={`font-mono text-sm tabular-nums ${
                  entry.type === "CREDIT" ? "text-accent" : "text-primary"
                }`}
              >
                {entry.type === "DEBIT" ? "−" : "+"}
                {formatCurrency(entry.amount, "BRL", intlLocale)}
              </p>
              <button
                type="button"
                onClick={() =>
                  onEdit({
                    id: entry.id,
                    type: entry.type,
                    category: entry.category as EntryCategory,
                    amount: entry.amount,
                    description: entry.description,
                    postedAt: entry.postedAt,
                  })
                }
                disabled={isEditing}
                className="rounded-lg p-1.5 text-tertiary transition-colors hover:bg-elevated hover:text-primary disabled:opacity-50"
                aria-label={t.entries.edit}
              >
                <Pencil className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="rounded-lg p-1.5 text-tertiary transition-colors hover:bg-elevated hover:text-danger"
                aria-label={t.common.delete}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
