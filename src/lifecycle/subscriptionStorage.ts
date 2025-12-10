import type { LifecycleSubscription } from "./types";

const STORAGE_KEY = "naturagloss_subscriptions";
export const SUBSCRIPTION_STORAGE_KEY = STORAGE_KEY;

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeSubscription = (value: unknown): LifecycleSubscription | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  const name = typeof record.name === "string" ? record.name : null;
  const nextRefillAt =
    typeof record.nextRefillAt === "string" && record.nextRefillAt
      ? record.nextRefillAt
      : null;
  if (!id || !name) {
    return null;
  }
  return { id, name, nextRefillAt };
};

export function loadSubscriptions(): LifecycleSubscription[] {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return [];
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSubscription)
      .filter((entry): entry is LifecycleSubscription => Boolean(entry));
  } catch {
    return [];
  }
}
