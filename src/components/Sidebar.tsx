import { useEffect, useRef, useState } from "react";
import { useCart } from "@/cart/cartStore";
import { useCompare } from "@/compare/compareStore";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useLocale, useTranslation, type AppTranslationKey } from "@/localization/locale";
import { mobileMenuGroups } from "@/config/navigation";
import { buildAppUrl, normalizeHref } from "@/utils/navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { totalQuantity } = useCart();
  const compare = useCompare();
  const compareCount = compare.listCompared().length;
  const displayCount = totalQuantity ?? 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const dropdownResults = useGlobalSearch(searchQuery, 5);
  const showDropdown = searchActive && searchQuery.trim().length > 0;

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchActive(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    if (typeof window === "undefined") return;
    window.location.href = `${buildAppUrl("/search")}?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const handleResultClick = (url: string) => {
    if (typeof window === "undefined") return;
    window.location.href = url;
  };

  return (
    <>
      <div className={`drawer ${open ? "open" : ""}`}>
        <aside className="drawer-panel" dir={locale === "ar" ? "rtl" : "ltr"}>
          <div className="drawer-header">
            <button className="drawer-close" onClick={onClose} aria-label="Close menu">
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
              }}
            />
            {showDropdown && (
              <div className="drawer-search__dropdown">
                {dropdownResults.length > 0 ? (
                  <>
                    {dropdownResults.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className="drawer-search__result"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleResultClick(entry.url)}
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
                      onClick={handleSearchSubmit}
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
