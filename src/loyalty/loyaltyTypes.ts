export type LoyaltyTierId = "bronze" | "silver" | "gold" | "platinum";

export type LoyaltyTier = {
  id: LoyaltyTierId;
  label: string;
  minPoints: number;
  perksSummary: string;
};

export type LoyaltySnapshot = {
  totalPoints: number;
  currentTierId: LoyaltyTierId;
  nextTierId?: LoyaltyTierId;
  pointsToNextTier?: number;
  lastUpdatedAt: string;
};
