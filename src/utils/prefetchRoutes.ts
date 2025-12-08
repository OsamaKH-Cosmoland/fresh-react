import {
  importAccountPage,
  importGiftBuilderPage,
  importRitualCoachPage,
  importRitualFinderPage,
  importRitualGuidesPage,
  importShopPage,
} from "@/routes/lazyRoutes";

export type PrefetchRouteKey =
  | "/shop"
  | "/ritual-finder"
  | "/gift-builder"
  | "/ritual-guides"
  | "/ritual-coach"
  | "/account";

const routeImporters: Record<PrefetchRouteKey, () => Promise<unknown>> = {
  "/shop": importShopPage,
  "/ritual-finder": importRitualFinderPage,
  "/gift-builder": importGiftBuilderPage,
  "/ritual-guides": importRitualGuidesPage,
  "/ritual-coach": importRitualCoachPage,
  "/account": importAccountPage,
};

const prefetchedRoutes = new Set<PrefetchRouteKey>();

export function prefetchRoute(route: PrefetchRouteKey) {
  if (prefetchedRoutes.has(route)) {
    return;
  }
  prefetchedRoutes.add(route);
  routeImporters[route]()
    .catch(() => {
      prefetchedRoutes.delete(route);
    });
}

export const PREFETCH_ROUTE_ALIASES: Record<string, PrefetchRouteKey> = {
  "/shop": "/shop",
  "?view=shop": "/shop",
  "?view=ritualfinder": "/ritual-finder",
  "/ritual-finder": "/ritual-finder",
  "/gift-builder": "/gift-builder",
  "?view=giftbuilder": "/gift-builder",
  "/ritual-guides": "/ritual-guides",
  "/ritual-coach": "/ritual-coach",
  "?view=ritualcoach": "/ritual-coach",
  "/account": "/account",
};
