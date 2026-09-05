/**
 * Central image registry.
 *
 * Every bundled image is imported once here through vite-imagetools, which
 * generates AVIF/WebP/JPEG variants at build time. Nothing is committed: the
 * variants are derived from the source files on every build, so they cannot
 * drift out of sync the way a checked-in conversion would.
 *
 * The exported `img.src` (the largest JPEG/WebP variant) is what the rest of the
 * app passes around as a plain string, so existing `heroImage: string` contracts
 * are unchanged. `pictureFor()` maps that string back to its variants, which is
 * how <Picture> resolves a srcset without every caller having to thread one
 * through.
 *
 * Width ladders are sized to real usage, measured at 412x823 (the viewport
 * PageSpeed emulates) and doubled for DPR 2:
 *   - product/bundle photography renders 196-234 CSS px in cards and up to
 *     ~640 px on wide detail views  -> 320/480/800/1280
 *   - collection.jpg is the hero and is only 1024 px wide at source -> capped there
 *   - the gold value icons are pinned to 72x72 by CSS            -> 72/144/216
 *
 * The three icons carry alpha, so they get AVIF + WebP only; a JPEG fallback
 * would drop transparency.
 */

import bodyBalmEnhanced1 from "./BodyBalmEnhanced1.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import bodyHandBalmCalmGlow from "./BodyHandBalmCalmGlow.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import bodySoap1 from "./BodySoap1.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import bodySoap2 from "./BodySoap2.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import hairGrowthEnhanced from "./HairGrowthEnhanced.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import hairGrowthShine from "./HairGrowthShine.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import hairShineEnhanced from "./HairShineEnhanced.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import handBalmEnhanced from "./HandBalmEnhanced.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import handLipBalm from "./HandLipBalm.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import lipBalm from "./LipBalm.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import silkBlossomBodyBalm from "./SilkBlossomBodyBalm.jpg?w=320;480;800;1280&format=avif;webp;jpg&as=picture";
import collection from "./collection.jpg?w=320;480;800;1024&format=avif;webp;jpg&as=picture";
import logo from "./Logo.webp?w=120&format=avif;webp&as=picture";
import iconLeft from "./NaturaGloss_shiny_gold_icon_left.webp?w=72;144;216&format=avif;webp&as=picture";
import iconMiddle from "./NaturaGloss_shiny_gold_icon_middle.webp?w=72;144;216&format=avif;webp&as=picture";
import iconRight from "./NaturaGloss_shiny_gold_icon_right.webp?w=72;144;216&format=avif;webp&as=picture";

export interface Picture {
  /** format key ("avif" | "webp" | "jpeg") -> full srcset string */
  sources: Record<string, string>;
  /** fallback <img>: largest generated variant, plus its intrinsic dimensions */
  img: { src: string; w: number; h: number };
}

export const PICTURES = {
  BodyBalmEnhanced1: bodyBalmEnhanced1,
  BodyHandBalmCalmGlow: bodyHandBalmCalmGlow,
  BodySoap1: bodySoap1,
  BodySoap2: bodySoap2,
  HairGrowthEnhanced: hairGrowthEnhanced,
  HairGrowthShine: hairGrowthShine,
  HairShineEnhanced: hairShineEnhanced,
  HandBalmEnhanced: handBalmEnhanced,
  HandLipBalm: handLipBalm,
  LipBalm: lipBalm,
  SilkBlossomBodyBalm: silkBlossomBodyBalm,
  collection,
  Logo: logo,
  iconLeft,
  iconMiddle,
  iconRight,
} satisfies Record<string, Picture>;

export type ImageId = keyof typeof PICTURES;

const BY_SRC = new Map<string, Picture>(
  Object.values(PICTURES).map((picture) => [picture.img.src, picture])
);

/** The plain URL string for an image, for callers that only hold a `string`. */
export function imageUrl(id: ImageId): string {
  return PICTURES[id].img.src;
}

/** Resolve a URL produced by imageUrl() back to its generated variants. */
export function pictureFor(src: string | undefined | null): Picture | undefined {
  return src ? BY_SRC.get(src) : undefined;
}

/**
 * `sizes` presets, keyed by layout context. These describe how wide the image
 * actually renders, so the browser can pick the right srcset entry -- without
 * one it assumes 100vw and over-fetches. Values are measured from the live
 * layout at 412x823 and rounded up, since over-fetching slightly is safe but
 * under-fetching shows a visibly soft image.
 */
export const SIZES = {
  /** landing hero figure: width: min(640px, 92%) */
  hero: "(max-width: 700px) 80vw, 640px",
  /** .card-grid cells: repeat(auto-fit, minmax(260px, 1fr)) */
  card: "(max-width: 700px) 60vw, 320px",
  /** .bundle-grid cells: repeat(auto-fit, minmax(280px, 1fr)), fixed 180px tall */
  bundle: "(max-width: 700px) 55vw, 300px",
  /** dense two-up tiles inside personalization / compare rails */
  tile: "(max-width: 700px) 45vw, 240px",
  /** full-width feature image on detail pages */
  banner: "(max-width: 900px) 92vw, 720px",
  /** .landing-values icons, pinned to 72x72 by CSS */
  icon: "72px",
} as const;
