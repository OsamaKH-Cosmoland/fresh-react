import { imageUrl } from "@/assets/images";

const HERO_IMAGES: Record<string, string> = {
  "evening-calm-ritual": imageUrl("BodyHandBalmCalmGlow"),
  "glow-hydrate-duo": imageUrl("SilkBlossomBodyBalm"),
  "hair-strength-ritual": imageUrl("HairGrowthShine"),
  "hands-lips-care-set": imageUrl("HandLipBalm"),
  "ultimate-bundle": imageUrl("collection"),
};

export function getBundleHeroImage(id: string) {
  return HERO_IMAGES[id];
}
