"use client";

import { useState } from "react";

import type { ContextType } from "@/domain/context/types";
import type { ManualEntryEntity } from "@/domain/categories/types";

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
  const [editingEntry, setEditingEntry] = useState<EntryFormEntry | null>(null);

  return (
    <>
      <EntryForm
        contextType={contextType}
        editingEntry={editingEntry}
        onCancelEdit={() => setEditingEntry(null)}
      />

      <section className="space-y-4">
        <EntryList
          entries={entries}
          intlLocale={intlLocale}
          editingEntryId={editingEntry?.id ?? null}
          onEdit={setEditingEntry}
        />
      </section>
    </>
  );
}
