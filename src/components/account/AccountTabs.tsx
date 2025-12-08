import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "@/localization/locale";

export interface AccountTab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface AccountTabsProps {
  tabs: AccountTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function AccountTabs({ tabs, activeTab, onTabChange }: AccountTabsProps) {
  const { t } = useTranslation();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const total = tabs.length;
    if (total === 0) return;
    const normalized = (index + total) % total;
    tabRefs.current[normalized]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(index + 1);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(index - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTabChange(tabs[index].id);
    }
  };

  return (
    <nav
      className="account-tabs"
      role="tablist"
      aria-label={t("accessibility.tabs.account")}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            className={`account-tab ${isActive ? "is-active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            aria-selected={isActive}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            aria-controls={`account-panel-${tab.id}`}
            id={`account-tab-${tab.id}`}
          >
            {tab.icon && <span className="account-tab__icon">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
