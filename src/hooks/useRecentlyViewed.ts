import { useEffect, useMemo, useState } from "react";

export type RecentlyViewedType = "product" | "bundle";

export interface RecentlyViewedEntry {
  id: string;
  type: RecentlyViewedType;
  timestamp: number;
}

const STORAGE_KEY = "naturagloss_recent";
const MAX_ENTRIES = 12;
const UPDATE_EVENT = "naturagloss:recently-viewed";

function safeParse(value: string | null): RecentlyViewedEntry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RecentlyViewedEntry =>
          Boolean(entry?.id && entry?.type && typeof entry.timestamp === "number")
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

function readEntries(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function listRecent(): RecentlyViewedEntry[] {
  return readEntries();
}

export function recordView(id: string, type: RecentlyViewedType) {
  if (typeof window === "undefined" || !id || !type) return;
  const timestamp = Date.now();
  const existing = readEntries();
  const filtered = existing.filter((entry) => entry.id !== id || entry.type !== type);
  const next = [{ id, type, timestamp }, ...filtered].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function useRecentlyViewed() {
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>(() => readEntries());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const refresh = () => setEntries(readEntries());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return useMemo(() => entries, [entries]);
}
