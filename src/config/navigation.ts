export interface NavItem {
  id: string;
  labelKey: string;
  href: string;
  external?: boolean;
}

export interface NavGroup {
  id: string;
  titleKey: string;
  items: NavItem[];
}

export const primaryNav: NavItem[] = [
  { id: "collection", labelKey: "nav.collection", href: "#grid" },
  { id: "shop", labelKey: "nav.shop", href: "/shop" },
  { id: "finder", labelKey: "nav.finder", href: "?view=ritualfinder" },
  { id: "gift-builder", labelKey: "nav.giftBuilder", href: "/gift-builder" },
  { id: "guides", labelKey: "nav.guides", href: "/ritual-guides" },
];

export const exploreNav: NavItem[] = [
  { id: "routine-profile", labelKey: "sections.ritualProfile", href: "/onboarding" },
  { id: "journal", labelKey: "nav.journal", href: "/stories" },
  { id: "ritual-coach", labelKey: "nav.ritualCoach", href: "/ritual-coach" },
  { id: "favorites", labelKey: "nav.favourites", href: "/favorites" },
  { id: "compare", labelKey: "nav.compare", href: "/compare" },
  { id: "orders", labelKey: "nav.orders", href: "/orders-history" },
  { id: "account", labelKey: "nav.account", href: "/account" },
  { id: "audience", labelKey: "nav.audience", href: "/audience" },
];

export const mobileMenuGroups: NavGroup[] = [
  {
    id: "shop",
    titleKey: "nav.mobile.sections.shop",
    items: primaryNav,
  },
  {
    id: "explore",
    titleKey: "nav.explore",
    items: exploreNav,
  },
];
