import type { FocusTagId } from "@/content/shopCatalog";
import { shopCatalog } from "@/content/shopCatalog";

type BaseSearchEntry = {
  id: string;
  label: string;
  tagline: string;
  focus: FocusTagId[];
  url: string;
};

export type SearchEntry =
  | (BaseSearchEntry & { kind: "product"; slug: string })
  | (BaseSearchEntry & { kind: "bundle"; bundleId: string })
  | (BaseSearchEntry & { kind: "experience"; experienceId: string });

const EXPERIENCES: Array<SearchEntry & { kind: "experience" }> = [
  {
    kind: "experience",
    experienceId: "ritual-finder",
    id: "ritual-finder",
    label: "Ritual Finder",
    tagline: "Answer a few questions and we’ll guide you to the ritual that best fits tonight.",
    focus: [],
    url: "/ritual-finder",
  },
  {
    kind: "experience",
    experienceId: "shop",
    id: "shop",
    label: "Shop all rituals & products",
    tagline: "Browse every product and bundle in one calm, curated space.",
    focus: [],
    url: "/shop",
  },
];

export const searchEntries: SearchEntry[] = [
  ...shopCatalog.map((entry) => {
    if (entry.kind === "product") {
      return {
        kind: "product" as const,
        id: entry.item.productId,
        slug: entry.item.slug,
        label: entry.item.productName,
        tagline: entry.item.shortTagline,
        focus: entry.focus,
        url: `/products/${entry.item.slug}`,
      };
    }
    return {
      kind: "bundle" as const,
      id: entry.item.id,
      bundleId: entry.item.id,
      label: entry.item.name,
      tagline: entry.item.tagline,
      focus: entry.focus,
      url: "/shop",
    };
  }),
  ...EXPERIENCES,
];
