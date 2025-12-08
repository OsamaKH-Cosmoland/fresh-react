import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "naturagloss_prefs";

export const CONCERN_VALUES = ["bodyHydration", "hairGrowth", "handsLips"] as const;
export type ConcernOption = (typeof CONCERN_VALUES)[number];
export const TIME_VALUES = ["morning", "evening", "both", "express"] as const;
export type TimePreference = (typeof TIME_VALUES)[number];
export const SCENT_VALUES = ["softFloral", "fresh", "warm", "unscented"] as const;
export type ScentPreference = (typeof SCENT_VALUES)[number];
export const BUDGET_VALUES = ["valueFocused", "premium"] as const;
export type BudgetPreference = (typeof BUDGET_VALUES)[number];

export interface UserPreferences {
  concerns: ConcernOption[];
  timePreference: TimePreference | null;
  scentPreference: ScentPreference | null;
  budgetPreference: BudgetPreference | null;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  concerns: [],
  timePreference: null,
  scentPreference: null,
  budgetPreference: null,
};

const isConcernOption = (value: unknown): value is ConcernOption =>
  typeof value === "string" && (CONCERN_VALUES as readonly string[]).includes(value);

const isTimePreference = (value: unknown): value is TimePreference =>
  typeof value === "string" && (TIME_VALUES as readonly string[]).includes(value);

const isScentPreference = (value: unknown): value is ScentPreference =>
  typeof value === "string" && (SCENT_VALUES as readonly string[]).includes(value);

const isBudgetPreference = (value: unknown): value is BudgetPreference =>
  typeof value === "string" && (BUDGET_VALUES as readonly string[]).includes(value);

function sanitizeConcerns(value: unknown): ConcernOption[] {
  if (!Array.isArray(value)) return [];
  const normalized = value.filter(isConcernOption);
  return Array.from(new Set(normalized));
}

function parsePreferences(raw: string): UserPreferences | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const concerns = sanitizeConcerns((parsed as Record<string, unknown>).concerns);
    const timePreference = isTimePreference((parsed as Record<string, unknown>).timePreference)
      ? (parsed as Record<string, unknown>).timePreference
      : null;
    const scentPreference = isScentPreference((parsed as Record<string, unknown>).scentPreference)
      ? (parsed as Record<string, unknown>).scentPreference
      : null;
    const budgetPreference = isBudgetPreference((parsed as Record<string, unknown>).budgetPreference)
      ? (parsed as Record<string, unknown>).budgetPreference
      : null;
    return {
      concerns,
      timePreference,
      scentPreference,
      budgetPreference,
    };
  } catch (error) {
    console.error("Failed to parse user preferences:", error);
    return null;
  }
}

function readPreferencesFromStorage(): UserPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return parsePreferences(raw);
}

function writePreferencesToStorage(value: UserPreferences | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (value === null) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(() =>
    readPreferencesFromStorage()
  );

  useEffect(() => {
    const stored = readPreferencesFromStorage();
    setPreferences(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) {
        setPreferences(null);
        return;
      }
      const parsed = parsePreferences(event.newValue);
      setPreferences(parsed);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const savePreferences = useCallback((next: UserPreferences) => {
    writePreferencesToStorage(next);
    setPreferences(next);
  }, []);

  const clearPreferences = useCallback(() => {
    writePreferencesToStorage(null);
    setPreferences(null);
  }, []);

  const hasPreferences = useMemo(() => Boolean(preferences && preferences.concerns.length > 0), [
    preferences
  ]);

  return { preferences, savePreferences, clearPreferences, hasPreferences };
}
