import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { FadeIn } from "@/components/animate";
import { useCart } from "@/cart/cartStore";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useCompare } from "@/compare/compareStore";
import { useLocale, useTranslation, type AppTranslationKey } from "@/localization/locale";
import { primaryNav, exploreNav } from "@/config/navigation";
import { buildAppUrl, normalizeHref } from "@/utils/navigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

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
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement | null>(null);
  const exploreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const exploreMenuRef = useRef<HTMLDivElement | null>(null);
  const exploreItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [highlightedExploreIndex, setHighlightedExploreIndex] = useState(-1);
  const highlightedExploreIndexRef = useRef(-1);
  const { totalQuantity } = useCart();
  const compare = useCompare();
  const compareCount = compare.listCompared().length;
  const displayCount = totalQuantity ?? cartCount;
  const itemLabel = displayCount === 1 ? "item" : "items";
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();

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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchActive(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!showDropdown) {
      setSearchHighlightIndex(-1);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (searchHighlightIndex >= 0) {
      searchResultRefs.current[searchHighlightIndex]?.focus();
    }
  }, [searchHighlightIndex]);

  useEffect(() => {
    if (dropdownResults.length === 0) {
      setSearchHighlightIndex(-1);
    } else if (searchHighlightIndex >= dropdownResults.length) {
      setSearchHighlightIndex(0);
    }
  }, [dropdownResults.length, searchHighlightIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const focusExploreItem = (index: number) => {
    const count = exploreNav.length;
    if (!count) return;
    const normalized = (index + count) % count;
    setHighlightedExploreIndex(normalized);
  };

  useEffect(() => {
    if (!exploreOpen) {
      setHighlightedExploreIndex(-1);
      return;
    }
    setHighlightedExploreIndex(0);
    const frame = requestAnimationFrame(() => {
      exploreItemRefs.current[0]?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [exploreOpen]);

  useEffect(() => {
    highlightedExploreIndexRef.current = highlightedExploreIndex;
  }, [highlightedExploreIndex]);

  useEffect(() => {
    if (!exploreOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (!exploreMenuRef.current?.contains(document.activeElement)) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setExploreOpen(false);
        exploreTriggerRef.current?.focus();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusExploreItem(
          highlightedExploreIndexRef.current >= 0
            ? highlightedExploreIndexRef.current + 1
            : 0
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusExploreItem(
          highlightedExploreIndexRef.current >= 0
            ? highlightedExploreIndexRef.current - 1
            : -1
        );
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [exploreOpen]);

  const dropdownResults = useGlobalSearch(searchQuery, 5);
  const showDropdown = searchActive && searchQuery.trim().length > 0;
  const [searchHighlightIndex, setSearchHighlightIndex] = useState(-1);
  const searchResultRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "";

  const handleResultClick = (url: string) => {
    if (typeof window === "undefined") return;
    setSearchActive(false);
    setSearchHighlightIndex(-1);
    window.location.href = url;
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    if (typeof window === "undefined") return;
    setSearchHighlightIndex(-1);
    setSearchActive(false);
    window.location.href = `${buildAppUrl("/search")}?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const handleCartClick = () => {
    if (onCartOpen) {
      onCartOpen();
      return;
    }
    window.location.href = normalizeHref("?view=cart");
  };

  const moveSearchHighlight = (delta: number) => {
    if (dropdownResults.length === 0) {
      return;
    }
    setSearchHighlightIndex((previous) => {
      if (previous === -1) {
        return delta > 0 ? 0 : dropdownResults.length - 1;
      }
      const next = (previous + delta + dropdownResults.length) % dropdownResults.length;
      return next;
    });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSearchHighlight(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSearchHighlight(-1);
      return;
    }
    if (event.key === "Escape") {
      setSearchActive(false);
      setSearchHighlightIndex(-1);
      return;
    }
    if (event.key === "Enter") {
      if (searchHighlightIndex >= 0) {
        event.preventDefault();
        const highlighted = dropdownResults[searchHighlightIndex];
        if (highlighted) {
          handleResultClick(highlighted.url);
        }
        setSearchHighlightIndex(-1);
        setSearchActive(false);
        return;
      }
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleExploreTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setExploreOpen((prev) => !prev);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!exploreOpen) {
        setExploreOpen(true);
        return;
      }
      focusExploreItem(
        highlightedExploreIndexRef.current >= 0 ? highlightedExploreIndexRef.current + 1 : 0
      );
    }
  };

  const renderSearchField = () => (
    <div ref={searchContainerRef} className="nav-search nav-search--inline">
      <span className="nav-search__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M15 15l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        placeholder={t("search.placeholder")}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onFocus={() => setSearchActive(true)}
        onKeyDown={handleSearchKeyDown}
        aria-label={t("search.placeholder")}
        aria-controls="nav-search-results"
        aria-expanded={showDropdown}
        aria-activedescendant={
          searchHighlightIndex >= 0 ? `nav-search-result-${searchHighlightIndex}` : undefined
        }
      />
      {showDropdown && (
        <div
          className="nav-search__dropdown"
          role="listbox"
          id="nav-search-results"
          aria-label={t("accessibility.search.suggestions")}
        >
          {dropdownResults.length > 0 ? (
            <>
              {dropdownResults.map((entry, index) => {
                const isActive = searchHighlightIndex === index;
                return (
                  <button
                    type="button"
                    key={entry.id}
                    id={`nav-search-result-${index}`}
                    role="option"
                    aria-selected={isActive}
                    tabIndex={-1}
                    className={`nav-search__result${isActive ? " is-active" : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleResultClick(entry.url)}
                    ref={(element) => {
                      searchResultRefs.current[index] = element;
                    }}
                  >
                    <div>
                      <p className="nav-search__result-title">{entry.label}</p>
                      <p className="nav-search__result-copy">{entry.tagline}</p>
                    </div>
                    <span className="nav-search__result-type">{entry.kind}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="nav-search__view-all"
                onClick={() => {
                  setSearchActive(false);
                  setSearchHighlightIndex(-1);
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
                <nav className="nav-primary" aria-label={t("accessibility.mainNavigation")}>
                  {primaryNav.map((item) => {
                    const href = normalizeHref(item.href);
                    const isActive = href === currentPath;
                    return (
                      <a
                        key={item.id}
                        className="nav-pill"
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {t(item.labelKey as AppTranslationKey)}
                      </a>
                    );
                  })}
                  <div
                    className={`nav-explore ${exploreOpen ? "is-open" : ""}`}
                    ref={exploreRef}
                    aria-hidden={!exploreOpen}
                  >
                    <button
                      type="button"
                      className="nav-pill nav-explore__trigger"
                      ref={exploreTriggerRef}
                      onClick={() => setExploreOpen((prev) => !prev)}
                      onKeyDown={handleExploreTriggerKeyDown}
                      aria-expanded={exploreOpen}
                      aria-haspopup="menu"
                      aria-controls="explore-menu"
                      aria-label={t("nav.explore")}
                    >
                      {t("nav.explore")}
                      <span className="nav-explore__chevron" aria-hidden="true">
                        ▼
                      </span>
                    </button>
                    {exploreOpen && (
                      <div
                        className="nav-explore__menu"
                        ref={exploreMenuRef}
                        role="menu"
                        id="explore-menu"
                        aria-label={t("nav.explore")}
                        aria-hidden={!exploreOpen}
                      >
                        {exploreNav.map((item, index) => (
                          <a
                            key={item.id}
                            className="nav-explore__link"
                            href={normalizeHref(item.href)}
                            role="menuitem"
                            tabIndex={-1}
                            aria-selected={highlightedExploreIndex === index}
                            onClick={() => {
                              setExploreOpen(false);
                              setHighlightedExploreIndex(-1);
                            }}
                            ref={(element) => {
                              exploreItemRefs.current[index] = element;
                            }}
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
            {renderSearchField()}
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
              {!isOnline && (
                <span className="nav-offline-indicator" aria-live="polite">
                  {t("offline.status")}
                </span>
              )}
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
              aria-label={t("accessibility.menu.open")}
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
