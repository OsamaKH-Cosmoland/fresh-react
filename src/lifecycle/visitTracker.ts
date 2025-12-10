export interface VisitSnapshot {
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  visitCount: number;
}

const STORAGE_KEY = "naturagloss_visits";
export const VISIT_UPDATE_EVENT = "naturagloss:visits-updated";
export const VISIT_STORAGE_KEY = STORAGE_KEY;

const defaultSnapshot: VisitSnapshot = {
  firstVisitAt: null,
  lastVisitAt: null,
  visitCount: 0,
};

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function loadVisitSnapshot(): VisitSnapshot {
  if (!canUseStorage()) {
    return defaultSnapshot;
  }
  const serialized = window.localStorage.getItem(STORAGE_KEY);
  if (!serialized) {
    return defaultSnapshot;
  }
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object") {
      return defaultSnapshot;
    }
    return {
      firstVisitAt: typeof parsed.firstVisitAt === "string" ? parsed.firstVisitAt : null,
      lastVisitAt: typeof parsed.lastVisitAt === "string" ? parsed.lastVisitAt : null,
      visitCount: typeof parsed.visitCount === "number" ? parsed.visitCount : 0,
    };
  } catch {
    return defaultSnapshot;
  }
}

export function recordVisit(now = Date.now()): VisitSnapshot {
  if (!canUseStorage()) {
    const iso = new Date(now).toISOString();
    return {
      firstVisitAt: iso,
      lastVisitAt: iso,
      visitCount: 1,
    };
  }
  const current = loadVisitSnapshot();
  const isoNow = new Date(now).toISOString();
  const next: VisitSnapshot = {
    firstVisitAt: current.firstVisitAt ?? isoNow,
    lastVisitAt: isoNow,
    visitCount: current.visitCount + 1,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(VISIT_UPDATE_EVENT));
  } catch {
    // ignore write failures
  }
  return next;
}
