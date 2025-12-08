import bodyBalmImage from "@/assets/BodyBalmEnhanced1.jpg";
import bodySoapOne from "@/assets/BodySoap1.jpg";
import bodySoapTwo from "@/assets/BodySoap2.png";
import handBalmImage from "@/assets/HandBalmEnhanced.jpg";
import hairGrowthImage from "@/assets/HairGrowthEnhanced.jpg";
import hairShineImage from "@/assets/HairShineEnhanced.jpg";
import type {
  FAQItem,
  IngredientHighlight,
  Pairing,
  ProductDetailLayoutProps,
  ProductVariant,
  RitualStep,
} from "@/components/product/ProductDetailLayout";

export interface ProductDetailContent extends Omit<ProductDetailLayoutProps, "onAddToBag" | "heroActions"> {
  slug: string;
  productId: string;
  priceNumber: number;
  variants?: ProductVariant[];
  defaultVariantId?: string;
}

const createPairings = (items: Pairing[]): Pairing[] => items;

export const PRODUCT_DETAIL_CONFIGS: ProductDetailContent[] = [
  {
    slug: "body-balm",
    productId: "body-balm",
    productName: "Body Balm",
    shortTagline: "Deep moisture for skin that craves calm.",
    priceLabel: "197.99 EGP",
    priceNumber: 197.99,
    variants: [
      {
        variantId: "body-balm-lavender",
        label: "Lavender Bloom",
        priceLabel: "197.99 EGP",
        priceNumber: 197.99,
        attributes: {
          scent: "Lavender",
          size: "50 ml",
        },
      },
      {
        variantId: "body-balm-unscented",
        label: "Unscented Calm",
        priceLabel: "195.99 EGP",
        priceNumber: 195.99,
        attributes: {
          scent: "Unscented",
          size: "50 ml",
        },
      },
      {
        variantId: "body-balm-silk",
        label: "Silk Blossom Veil",
        priceLabel: "199.99 EGP",
        priceNumber: 199.99,
        attributes: {
          scent: "Silk Blossom",
          size: "50 ml",
        },
      },
    ],
    defaultVariantId: "body-balm-lavender",
    heroSummaryBullets: [
      "Locks in long-lasting hydration without feeling greasy.",
      "Softens rough areas like elbows, knees, and hands.",
      "Wraps your body in a quiet, comforting ritual at the end of the day.",
    ],
    heroImage: bodyBalmImage,
    whatItsMadeFor:
      "Dry, tired skin needs a peaceful interlude—our butter blend cushions, seals, and shields without the weight of heavy oils.",
    ritualSteps: [
      { title: "Warm", description: "Warm a small amount between palms until the texture melts into oil." },
      {
        title: "Press",
        description: "Gently press into arms, legs, elbows, knees, and any rough patches for even coverage.",
      },
      {
        title: "Massage",
        description: "Use slow, upward strokes, letting the balm deeply sink in before layering on clothing.",
      },
      {
        title: "Repeat where needed",
        description: "Boost the ritual on heels, hands, and shoulders before bed for extra calm.",
      },
    ],
    ingredients: [
      { name: "Cocoa Butter", description: "Protective and occlusive, it locks in moisture and softens rough areas." },
      { name: "Shea Butter", description: "Deeply nourishing and comforting for dry, sensitive skin." },
      { name: "Sweet Almond Oil", description: "Replenishing and silky, it keeps skin smooth and supple." },
      { name: "Vitamin E", description: "Supports the skin barrier while providing gentle antioxidant care." },
    ],
    sensoryExperience: [
      "Rich in the jar, melts into a silky oil when warmed.",
      "Absorbs to a comfortable, non-sticky finish.",
      "Scent is soft, designed to support evening wind-down rather than overpower.",
    ],
    pairsWellWith: createPairings([
      { name: "Calm & Glow Body Soap", slug: "/products/calm-glow-body-soap" },
      { name: "Hand Balm", slug: "/products/hand-balm" },
      { name: "Silk Blossom Body Soap", slug: "/products/silk-blossom-body-soap" },
    ]),
    faq: [
      {
        question: "Can I use Body Balm daily?",
        answer: "Yes, apply once or twice daily after cleansing to keep your skin deeply nourished.",
      },
      {
        question: "Is it greasy?",
        answer: "It melts into a silky oil that absorbs quickly, leaving no sticky residue.",
      },
      {
        question: "Can I layer it on hands and feet?",
        answer: "Absolutely—focus extra balm on hands, heels, or elbows before bed for soft renewal.",
      },
      {
        question: "Is it safe for sensitive skin?",
        answer: "Formulated with gentle botanicals and no harsh synthetics, it is soothing even on sensitive skin.",
      },
    ],
  },
  {
    slug: "calm-glow-body-soap",
    productId: "calm-glow-body-soap",
    productName: "Calm & Glow Body Soap",
    shortTagline: "Chamomile serenity for luminous skin.",
    priceLabel: "228.99 EGP",
    priceNumber: 228.99,
    heroSummaryBullets: [
      "Creamy chamomile lather comforts skin while polishing the surface.",
      "Removes impurities without stripping natural oils.",
      "Builds a gentle glow so skin feels settled before ritual steps.",
    ],
    heroImage: bodySoapOne,
    whatItsMadeFor:
      "Crafted for unsettled, reactive skin, the blend calms and restores balance while the micro-pearl glow leaves a whisper of radiance.",
    ritualSteps: [
      {
        title: "Lather",
        description: "Work the bar into a rich lather on damp skin or a washcloth.",
      },
      {
        title: "Cleanse",
        description: "Gently massage from shoulders downward, letting the botanicals soothe.",
      },
      {
        title: "Glow",
        description: "Rinse, pat lightly, and follow with the Body Balm ritual to seal in calm.",
      },
    ],
    ingredients: [
      {
        name: "Chamomile",
        description: "Soothes redness while easing the senses with floral warmth.",
      },
      {
        name: "Neroli",
        description: "Brightens the skin and infuses a gentle, uplifting aroma.",
      },
      {
        name: "Aloe Vera",
        description: "Adds cooling hydration to keep the skin softly softened.",
      },
      {
        name: "Mica Pearls",
        description: "Deliver a barely-there glow that reflects candlelight.",
      },
    ],
    sensoryExperience: [
      "Creates a creamy foam that smells like a tranquil boudoir.",
      "Skin feels clean yet never tight.",
      "Leaves behind a soft, warming finish that invites follow-up care.",
    ],
    pairsWellWith: createPairings([
      { name: "Body Balm", slug: "/products/body-balm" },
      { name: "Hand Balm", slug: "/products/hand-balm" },
      { name: "Silk Blossom Body Soap", slug: "/products/silk-blossom-body-soap" },
    ]),
    faq: [
      {
        question: "Will this brighten my skin immediately?",
        answer: "Yes—the mica pearls deliver instant warmth without glittery residue.",
      },
      {
        question: "Is it safe for sensitive skin?",
        answer: "Chamomile and aloe make it soothing even for reactive complexions.",
      },
      {
        question: "How often can I use it?",
        answer: "Daily, morning or night, whenever you want a comforting cleanse.",
      },
    ],
  },
  {
    slug: "silk-blossom-body-soap",
    productId: "silk-blossom-body-soap",
    productName: "Silk Blossom Body Soap",
    shortTagline: "Velvety jasmine for moments that bloom.",
    priceLabel: "231.99 EGP",
    priceNumber: 231.99,
    heroSummaryBullets: [
      "Jasmine petals and silk proteins soften as you cleanse.",
      "Creates an elegant foam that rinses away effortlessly.",
      "Designed to lift the senses with a floral finish.",
    ],
    heroImage: bodySoapTwo,
    whatItsMadeFor:
      "For those who linger by candlelight—this soap cleanses with soft silkiness and a floral veil that keeps skin feeling poised.",
    ritualSteps: [
      {
        title: "Bloom",
        description: "Wet skin, then glide the bar across damp palms or a pouf.",
      },
      {
        title: "Sculpt",
        description: "Massage gently in sweeping motions to awaken circulation.",
      },
      {
        title: "Rinse",
        description: "Rinse with cool water, then follow with the Body Balm for finish.",
      },
    ],
    ingredients: [
      {
        name: "Jasmine",
        description: "Orders a floral softness while calming the senses.",
      },
      {
        name: "Silk Proteins",
        description: "Deliver a luxurious glide and protective film.",
      },
      {
        name: "Rice Bran Oil",
        description: "Nourishes without heaviness.",
      },
      {
        name: "Vitamin B5",
        description: "Helps maintain suppleness and resilience.",
      },
    ],
    sensoryExperience: [
      "The petals release a soft floral mist as you lather.",
      "Rinses with a polished, satin finish.",
      "Scent lingers but never feels overpowering.",
    ],
    pairsWellWith: createPairings([
      { name: "Hand Balm", slug: "/products/hand-balm" },
      { name: "Body Balm", slug: "/products/body-balm" },
    ]),
    faq: [
      {
        question: "Is the scent strong?",
        answer: "It is a quiet floral whisper—designed to support a peaceful routine.",
      },
      {
        question: "Will it dry my skin?",
        answer: "The silk proteins and rice bran oil keep moisture in for a soft finish.",
      },
      {
        question: "Is it safe for daily use?",
        answer: "Yes—the formula is balanced for everyday bathing rituals.",
      },
    ],
  },
  {
    slug: "hand-balm",
    productId: "hand-balm",
    productName: "Hand Balm",
    shortTagline: "Focused nourishment for palms on the go.",
    priceLabel: "195.99 EGP",
    priceNumber: 195.99,
    heroSummaryBullets: [
      "Lightweight yet restorative for hardworking hands.",
      "Absorbs quickly while still leaving a silky veil.",
      "Tiny tube that travels easily and revives instantly.",
    ],
    heroImage: handBalmImage,
    whatItsMadeFor:
      "Work-worn palms, garden hands, or those who need a quick, restorative finish—this balm brings concentrated ceramides without tackiness.",
    ritualSteps: [
      { title: "Squeeze", description: "Place a pearl-sized amount onto fingertips." },
      {
        title: "Warm",
        description: "Rub between palms until just melted.",
      },
      {
        title: "Slide",
        description: "Cover palms, cuticles, and fingertips with gentle strokes.",
      },
    ],
    ingredients: [
      {
        name: "Ceramides",
        description: "Rebuild the barrier and defend against daily stressors.",
      },
      {
        name: "Meadowfoam Seed Oil",
        description: "Delivers velvet softness without weighing down.",
      },
      {
        name: "Sunflower Seed Oil",
        description: "Rich in linoleic acid to soothe and nourish.",
      },
      {
        name: "Tamanu Oil",
        description: "Calms and supports the skin’s natural renewal cycle.",
      },
    ],
    sensoryExperience: [
      "A delicate balm that dries to an invisible, non-greasy sheen.",
      "Tactile enough to feel like self-care, but quick to absorb.",
      "Fragrance is herbaceous and clean.",
    ],
    pairsWellWith: createPairings([
      { name: "Body Balm", slug: "/products/body-balm" },
      { name: "Calm & Glow Body Soap", slug: "/products/calm-glow-body-soap" },
    ]),
    faq: [
      {
        question: "Can I use it on cuticles?",
        answer: "Yes, it softens the cuticle without leaving residue.",
      },
      {
        question: "Will it interfere with work?",
        answer: "It absorbs fast, so schedule it before typing or after washing your hands.",
      },
      {
        question: "Does it work on cracked skin?",
        answer: "The ceramides and tamanu give it a restorative boost.",
      },
    ],
  },
  {
    slug: "hair-growth-oil",
    productId: "hair-growth-oil",
    productName: "Hair Growth Oil",
    shortTagline: "Scalp nourishment for resilient shine.",
    priceLabel: "229.99 EGP",
    priceNumber: 229.99,
    variants: [
      {
        variantId: "hair-growth-strength",
        label: "Strength Focus",
        priceLabel: "229.99 EGP",
        priceNumber: 229.99,
        attributes: {
          focus: "Growth",
          scent: "Rosemary + Cedar",
        },
      },
      {
        variantId: "hair-growth-glow",
        label: "Glow & Lift",
        priceLabel: "234.99 EGP",
        priceNumber: 234.99,
        attributes: {
          focus: "Shine",
          scent: "Citrus + Neroli",
        },
      },
    ],
    defaultVariantId: "hair-growth-strength",
    heroSummaryBullets: [
      "Rosemary stem cells and biotin fortify roots.",
      "Lightweight oil that never feels heavy.",
      "Supports length retention and daily shine.",
    ],
    heroImage: hairGrowthImage,
    whatItsMadeFor:
      "For those growing their ritual—this elixir nourishes the scalp, encourages resilience, and leaves hair whisper-soft.",
    ritualSteps: [
      { title: "Section", description: "Part hair into sections to apply evenly on the scalp." },
      {
        title: "Apply",
        description: "Use the dropper to deliver a few drops to each section and massage gently.",
      },
      {
        title: "Rest",
        description: "Let it sit for 30 minutes or overnight before rinsing lightly.",
      },
    ],
    ingredients: [
      {
        name: "Rosemary Stem Cells",
        description: "Encourage stronger follicles and a balanced scalp.",
      },
      {
        name: "Biotin",
        description: "Supports shine while helping hair feel thicker.",
      },
      {
        name: "Argan Oil",
        description: "Lightweight hydration that smooths frizz.",
      },
      {
        name: "Camellia Seed Oil",
        description: "Soothes sensitivity and nourishes the mane.",
      },
    ],
    sensoryExperience: [
      "A fine oil that spreads with a silky glide.",
      "Leaves hair soft but never weighed down.",
      "The scent is herbal with a hint of citrus.",
    ],
    pairsWellWith: createPairings([
      { name: "Hair Shine & Anti-Frizz Oil", slug: "/products/hair-shine-anti-frizz-oil" },
      { name: "Body Balm", slug: "/products/body-balm" },
    ]),
    faq: [
      {
        question: "How often should I use it?",
        answer: "Use nightly or a few times weekly for a focused boost.",
      },
      {
        question: "Will it feel heavy on roots?",
        answer: "The blend is light and absorbs quickly when massaged into the scalp.",
      },
      {
        question: "Can I use it with other styling oils?",
        answer: "Yes—layer under your usual finishers or use solo.",
      },
    ],
  },
  {
    slug: "hair-shine-anti-frizz-oil",
    productId: "hair-shine-anti-frizz-oil",
    productName: "Hair Shine & Anti-Frizz Oil",
    shortTagline: "Glass-like shine without weight.",
    priceLabel: "196.99 EGP",
    priceNumber: 196.99,
    heroSummaryBullets: [
      "Silica-rich finish smooths cuticles for mirror-like gloss.",
      "Tames frizz while keeping movement natural.",
      "Pairs beautifully with a warm blow-dry or sleek finish.",
    ],
    heroImage: hairShineImage,
    whatItsMadeFor:
      "Designed for the finish line—seal in moisture, smooth stray hairs, and add a luminous halo without heaviness.",
    ritualSteps: [
      {
        title: "Dispense",
        description: "Warm a couple drops in palms.",
      },
      {
        title: "Swipe",
        description: "Apply along mid-lengths and ends, focusing on areas that frizz.",
      },
      {
        title: "Blend",
        description: "Blend lightly with fingers for a seamless finish.",
      },
    ],
    ingredients: [
      {
        name: "Silica",
        description: "Smooths cuticles for reflectivity.",
      },
      {
        name: "Buriti Oil",
        description: "High in beta-carotene to intensify shine.",
      },
      {
        name: "Evening Primrose Oil",
        description: "Calms flyaways without stiffness.",
      },
      {
        name: "Jojoba Oil",
        description: "Balances shine and mimics the scalp’s natural oils.",
      },
    ],
    sensoryExperience: [
      "Spreads like silk and leaves no residue.",
      "Reflective shine feels luminous but natural.",
      "Fragrance is warm amber with herbal clarity.",
    ],
    pairsWellWith: createPairings([
      { name: "Hair Growth Oil", slug: "/products/hair-growth-oil" },
      { name: "Hand Balm", slug: "/products/hand-balm" },
    ]),
    faq: [
      {
        question: "Can I use it on damp hair?",
        answer: "Yes—apply before styling to guard against humidity.",
      },
      {
        question: "Will it weigh down fine hair?",
        answer: "Start with a pea-sized amount; it layers beautifully without flattening.",
      },
      {
        question: "Is it safe for color-treated hair?",
        answer: "It protects strands and adds softness without stripping color.",
      },
    ],
  },
];

export const PRODUCT_DETAIL_MAP: Record<string, ProductDetailContent> = PRODUCT_DETAIL_CONFIGS.reduce<
  Record<string, ProductDetailContent>
>((acc, config) => {
  acc[config.slug] = config;
  return acc;
}, {});

export const PRODUCT_DETAIL_SLUGS_BY_TITLE: Record<string, string> = PRODUCT_DETAIL_CONFIGS.reduce<
  Record<string, string>
>((acc, config) => {
  acc[config.productName] = config.slug;
  return acc;
}, {});
