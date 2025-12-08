import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import LayoutLab from "./labs/LayoutLab";
import RitualPlanner from "./pages/RitualPlanner";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersAdmin from "./pages/OrdersAdmin";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminDashboard from "./pages/AdminDashboard";
import RitualStoriesListPage from "./pages/RitualStoriesListPage";
import RitualStoryDetailPage from "./pages/RitualStoryDetailPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { apiGet, apiPost, apiDelete, apiPut } from "./lib/api";
import type { Product } from "./types/product";
import { RouteLoadingShell, DetailSkeleton } from "./components/skeletons/Skeletons";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTranslation, type AppTranslationKey } from "@/localization/locale";

const LazyRitualFinder = lazy(() => import("./pages/RitualFinder"));
const LazyCartPage = lazy(() => import("./pages/CartPage"));
const LazyShopPage = lazy(() => import("./pages/ShopPage"));
const LazySearchPage = lazy(() => import("./pages/SearchPage"));
const LazyFavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const LazyComparePage = lazy(() => import("./pages/ComparePage"));
const LazyRitualGuidesPage = lazy(() => import("./pages/RitualGuidesPage"));
const LazyRitualGuideDetailPage = lazy(() => import("./pages/RitualGuideDetailPage"));
const LazyGiftBuilderPage = lazy(() => import("./pages/GiftBuilderPage"));
const LazyOnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const LazyOrdersHistoryPage = lazy(() => import("./pages/OrdersHistoryPage"));
const LazyRitualCoachPage = lazy(() => import("./pages/RitualCoachPage"));
const LazyAccountPage = lazy(() => import("./pages/AccountPage"));

const routeFallback = (
  title: string,
  message: string,
  grid = true,
  columns?: number,
  rows?: number
) => (
  <RouteLoadingShell title={title} message={message} grid={grid} columns={columns} rows={rows} />
);

const SHOW_LAB = true;

const PRESET_PRODUCTS = [
  { name: "Hydra Serum", price: 45 },
  { name: "Glow Cream", price: 32 },
  { name: "Velvet Cleanser", price: 28 },
  { name: "Silk Toner", price: 22 },
  { name: "Botanical Mist", price: 18 },
];

type RouteTitleMatcher = {
  key: AppTranslationKey;
  match: (path: string, view: string | null) => boolean;
};

const ROUTE_TITLE_MATCHERS: RouteTitleMatcher[] = [
  {
    key: "meta.titles.cart",
    match: (path, view) => view === "cart" || path === "/cart",
  },
  {
    key: "meta.titles.checkout",
    match: (path, view) => view === "checkout" || path === "/checkout",
  },
  {
    key: "meta.titles.orders",
    match: (path, view) => view === "orders-history" || path === "/orders-history",
  },
  {
    key: "meta.titles.favorites",
    match: (path) => path === "/favorites",
  },
  {
    key: "meta.titles.compare",
    match: (path) => path === "/compare",
  },
  {
    key: "meta.titles.shop",
    match: (path, view) => view === "shop" || path === "/shop",
  },
  {
    key: "meta.titles.ritualFinder",
    match: (path, view) => view === "ritualfinder" || path === "/ritual-finder",
  },
  {
    key: "meta.titles.giftBuilder",
    match: (path, view) => view === "giftbuilder" || path === "/gift-builder",
  },
  {
    key: "meta.titles.ritualCoach",
    match: (path, view) => view === "ritualcoach" || path === "/ritual-coach",
  },
  {
    key: "meta.titles.ritualGuides",
    match: (path) => path === "/ritual-guides",
  },
  {
    key: "meta.titles.ritualPlanner",
    match: (path, view) => view === "ritualplanner" || path === "/rituals",
  },
  {
    key: "meta.titles.onboarding",
    match: (path, view) => view === "onboarding" || path === "/onboarding",
  },
  {
    key: "meta.titles.stories",
    match: (path) => path === "/stories",
  },
  {
    key: "meta.titles.storyDetail",
    match: (path) => path.startsWith("/stories/"),
  },
  {
    key: "meta.titles.account",
    match: (path, view) => view === "account" || path === "/account",
  },
  {
    key: "meta.titles.search",
    match: (path, view) => view === "search" || path === "/search",
  },
  {
    key: "meta.titles.product",
    match: (path) => path.startsWith("/products/"),
  },
];

const getTitleKey = (path: string, view: string | null) => {
  for (const matcher of ROUTE_TITLE_MATCHERS) {
    if (matcher.match(path, view)) {
      return matcher.key;
    }
  }
  return "meta.titles.home";
};

function ProductShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"none" | "asc" | "desc">("none");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = (await res.json()) as Product[];
        setProducts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addProduct() {
    const n = Number(price);
    const clean = name.trim();
    if (!clean || Number.isNaN(n) || n < 0) return;

    const res = await apiPost("/products", { name: clean, price: n });
    if (!res.ok) {
      console.error("Failed to create product");
      return;
    }
    const created = (await res.json()) as Product;
    setProducts((prev) => [created, ...prev]);
    setName("");
    setPrice("");
  }

  async function deleteProduct(id: string) {
    const res = await apiDelete(`/products?id=${encodeURIComponent(id)}`);
    if (!res.ok) {
      console.error("Failed to delete product");
      return;
    }
    setProducts((prev) => prev.filter((f) => f._id !== id));
  }

  async function updateProduct(id: string, currentName: string, currentPrice: number) {
    const newName = prompt("Enter New Name:", currentName);
    const newPrice = prompt("Enter New Price:", String(currentPrice));
    const parsedPrice = newPrice ? Number(newPrice) : NaN;
    if (!newName || Number.isNaN(parsedPrice)) return;

    const res = await apiPut(`/products?id=${encodeURIComponent(id)}`, {
      name: newName,
      price: parsedPrice,
    });
    if (!res.ok) {
      alert("Failed to update product");
      return;
    }
    const updated = (await res.json()) as Product;
    setProducts((prev) => prev.map((f) => (f._id === id ? updated : f)));
  }

  const filtered = useMemo(() => {
    const n = Number(minPrice || 0);
    const q = query.trim().toLowerCase();
    return products.filter(
      (item) => item.price >= n && (q === "" || item.name.toLowerCase().includes(q))
    );
  }, [products, minPrice, query]);

  const sorted = useMemo(() => {
    if (sortBy === "asc") return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === "desc") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [filtered, sortBy]);

  const total = useMemo(() => sorted.reduce((sum, item) => sum + item.price, 0), [sorted]);
  const canAdd = name.trim() && !Number.isNaN(Number(price)) && Number(price) >= 0;

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1>Product Lab</h1>

      <fieldset style={{ marginBottom: 16 }}>
        <legend>Add Product</legend>
        <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={addProduct} disabled={!canAdd}>
          Add
        </button>
      </fieldset>

      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <label>
          Min Price:{" "}
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
          />
        </label>

        <label>
          Search By Name:{" "}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Apple, Banana..." />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setSortBy("asc")}>Price ↑</button>
          <button onClick={() => setSortBy("desc")}>Price ↓</button>
          <button onClick={() => setSortBy("none")}>Clear Sort</button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <ul>
            {sorted.map((item) => (
              <li key={item._id}>
                {item.name} — ${item.price}{" "}
                <button onClick={() => deleteProduct(item._id)}>Delete</button>
                <button onClick={() => updateProduct(item._id, item.name, item.price)}>Edit</button>
              </li>
            ))}
          </ul>
          <p>
            <b>Total:</b> ${total}
          </p>
        </>
      )}
    </main>
  );
}

export default function App() {
  const { t } = useTranslation();
  const view =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("view")
      : null;
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, "") || "/"
      : "/";

  const titleKey =
    useMemo(() => getTitleKey(path, view), [path, view]);
  usePageTitle(titleKey);

  let routeContent: React.ReactNode = null;

  if (view === "cart" || path === "/cart") {
    routeContent = (
      <Suspense fallback={routeFallback(t("loader.yourBag"), t("loader.gatheringYourRituals"), false)}>
        <LazyCartPage />
      </Suspense>
    );
  } else if (view === "checkout" || path === "/checkout") {
    routeContent = <CheckoutPage />;
  } else if (path === "/stories") {
    routeContent = <RitualStoriesListPage />;
  } else if (path.startsWith("/stories/")) {
    const slug = path.replace("/stories/", "");
    routeContent = <RitualStoryDetailPage slug={slug} />;
  } else if (view === "adminanalytics" || path === "/admin/analytics") {
    routeContent = <AdminAnalyticsPage />;
  } else if (view === "admin" || path === "/admin") {
    routeContent = <AdminDashboard />;
  } else if (view === "orders" || path === "/orders") {
    routeContent = <OrdersAdmin />;
  } else if (view === "ritualplanner" || path === "/rituals") {
    routeContent = <RitualPlanner />;
  } else if (view === "ritualfinder" || path === "/ritual-finder") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("loader.ritualFinder"), t("loader.craftingYourRitualPath"), false)}
      >
        <LazyRitualFinder />
      </Suspense>
    );
  } else if (view === "onboarding" || path === "/onboarding") {
    routeContent = (
      <Suspense fallback={routeFallback(t("sections.ritualProfile"), t("loader.ritualProfile"), false)}>
        <LazyOnboardingPage />
      </Suspense>
    );
  } else if (view === "orders-history" || path === "/orders-history") {
    routeContent = (
      <Suspense
        fallback={routeFallback(
          t("loader.ordersHistory"),
          t("loader.gatheringYourRituals"),
          false
        )}
      >
        <LazyOrdersHistoryPage />
      </Suspense>
    );
  } else if (view === "search" || path === "/search") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("loader.search"), t("loader.aligningEveryRitualNote"), true, 3, 2)}
      >
        <LazySearchPage />
      </Suspense>
    );
  } else if (view === "compare" || path === "/compare") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("loader.compare"), t("loader.balancingYourRituals"), false)}
      >
        <LazyComparePage />
      </Suspense>
    );
  } else if (view === "favorites" || path === "/favorites") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("loader.yourFavourites"), t("loader.gatheringYourCalmPicks"))}
      >
        <LazyFavoritesPage />
      </Suspense>
    );
  } else if (view === "shop" || path === "/shop") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("loader.shop"), t("loader.curatingTheRitualCatalog"), true, 4, 3)}
      >
        <LazyShopPage />
      </Suspense>
    );
  } else if (view === "ritualguides" || path === "/ritual-guides") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("loader.ritualGuides"), t("loader.sourcingMindfulGuides"))}
      >
        <LazyRitualGuidesPage />
      </Suspense>
    );
  } else if (path.startsWith("/ritual-guides/")) {
    const guideSlug = path.replace("/ritual-guides/", "");
    routeContent = (
      <Suspense fallback={<DetailSkeleton />}>
        <LazyRitualGuideDetailPage slug={guideSlug} />
      </Suspense>
    );
  } else if (view === "giftbuilder" || path === "/gift-builder") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("loader.giftBuilder"), t("loader.assemblingYourCustomBox"), false)}
      >
        <LazyGiftBuilderPage />
      </Suspense>
    );
  } else if (path.startsWith("/products/")) {
    const slug = path.replace("/products/", "");
    routeContent = <ProductDetailPage slug={slug} />;
  } else if (view === "ritualcoach" || path === "/ritual-coach") {
    routeContent = (
      <Suspense
        fallback={routeFallback(
          t("ritualCoach.loader.title"),
          t("ritualCoach.loader.subtitle"),
          false
        )}
      >
        <LazyRitualCoachPage />
      </Suspense>
    );
  } else if (view === "account" || path === "/account") {
    routeContent = (
      <Suspense
        fallback={routeFallback(t("account.hero.title"), t("account.hero.subtitle"), false)}
      >
        <LazyAccountPage />
      </Suspense>
    );
  } else {
    routeContent = SHOW_LAB ? <LayoutLab /> : <ProductShop />;
  }

  return (
    <>
      <SkipToContent />
      <div id="main-content" role="main" tabIndex={-1}>
        {routeContent}
      </div>
    </>
  );
}
