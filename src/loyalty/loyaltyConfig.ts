import type { LoyaltyTier, LoyaltyTierId } from "./loyaltyTypes";

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "bronze",
    label: "Bronze Ritual",
    minPoints: 0,
    perksSummary: "Gentle welcome into the NaturaGloss ritual world.",
  },
  {
    id: "silver",
    label: "Silver Ritual",
    minPoints: 1000,
    perksSummary: "Deeper care, early access to new rituals.",
  },
  {
    id: "gold",
    label: "Gold Ritual",
    minPoints: 2500,
    perksSummary: "Priority care and special seasonal rituals.",
  },
  {
    id: "platinum",
    label: "Platinum Ritual",
    minPoints: 5000,
    perksSummary: "Top-tier ritual status with the most generous care.",
  },
];

export function resolveTier(points: number) {
  const sorted = [...LOYALTY_TIERS].sort((a, b) => a.minPoints - b.minPoints);
  let currentTier = sorted[0];
  let nextTier: LoyaltyTier | undefined;

  for (let i = 0; i < sorted.length; i += 1) {
    const tier = sorted[i];
    if (points >= tier.minPoints) {
      currentTier = tier;
      nextTier = sorted[i + 1];
    }
  }

  if (!nextTier) {
    nextTier = undefined;
  }

  const pointsToNextTier =
    nextTier && nextTier.minPoints > points ? nextTier.minPoints - points : undefined;

  return {
    currentTier,
    nextTier,
    pointsToNextTier,
  };
}
