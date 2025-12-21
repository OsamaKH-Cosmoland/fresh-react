import type { FocusTagId } from "@/content/shopCatalog";

export type RitualGuideBlock =
  | {
      type: "section";
      title?: string;
      paragraphs: string[];
    }
  | {
      type: "list";
      title: string;
      items: string[];
    };

export interface RitualGuide {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  heroImage?: string;
  heroCaption?: string;
  body: RitualGuideBlock[];
  relatedProducts?: string[];
  relatedBundles?: string[];
  focusTags?: FocusTagId[];
  tags?: string[];
  featured?: boolean;
}

export const ritualGuides: RitualGuide[] = [];

export function getRitualGuideBySlug(slug: string) {
  return ritualGuides.find((guide) => guide.slug === slug);
}
