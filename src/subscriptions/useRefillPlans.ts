import { useCallback, useEffect, useState } from "react";
import {
  REFILL_PLAN_STORAGE_KEY,
  listPlans,
  type RefillPlan,
} from "./refillPlanStorage";

export function useRefillPlans() {
  const [plans, setPlans] = useState<RefillPlan[]>(() => listPlans());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === REFILL_PLAN_STORAGE_KEY) {
        setPlans(listPlans());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refresh = useCallback(() => setPlans(listPlans()), []);

  return { plans, refresh };
}
