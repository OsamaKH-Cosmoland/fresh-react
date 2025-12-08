import BodyHandBalmCalmGlow from "@/assets/BodyHandBalmCalmGlow.jpg";
import SilkBlossomBodyBalm from "@/assets/SilkBlossomBodyBalm.jpg";
import HairGrowthEnhanced from "@/assets/HairGrowthEnhanced.jpg";
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

export const ritualGuides: RitualGuide[] = [
  {
    id: "guide-evening-calm",
    slug: "evening-calm-ritual-guide",
    title: "Evening Calm Routine",
    subtitle: "Slow lights, chamomile foam, and butter-soft layering for a grounded night.",
    heroImage: BodyHandBalmCalmGlow,
    heroCaption: "Settle into each intentional stroke.",
    body: [
      {
        type: "section",
        title: "Set the tone",
        paragraphs: [
          "Dim the lights, soften the playlist, and breathe through three cycles before the first touch.",
          "Warm Calm & Glow Body Soap between your palms until it turns to cloud—lather from neck to toes so the chamomile can whisper calm.",
        ],
      },
      {
        type: "list",
        title: "Routine steps",
        items: [
          "Start with the facial nod to the day (inhale, exhale) before the first rinse.",
          "Use circular motions with the soap until skin feels plush, then rinse with cool water to close the pores.",
          "Press Body Balm into damp skin, working from calves upward, finishing with palms and wrists.",
          "Layer Hand Balm as the final touch, breathing in the warm citrus and botanical glow.",
        ],
      },
      {
        type: "section",
        title: "Finish with intention",
        paragraphs: [
          "Let the balm settle for a full minute before slipping into linens—carry the calm into your dreams.",
          "This routine pairs beautifully with a cup of chamomile tea or a short journaling pause before bed.",
        ],
      },
    ],
    relatedProducts: ["calm-glow-body-soap", "body-balm", "hand-balm"],
    relatedBundles: ["evening-calm-ritual"],
    focusTags: ["body"],
    tags: ["Evening routine", "Slow care"],
    featured: true,
  },
  {
    id: "guide-glow-hydrate",
    slug: "glow-and-hydrate-guide",
    title: "Glow & Hydrate Routine",
    subtitle: "Polish the skin, capture dew, and wear luminosity all day.",
    heroImage: SilkBlossomBodyBalm,
    heroCaption: "Layers that reflect candlelight.",
    body: [
      {
        type: "section",
        title: "Wake the skin",
        paragraphs: [
          "Start with Silk Blossom Body Soap—gently massage to encourage blood flow while the silky bar slides across damp skin.",
          "Rinse with cool water, then gently pat dry to keep the surface slightly damp for the butter phase.",
        ],
      },
      {
        type: "list",
        title: "Layering notes",
        items: [
          "Glide Body Balm over the torso in sweeping outward strokes, moving slowly so it has time to melt into the skin.",
          "Address knees, elbows, and heels with concentrated pressure, then breathe into the glow.",
          "Use circular palms to blend, pausing at the clavicle for an elegant finish.",
        ],
      },
      {
        type: "section",
        title: "Carry the radiance",
        paragraphs: [
          "This routine lets the skin glow without glitter—just a hint of mica and lush hydration.",
          "Pair with a silk robe or linen wrap to keep the moisture sealed and the moment ceremonial.",
        ],
      },
    ],
    relatedProducts: ["silk-blossom-body-soap", "body-balm"],
    relatedBundles: ["glow-hydrate-duo"],
    focusTags: ["body"],
    tags: ["Morning routine", "Glow"],
    featured: true,
  },
  {
    id: "guide-hair-strength",
    slug: "strengthening-hair-ritual",
    title: "Strengthening Hair Routine",
    subtitle: "Root-to-tip fortification with rosemary stem cells and silk-like oils.",
    heroImage: HairGrowthEnhanced,
    heroCaption: "The routine for resilient, luminous strands.",
    body: [
      {
        type: "section",
        title: "Prepare the canvas",
        paragraphs: [
          "Start with clean, damp hair. Use a wide-tooth comb to eliminate knots; friction is the enemy of shine.",
          "Apply a pea-sized drop of Hair Growth Oil to the scalp, massaging slowly to awaken circulation.",
        ],
      },
      {
        type: "list",
        title: "Finish with polish",
        items: [
          "Spread Hair Shine & Anti-Frizz Oil between your palms and glide over mid-lengths to ends.",
          "Hold each strand to the light and roll it through your fingers for instant gloss.",
          "Let the oils breathe; avoid brushing immediately to keep the seal intact.",
        ],
      },
      {
        type: "section",
        title: "The routine effect",
        paragraphs: [
          "The blend of rosemary, biotin, and silk proteins keeps strands strong yet soft.",
          "Complete the moment with a soft cloth wrap or gentle head massage.",
        ],
      },
    ],
    relatedProducts: ["hair-growth-oil", "hair-shine-anti-frizz-oil"],
    relatedBundles: ["hair-strength-ritual"],
    focusTags: ["hair"],
    tags: ["Hair routine", "Strength"],
  },
];

export function getRitualGuideBySlug(slug: string) {
  return ritualGuides.find((guide) => guide.slug === slug);
}
