import type { ReactNode } from "react";

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
  return (
    <nav className="account-tabs" aria-label="Account sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`account-tab ${tab.id === activeTab ? "is-active" : ""}`}
          onClick={() => onTabChange(tab.id)}
          aria-selected={tab.id === activeTab}
          role="tab"
        >
          {tab.icon && <span className="account-tab__icon">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
