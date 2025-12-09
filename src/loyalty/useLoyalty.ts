import { useCallback, useEffect, useMemo, useState } from "react";
import { LOYALTY_STORAGE_KEY, loadLoyalty, LoyaltyRecord } from "@/utils/loyaltyStorage";
import { resolveTier } from "./loyaltyConfig";

export function useLoyalty() {
  const [record, setRecord] = useState<LoyaltyRecord>(() => loadLoyalty());

  const refresh = useCallback(() => {
    setRecord(loadLoyalty());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOYALTY_STORAGE_KEY) {
        setRecord(loadLoyalty());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const tierData = useMemo(() => {
    const { currentTier, nextTier, pointsToNextTier } = resolveTier(record.totalPoints);
    return {
      currentTier,
      nextTier,
      pointsToNextTier,
    };
  }, [record.totalPoints]);

  return {
    totalPoints: record.totalPoints,
    lastOrderAt: record.lastOrderAt,
    lastUpdatedAt: record.lastUpdatedAt,
    currentTier: tierData.currentTier,
    nextTier: tierData.nextTier,
    pointsToNextTier: tierData.pointsToNextTier,
    refresh,
  };
}
