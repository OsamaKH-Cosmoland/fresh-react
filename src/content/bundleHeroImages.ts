import bodyHandBalmCalmGlow from "@/assets/BodyHandBalmCalmGlow.jpg";
import glowDuoImage from "@/assets/SilkBlossomBodyBalm.jpg";
import hairGrowthShine from "@/assets/HairGrowthShine.jpg";
import handLipBalmImage from "@/assets/HandLipBalm.jpg";

const HERO_IMAGES: Record<string, string> = {
  "evening-calm-ritual": bodyHandBalmCalmGlow,
  "glow-hydrate-duo": glowDuoImage,
  "hair-strength-ritual": hairGrowthShine,
  "hands-lips-care-set": handLipBalmImage,
};

export function getBundleHeroImage(id: string) {
  return HERO_IMAGES[id];
}
