import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateEarnedPoints,
  getNextTierInfo,
  getTierFromPoints,
  loadRitualPointsState,
  RITUAL_POINTS_KEY,
  RitualPointsState,
  saveRitualPointsState,
} from "./ritualPoints";

/**
 * Phase 1 front-end loyalty helper.
 * Stores loyalty state in localStorage and keeps everything browser-only.
 * Phase 2 can move this state to the back end once the API contracts exist.
 */
export function useRitualPoints() {
  const [state, setState] = useState<RitualPointsState>(() => loadRitualPointsState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RITUAL_POINTS_KEY) {
        setState(loadRitualPointsState());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    saveRitualPointsState(state);
  }, [state]);

  const registerOrder = useCallback((orderId: string, orderTotal: number) => {
    if (!orderId) return;
    setState((prev) => {
      if (prev.processedOrders.includes(orderId)) {
        return prev;
      }
      const earnedPoints = calculateEarnedPoints(orderTotal);
      const nextState: RitualPointsState = {
        totalPoints: prev.totalPoints + earnedPoints,
        lastOrderAt: new Date().toISOString(),
        processedOrders: [...prev.processedOrders, orderId],
      };
      return nextState;
    });
  }, []);

  const tier = useMemo(() => getTierFromPoints(state.totalPoints), [state.totalPoints]);
  const nextTierInfo = useMemo(() => getNextTierInfo(state.totalPoints), [state.totalPoints]);

  return {
    state,
    tier,
    nextTier: nextTierInfo.nextTier,
    pointsToNext: nextTierInfo.pointsToNext,
    registerOrder,
  };
}
