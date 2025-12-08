import { lazy } from "react";

export const importShopPage = () => import("../pages/ShopPage");
export const LazyShopPage = lazy(importShopPage);

export const importSearchPage = () => import("../pages/SearchPage");
export const LazySearchPage = lazy(importSearchPage);

export const importFavoritesPage = () => import("../pages/FavoritesPage");
export const LazyFavoritesPage = lazy(importFavoritesPage);

export const importComparePage = () => import("../pages/ComparePage");
export const LazyComparePage = lazy(importComparePage);

export const importRitualFinderPage = () => import("../pages/RitualFinder");
export const LazyRitualFinderPage = lazy(importRitualFinderPage);

export const importGiftBuilderPage = () => import("../pages/GiftBuilderPage");
export const LazyGiftBuilderPage = lazy(importGiftBuilderPage);

export const importRitualGuidesPage = () => import("../pages/RitualGuidesPage");
export const LazyRitualGuidesPage = lazy(importRitualGuidesPage);

export const importRitualGuideDetailPage = () => import("../pages/RitualGuideDetailPage");
export const LazyRitualGuideDetailPage = lazy(importRitualGuideDetailPage);

export const importRitualCoachPage = () => import("../pages/RitualCoachPage");
export const LazyRitualCoachPage = lazy(importRitualCoachPage);

export const importCartPage = () => import("../pages/CartPage");
export const LazyCartPage = lazy(importCartPage);

export const importOnboardingPage = () => import("../pages/OnboardingPage");
export const LazyOnboardingPage = lazy(importOnboardingPage);

export const importOrdersHistoryPage = () => import("../pages/OrdersHistoryPage");
export const LazyOrdersHistoryPage = lazy(importOrdersHistoryPage);

export const importAccountPage = () => import("../pages/AccountPage");
export const LazyAccountPage = lazy(importAccountPage);
