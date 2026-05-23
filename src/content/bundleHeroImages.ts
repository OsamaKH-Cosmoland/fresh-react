import bodyHandBalmCalmGlow from "@/assets/BodyHandBalmCalmGlow.jpg";
import collectionImage from "@/assets/collection.png";
import glowDuoImage from "@/assets/SilkBlossomBodyBalm.jpg";
import hairGrowthShine from "@/assets/HairGrowthShine.jpg";
import handLipBalmImage from "@/assets/HandLipBalm.jpg";

const HERO_IMAGES: Record<string, string> = {
  "evening-calm-ritual": bodyHandBalmCalmGlow,
  "glow-hydrate-duo": glowDuoImage,
  "hair-strength-ritual": hairGrowthShine,
  "hands-lips-care-set": handLipBalmImage,
  "ultimate-bundle": collectionImage,
};

export function getBundleHeroImage(id: string) {
  return HERO_IMAGES[id];
}
