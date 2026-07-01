import type { EntryCategory } from "@/domain/categories/types";
import type { Dictionary } from "@/i18n/types";

export function getCategoryLabel(
  t: Dictionary,
  category: EntryCategory,
): string {
  return t.entries.categories[category];
}
