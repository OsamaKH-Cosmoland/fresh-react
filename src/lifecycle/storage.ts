import type { LifecycleHistory } from "./types";

const STORAGE_KEY = "naturagloss_lifecycle_history";

const safeHistory: LifecycleHistory = {
  lastEvaluatedAt: null,
  lastAction: null,
  ruleHistory: {},
  dismissalHistory: {},
};

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function loadLifecycleHistory(): LifecycleHistory {
  if (!canUseStorage()) {
    return safeHistory;
  }
  const serialized = window.localStorage.getItem(STORAGE_KEY);
  if (!serialized) {
    return safeHistory;
  }
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object") {
      return safeHistory;
    }
    return {
      lastEvaluatedAt: parsed.lastEvaluatedAt ?? null,
      lastAction: parsed.lastAction ?? null,
      ruleHistory: typeof parsed.ruleHistory === "object" && parsed.ruleHistory !== null
        ? parsed.ruleHistory
        : {},
      dismissalHistory:
        typeof parsed.dismissalHistory === "object" && parsed.dismissalHistory !== null
          ? parsed.dismissalHistory
          : {},
    };
  } catch {
    return safeHistory;
  }
}

export function saveLifecycleHistory(history: LifecycleHistory) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore write failures
  }
}
