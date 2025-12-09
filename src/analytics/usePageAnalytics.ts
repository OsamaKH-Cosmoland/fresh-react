import { useEffect } from "react";
import { trackEvent } from "./events";
import type { AnalyticsPage } from "./events";

export function usePageAnalytics(page: AnalyticsPage) {
  useEffect(() => {
    trackEvent({ type: "view_page", page });
  }, [page]);
}
