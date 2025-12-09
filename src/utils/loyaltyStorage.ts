export type LoyaltyRecord = {
  totalPoints: number;
  lastOrderAt?: string | null;
  lastUpdatedAt: string;
};

const LOYALTY_KEY = "naturagloss_loyalty";

const safeRecord = (): LoyaltyRecord => ({
  totalPoints: 0,
  lastUpdatedAt: new Date().toISOString(),
});

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const parseRecord = (value: string | null): LoyaltyRecord | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.totalPoints === "number" &&
      typeof parsed.lastUpdatedAt === "string"
    ) {
      return {
        totalPoints: parsed.totalPoints,
        lastOrderAt: typeof parsed.lastOrderAt === "string" ? parsed.lastOrderAt : undefined,
        lastUpdatedAt: parsed.lastUpdatedAt,
      };
    }
  } catch (error) {
    console.warn("Failed to parse loyalty record", error);
  }
  return null;
};

export function loadLoyalty(): LoyaltyRecord {
  if (!canUseStorage()) return safeRecord();
  const raw = window.localStorage.getItem(LOYALTY_KEY);
  if (!raw) return safeRecord();
  return parseRecord(raw) ?? safeRecord();
}

export function saveLoyalty(record: LoyaltyRecord): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(LOYALTY_KEY, JSON.stringify(record));
  } catch (error) {
    console.warn("Unable to save loyalty record", error);
  }
}

export function addPoints(pointsToAdd: number, orderDate: string): LoyaltyRecord {
  const current = loadLoyalty();
  const next: LoyaltyRecord = {
    totalPoints: current.totalPoints + Math.max(0, Math.floor(pointsToAdd)),
    lastOrderAt: orderDate,
    lastUpdatedAt: orderDate,
  };
  saveLoyalty(next);
  return next;
}

export const LOYALTY_STORAGE_KEY = LOYALTY_KEY;
