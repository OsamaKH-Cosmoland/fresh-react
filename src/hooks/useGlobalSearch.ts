import { useMemo } from "react";
import { searchEntries, type SearchEntry } from "@/content/searchIndex";
import { getShopFocusLookup, shopFocusLookup } from "@/content/shopCatalog";
import { useTranslation } from "@/localization/locale";

function matchesText(
  entry: SearchEntry,
  normalized: string,
  focusLookup: Record<string, string>
) {
  const focusLabels = entry.focus.map((focusId) => focusLookup[focusId] ?? focusId);
  const haystack = [entry.label, entry.tagline, ...focusLabels]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

export function filterSearchEntries(
  query: string,
  options?: { allowEmpty?: boolean },
  focusLookup: Record<string, string> = shopFocusLookup
): SearchEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options?.allowEmpty ? searchEntries : [];
  }
  return searchEntries.filter((entry) => matchesText(entry, normalized, focusLookup));
}

export function useGlobalSearch(query: string, limit = 5) {
  const { locale } = useTranslation();
  const focusLookup = useMemo(() => getShopFocusLookup(locale), [locale]);
  return useMemo(() => {
    if (!query.trim()) return [];
    return filterSearchEntries(query, undefined, focusLookup).slice(0, limit);
  }, [focusLookup, query, limit]);
}
