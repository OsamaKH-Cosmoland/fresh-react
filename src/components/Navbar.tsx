import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { FadeIn } from "@/components/animate";
import { useCart } from "@/cart/cartStore";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useCompare } from "@/compare/compareStore";
import { useLocale, useTranslation, type AppTranslationKey } from "@/localization/locale";
import { primaryNav, exploreNav } from "@/config/navigation";
import { buildAppUrl, normalizeHref } from "@/utils/navigation";

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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement | null>(null);
  const { totalQuantity } = useCart();
  const compare = useCompare();
  const compareCount = compare.listCompared().length;
  const displayCount = totalQuantity ?? cartCount;
  const itemLabel = displayCount === 1 ? "item" : "items";
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

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
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dropdownResults = useGlobalSearch(searchQuery, 5);
  const showDropdown = searchActive && searchQuery.trim().length > 0;

  const handleResultClick = (url: string) => {
    if (typeof window === "undefined") return;
    window.location.href = url;
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    if (typeof window === "undefined") return;
    window.location.href = `${buildAppUrl("/search")}?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const handleCartClick = () => {
    if (onCartOpen) {
      onCartOpen();
      return;
    }
    window.location.href = normalizeHref("?view=cart");
  };

  const handleSearchToggle = () => {
    setSearchActive((prev) => !prev);
  };

  useEffect(() => {
    if (searchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchActive]);

  const renderSearchField = () => (
    <div
      ref={searchRef}
      className="nav-search nav-search--overlay"
      role="dialog"
      aria-modal="true"
    >
      <input
        ref={inputRef}
        type="search"
        placeholder={t("search.placeholder")}
        value={searchQuery}
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
                  onClick={() => {
                    setSearchActive(false);
                    handleResultClick(entry.url);
                  }}
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
                onClick={() => {
                  setSearchActive(false);
                  handleSearchSubmit();
                }}
              >
                {t("search.seeAll")}
              </button>
            </>
          ) : (
            <p className="nav-search__empty">{t("search.noResults")}</p>
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
          <div className="nav-bar">
            <div className="nav-bar__brand">
              <a className="brand" href="/">
                {brand}
              </a>
            </div>
            {showSectionLinks && (
              <div className="nav-bar__primary">
                <nav className="nav-primary" aria-label={t("nav.explore")}>
                  {primaryNav.map((item) => (
                    <a
                      key={item.id}
                      className="nav-pill"
                      href={normalizeHref(item.href)}
                    >
                      {t(item.labelKey as AppTranslationKey)}
                    </a>
                  ))}
                  <div
                    className={`nav-explore ${exploreOpen ? "is-open" : ""}`}
                    ref={exploreRef}
                  >
                    <button
                      type="button"
                      className="nav-pill nav-explore__trigger"
                      onClick={() => setExploreOpen((prev) => !prev)}
                      aria-expanded={exploreOpen}
                      aria-haspopup="menu"
                    >
                      {t("nav.explore")}
                      <span className="nav-explore__chevron" aria-hidden="true">
                        ▼
                      </span>
                    </button>
                    {exploreOpen && (
                      <div className="nav-explore__menu">
                        {exploreNav.map((item) => (
                          <a
                            key={item.id}
                            className="nav-explore__link"
                            href={normalizeHref(item.href)}
                          >
                            {t(item.labelKey as AppTranslationKey)}
                            {item.id === "compare" && compareCount > 0
                              ? ` (${compareCount})`
                              : ""}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </nav>
              </div>
            )}
            <div className="nav-bar__actions">
              <div className="nav-search-trigger">
                <button
                  type="button"
                  className="nav-search-button"
                  onClick={handleSearchToggle}
                  aria-label={t("search.placeholder")}
                >
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M15 15l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                {searchActive && renderSearchField()}
              </div>
              <div className="nav-utility-links">
                <Button
                  variant="ghost"
                  size="sm"
                  className="nav-language"
                  onClick={() => setLocale(locale === "en" ? "ar" : "en")}
                  aria-label={`Switch to ${locale === "en" ? "AR" : "EN"}`}
                >
                  {locale.toUpperCase()}
                </Button>
              </div>
              <Button
                variant="secondary"
                className="nav-cart nav-cart--desktop"
                size="md"
                onClick={handleCartClick}
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
            </div>
            <div className="nav-mobile-actions">
              <Button
                variant="secondary"
                className="nav-cart nav-cart--mobile"
                size="md"
                onClick={handleCartClick}
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
                <span className="nav-cart__count">{displayCount}</span>
              </Button>
              <button
                className="nav-mobile-actions__menu"
                aria-label="Open menu"
                onClick={onMenuToggle}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </header>
  );
}
