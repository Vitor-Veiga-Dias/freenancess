"use client";

import { useEffect, useState } from "react";

import type { ContextType } from "@/domain/context/types";
import type { ManualEntryEntity } from "@/domain/categories/types";
import { useI18n } from "@/i18n/context";
import { ResponsiveFormShell } from "@/ui/patterns/responsive-form-shell";

import { EntryForm, type EntryFormEntry } from "./entry-form";
import { EntryList } from "./entry-list";

interface EntriesSectionProps {
  contextType: ContextType;
  entries: Array<Omit<ManualEntryEntity, "postedAt"> & { postedAt: string | Date }>;
  intlLocale: string;
}

export function EntriesSection({
  contextType,
  entries,
  intlLocale,
}: EntriesSectionProps) {
  const { t } = useI18n();
  const [editingEntry, setEditingEntry] = useState<EntryFormEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setFormOpen(true);
    }
  }, [editingEntry]);

  function handleCancelEdit() {
    setEditingEntry(null);
    setFormOpen(false);
  }

  function handleSuccess() {
    setEditingEntry(null);
    setFormOpen(false);
  }

  function handleEdit(entry: EntryFormEntry) {
    setEditingEntry(entry);
    setFormOpen(true);
  }

  const formTitle = editingEntry ? t.entries.editing : t.entries.title;

  return (
    <>
      <ResponsiveFormShell
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingEntry(null);
          }
        }}
        title={formTitle}
        triggerLabel={t.entries.submit}
        closeLabel={t.common.close}
        hideTrigger={Boolean(editingEntry)}
      >
        <EntryForm
          contextType={contextType}
          editingEntry={editingEntry}
          onCancelEdit={handleCancelEdit}
          onSuccess={handleSuccess}
        />
      </ResponsiveFormShell>

      <section className="space-y-4 pb-24 md:pb-0">
        <EntryList
          entries={entries}
          intlLocale={intlLocale}
          editingEntryId={editingEntry?.id ?? null}
          onEdit={handleEdit}
        />
      </section>
    </>
  );
}
