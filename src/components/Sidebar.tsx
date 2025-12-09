import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useCart } from "@/cart/cartStore";
import { useCompare } from "@/compare/compareStore";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useLocale, useTranslation, type AppTranslationKey } from "@/localization/locale";
import { mobileMenuGroups } from "@/config/navigation";
import { buildAppUrl, normalizeHref } from "@/utils/navigation";
import { CURRENCIES, type SupportedCurrency } from "@/currency/currencyConfig";
import { useCurrency } from "@/currency/CurrencyProvider";

export const MOBILE_DRAWER_ID = "mobile-navigation-drawer";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement | null>(null);
  const currencyOptions = CURRENCIES;
  const currencyLabel =
    currencyOptions.find((option) => option.code === currency)?.label ?? currency;
  const handleCurrencySelect = (code: SupportedCurrency) => {
    setCurrency(code);
    setCurrencyMenuOpen(false);
  };
  const { totalQuantity } = useCart();
  const compare = useCompare();
  const compareCount = compare.listCompared().length;
  const displayCount = totalQuantity ?? 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dropdownResults = useGlobalSearch(searchQuery, 5);
  const showDropdown = searchActive && searchQuery.trim().length > 0;

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchActive(false);
      }
      if (
        currencyMenuOpen &&
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(event.target as Node)
      ) {
        setCurrencyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [currencyMenuOpen]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const focusableSelector =
      "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])";

    const focusFirstItem = () => {
      const elements =
        panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [];
      elements[0]?.focus();
    };

    focusFirstItem();

    const handleKeyDown = (event: KeyboardEvent) => {
      const elements =
        panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [];
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && elements.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    if (typeof window === "undefined") return;
    setSearchActive(false);
    window.location.href = `${buildAppUrl("/search")}?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const handleResultClick = (url: string) => {
    if (typeof window === "undefined") return;
    setSearchActive(false);
    window.location.href = url;
  };

  return (
    <>
      <div className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <aside
          id={MOBILE_DRAWER_ID}
          className="drawer-panel"
          dir={locale === "ar" ? "rtl" : "ltr"}
          role="dialog"
          aria-modal={open ? "true" : undefined}
          aria-labelledby="drawer-title"
          ref={panelRef}
          aria-hidden={!open}
        >
          <div className="drawer-header">
            <h2 id="drawer-title" className="drawer-header__title">
              {t("accessibility.menu.title")}
            </h2>
            <button
              className="drawer-close"
              onClick={onClose}
              aria-label={t("accessibility.menu.close")}
            >
              ×
            </button>
          </div>
          <div
            className="drawer-search"
            ref={searchRef}
            onFocus={() => setSearchActive(true)}
          >
            <input
              type="search"
              placeholder={t("search.placeholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearchSubmit();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setSearchActive(false);
                }
              }}
              aria-label={t("search.placeholder")}
              aria-controls="drawer-search-results"
              aria-expanded={showDropdown}
            />
            {showDropdown && (
              <div
                className="drawer-search__dropdown"
                role="listbox"
                id="drawer-search-results"
                aria-label={t("accessibility.search.suggestions")}
              >
                {dropdownResults.length > 0 ? (
                  <>
                    {dropdownResults.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className="drawer-search__result"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleResultClick(entry.url)}
                        role="option"
                        aria-selected="false"
                        tabIndex={0}
                      >
                        <div>
                          <p className="drawer-search__result-title">{entry.label}</p>
                          <p className="drawer-search__result-copy">{entry.tagline}</p>
                        </div>
                        <span className="drawer-search__result-type">{entry.kind}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="drawer-search__view-all"
                      onClick={() => {
                        setSearchActive(false);
                        handleSearchSubmit();
                      }}
                    >
                      {t("search.seeAll")}
                    </button>
                  </>
                ) : (
                  <p className="drawer-search__empty">{t("search.noResults")}</p>
                )}
              </div>
            )}
          </div>
          <div className="drawer-groups">
            {mobileMenuGroups.map((group) => (
              <div key={group.id} className="drawer-group">
                <p className="drawer-group__title">{t(group.titleKey as AppTranslationKey)}</p>
                <div className="drawer-group__items">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      className="drawer-link"
                      href={normalizeHref(item.href)}
                      onClick={onClose}
                    >
                      {t(item.labelKey as AppTranslationKey)}
                      {item.id === "compare" && compareCount > 0 ? ` (${compareCount})` : ""}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="drawer-utility">
            <a
              className="drawer-link drawer-link--strong"
              href={normalizeHref("?view=cart")}
              onClick={onClose}
            >
              {t("nav.cart")}
              {displayCount > 0 ? ` (${displayCount})` : ""}
            </a>
            <div className="drawer-currency" ref={currencyMenuRef}>
              <button
                className="drawer-currency__trigger"
                type="button"
                onClick={() => setCurrencyMenuOpen((prev) => !prev)}
                aria-expanded={currencyMenuOpen}
                aria-haspopup="menu"
                aria-label={t("currency.label", { currency: currencyLabel })}
              >
                {currency}
              </button>
              {currencyMenuOpen && (
                <div className="drawer-currency__menu" role="menu">
                  {currencyOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => handleCurrencySelect(option.code)}
                      className={`drawer-currency__option${
                        currency === option.code ? " is-active" : ""
                      }`}
                      role="menuitem"
                    >
                      <span>{option.code}</span>
                      <small>{option.label}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="drawer-language"
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            >
              {locale.toUpperCase()}
            </button>
          </div>
        </aside>
      </div>
      {open && <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  );
}
