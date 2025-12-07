import { useMemo } from "react";
import { searchEntries, type SearchEntry } from "@/content/searchIndex";
import { shopFocusLookup } from "@/content/shopCatalog";

const beautifyFocus = (focusId: string) => shopFocusLookup[focusId] ?? focusId;

function matchesText(entry: SearchEntry, normalized: string) {
  const focusLabels = entry.focus.map(beautifyFocus);
  const haystack = [entry.label, entry.tagline, ...focusLabels]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

export function filterSearchEntries(
  query: string,
  options?: { allowEmpty?: boolean }
): SearchEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options?.allowEmpty ? searchEntries : [];
  }
  return searchEntries.filter((entry) => matchesText(entry, normalized));
}

export function useGlobalSearch(query: string, limit = 5) {
  return useMemo(() => {
    if (!query.trim()) return [];
    return filterSearchEntries(query).slice(0, limit);
  }, [query, limit]);
}
