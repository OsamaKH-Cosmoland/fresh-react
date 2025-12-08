import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FadeIn } from "@/components/animate";
import { useCart } from "@/cart/cartStore";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useCompare } from "@/compare/compareStore";
import { useLocale, useTranslation } from "@/localization/locale";

const buildAppUrl = (pathname: string) => {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${normalized}${normalizedPath}`;
};

interface NavbarProps {
  onMenuToggle: () => void;
  sticky?: boolean;
  brand?: string;
  cartCount?: number;
  showSectionLinks?: boolean;
  compactSearch?: boolean;
  onCartOpen?: () => void;
}

export default function Navbar({
  onMenuToggle,
  sticky = false,
  brand = "NaturaGloss",
  cartCount = 0,
  showSectionLinks = true,
  compactSearch = false,
  onCartOpen,
}: NavbarProps) {
  const [elevated, setElevated] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const { totalQuantity } = useCart();
  const displayCount = totalQuantity ?? cartCount;
  const itemLabel = displayCount === 1 ? "item" : "items";
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const buildSectionHref = (hash: string) => {
    const base = import.meta.env.BASE_URL || "/";
    const normalized = base.endsWith("/") ? base : `${base}/`;
    const target = String(hash).replace(/^#/, "");
    return `${normalized}#${target}`;
  };

  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => {
      const y = window.scrollY;
      setElevated(y > 4);
      setIsScrolled(y > 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchActive(false);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("mousedown", handler);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("mousedown", handler);
      }
    };
  }, []);

  const navActions = (
    <div className="nav-actions">
      <Button
        variant="ghost"
        size="sm"
        className="nav-language"
        onClick={() => setLocale(locale === "en" ? "ar" : "en")}
        aria-label={`Switch to ${locale === "en" ? "AR" : "EN"}`}
      >
        {locale.toUpperCase()}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="nav-orders"
        onClick={() => (window.location.href = buildAppUrl("/orders-history"))}
      >
        {t("nav.orders")}
      </Button>
      <Button variant="ghost" size="sm" className="nav-coach" onClick={() => (window.location.href = buildAppUrl("/ritual-coach"))}>
        {t("nav.ritualCoach")}
      </Button>
      <Button
        variant="secondary"
        className="nav-cart"
        size="md"
        onClick={() => {
          if (onCartOpen) {
            onCartOpen();
            return;
          }
          const base = import.meta.env.BASE_URL ?? "/";
          const location = `${base}?view=cart`;
          window.location.href = location;
        }}
        aria-label={`${t("nav.viewCart")} (${displayCount} ${itemLabel})`}
      >
        <span className="nav-cart__glow" aria-hidden="true" />
        <span className="nav-cart__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M4 5h2l1.6 8.4c.1.6.7 1.1 1.3 1.1h7.5c.6 0 1.2-.5 1.3-1.1L19 8H7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="19" r="1.3" />
            <circle cx="17" cy="19" r="1.3" />
          </svg>
        </span>
        <span className="nav-cart__label">{t("nav.cart")}</span>
        <span className="nav-cart__count">{displayCount}</span>
      </Button>
      <button className="hamburger" aria-label="Open menu" onClick={onMenuToggle}>
        <span />
        <span />
        <span />
      </button>
    </div>
  );

  const dropdownResults = useGlobalSearch(searchQuery, 5);
  const showDropdown = searchActive && searchQuery.trim().length > 0;
  const { listCompared } = useCompare();
  const compareCount = listCompared().length;

  const handleResultClick = (url: string) => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.href = url;
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    if (typeof window === "undefined") return;
    window.location.href = `${buildAppUrl("/search")}?q=${encodeURIComponent(
      searchQuery.trim()
    )}`;
  };

  const searchField = (
    <div
      ref={searchRef}
      className={`nav-search${compactSearch ? " nav-search--compact" : ""}`}
    >
        <input
          type="search"
          placeholder={t("search.placeholder")}
          value={searchQuery}
          onFocus={() => setSearchActive(true)}
          onChange={(event) => setSearchQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSearchSubmit();
          }
        }}
        aria-label="Search site"
      />
      {showDropdown && (
        <div className="nav-search__dropdown">
              {dropdownResults.length > 0 ? (
            <>
              {dropdownResults.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className="nav-search__result"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleResultClick(entry.url)}
                >
                  <div>
                    <p className="nav-search__result-title">{entry.label}</p>
                    <p className="nav-search__result-copy">{entry.tagline}</p>
                  </div>
                  <span className="nav-search__result-type">{entry.kind}</span>
                </button>
              ))}
                <button
                  type="button"
                  className="nav-search__view-all"
                  onClick={handleSearchSubmit}
                >
                  {t("search.seeAll")}
                </button>
              </>
            ) : (
              <p className="nav-search__empty">
                {t("search.noResults")}
              </p>
            )}
        </div>
      )}
    </div>
  );

  return (
    <header
      className={`navbar rise-once ${sticky ? "sticky" : ""} ${elevated ? "elevated" : ""} ${
        isScrolled ? "navbar-scrolled" : ""
      }`}
    >
      <div className="nav-inner">
        <FadeIn>
          <a className="brand" href="/">
            {brand}
          </a>
        </FadeIn>
        <FadeIn>
          <div className="nav-main">
            {showSectionLinks && (
              <div className="nav-links-row">
                <nav className="nav-links">
                  <a className="nav-pill" href={buildSectionHref("grid")}>
                    {t("nav.collection")}
                  </a>
                  <a className="nav-pill" href="/shop">
                    {t("nav.shop")}
                  </a>
                  <a className="nav-pill" href="/favorites">
                    {t("nav.favourites")}
                  </a>
                  <a className="nav-pill" href="?view=ritualfinder">
                    {t("nav.finder")}
                  </a>
                  <a className="nav-pill" href="/onboarding">
                    {t("nav.ritualProfile")}
                  </a>
                  <a className="nav-pill" href="/stories">
                    {t("nav.journal")}
                  </a>
                  <a className="nav-pill" href="/ritual-guides">
                    {t("nav.guides")}
                  </a>
                  <a className="nav-pill" href="/gift-builder">
                    {t("nav.giftBuilder")}
                  </a>
                </nav>
              </div>
            )}
        {searchField}
        <a
          className={`nav-compare${compareCount === 0 ? " is-empty" : ""}`}
          href="/compare"
        >
          {t("nav.compare")}
          {compareCount > 0 ? ` (${compareCount})` : ""}
        </a>
        {navActions}
          </div>
        </FadeIn>
    </div>
  </header>
  );
}
