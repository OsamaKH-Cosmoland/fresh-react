export type RitualTierId = "bronze" | "silver" | "gold" | "platinum";

export type RitualTier = {
  id: RitualTierId;
  name: string;
  minPoints: number;
  description: string;
};

export const RITUAL_TIERS: RitualTier[] = [
  { id: "bronze", name: "Bronze Ritual", minPoints: 0, description: "Gentle welcome into the NaturaGloss ritual world." },
  { id: "silver", name: "Silver Ritual", minPoints: 100, description: "Deeper glow with extra treats and perks." },
  { id: "gold", name: "Gold Ritual", minPoints: 300, description: "VIP glow with priority rituals and rewards." },
  { id: "platinum", name: "Platinum Ritual", minPoints: 700, description: "Ultimate NaturaGloss ritual experience." },
];

export const POINTS_PER_CURRENCY_UNIT = 1;

export type RitualPointsState = {
  totalPoints: number;
  lastOrderAt: string | null;
  processedOrders: string[];
};

export const RITUAL_POINTS_KEY = "ng.ritualPoints";

const safeState: RitualPointsState = {
  totalPoints: 0,
  lastOrderAt: null,
  processedOrders: [],
};

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const parseState = (value: string | null): RitualPointsState => {
  if (!value) return safeState;
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.totalPoints === "number" &&
      (typeof parsed.lastOrderAt === "string" || parsed.lastOrderAt === null || parsed.lastOrderAt === undefined) &&
      Array.isArray(parsed.processedOrders)
    ) {
      return {
        totalPoints: parsed.totalPoints,
        lastOrderAt: typeof parsed.lastOrderAt === "string" ? parsed.lastOrderAt : null,
        processedOrders: parsed.processedOrders.filter((entry: unknown) => typeof entry === "string"),
      };
    }
  } catch {
    //
  }
  return safeState;
};

export function loadRitualPointsState(): RitualPointsState {
  if (!canUseStorage()) return safeState;
  const raw = window.localStorage.getItem(RITUAL_POINTS_KEY);
  return parseState(raw);
}

export function saveRitualPointsState(state: RitualPointsState) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(RITUAL_POINTS_KEY, JSON.stringify(state));
  } catch {
    //
  }
}

export function calculateEarnedPoints(orderTotal: number): number {
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) return 0;
  return Math.max(0, Math.floor(orderTotal * POINTS_PER_CURRENCY_UNIT));
}

export function getTierFromPoints(totalPoints: number): RitualTier {
  const sorted = [...RITUAL_TIERS].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0];
  for (const tier of sorted) {
    if (totalPoints >= tier.minPoints) {
      current = tier;
    }
  }
  return current;
}

export function getNextTierInfo(totalPoints: number): {
  nextTier: RitualTier | null;
  pointsToNext: number | null;
} {
  const sorted = [...RITUAL_TIERS].sort((a, b) => a.minPoints - b.minPoints);
  const current = getTierFromPoints(totalPoints);
  const currentIndex = sorted.findIndex((tier) => tier.id === current.id);
  const nextTier = sorted[currentIndex + 1] ?? null;
  if (!nextTier) {
    return { nextTier: null, pointsToNext: null };
  }
  return {
    nextTier,
    pointsToNext: Math.max(0, nextTier.minPoints - totalPoints),
  };
}
