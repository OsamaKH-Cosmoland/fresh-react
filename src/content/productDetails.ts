import bodyBalmImage from "@/assets/BodyBalmEnhanced1.jpg";
import bodySoapOne from "@/assets/BodySoap1.jpg";
import bodySoapTwo from "@/assets/BodySoap2.png";
import handBalmImage from "@/assets/HandBalmEnhanced.jpg";
import hairGrowthImage from "@/assets/HairGrowthEnhanced.jpg";
import hairShineImage from "@/assets/HairShineEnhanced.jpg";
import lipBalmImage from "@/assets/LipBalm.jpg";
import type {
  FAQItem,
  IngredientHighlight,
  Pairing,
  ProductDetailLayoutProps,
  ProductVariant,
  RitualStep,
} from "@/components/product/ProductDetailLayout";
import type { ScentPreference } from "@/hooks/useUserPreferences";

export interface ProductDetailContent extends Omit<ProductDetailLayoutProps, "onAddToBag" | "heroActions"> {
  slug: string;
  productId: string;
  priceNumber: number;
  variants?: LocalizedProductVariant[];
  defaultVariantId?: string;
  productNameAr?: string;
  shortTaglineAr?: string;
  heroSummaryBulletsAr?: HeroSummaryBullet[];
  whatItsMadeForAr?: string;
  ritualStepsAr?: RitualStep[];
  ingredientsAr?: IngredientHighlight[];
  sensoryExperienceAr?: string[];
  pairsWellWithAr?: Pairing[];
  faqAr?: FAQItem[];
}

export interface LocalizedProductVariant extends ProductVariant {
  labelAr?: string;
  attributesAr?: Record<string, string>;
}

const createPairings = (items: Pairing[]): Pairing[] => items;
type SupportedLocale = "en" | "ar";

const localizeVariant = (variant: LocalizedProductVariant, locale: SupportedLocale) => {
  if (locale !== "ar") return variant;
  return {
    ...variant,
    label: variant.labelAr ?? variant.label,
    attributes: variant.attributesAr ?? variant.attributes,
  };
};

export const localizeProductDetail = (
  detail: ProductDetailContent,
  locale: SupportedLocale
): ProductDetailContent => {
  if (locale !== "ar") return detail;
  return {
    ...detail,
    productName: detail.productNameAr ?? detail.productName,
    shortTagline: detail.shortTaglineAr ?? detail.shortTagline,
    heroSummaryBullets: detail.heroSummaryBulletsAr ?? detail.heroSummaryBullets,
    whatItsMadeFor: detail.whatItsMadeForAr ?? detail.whatItsMadeFor,
    ritualSteps: detail.ritualStepsAr ?? detail.ritualSteps,
    ingredients: detail.ingredientsAr ?? detail.ingredients,
    sensoryExperience: detail.sensoryExperienceAr ?? detail.sensoryExperience,
    pairsWellWith: detail.pairsWellWithAr ?? detail.pairsWellWith,
    faq: detail.faqAr ?? detail.faq,
    variants: detail.variants?.map((variant) => localizeVariant(variant, locale)),
  };
};

export const getLocalizedProductDetailBySlug = (
  slug: string,
  locale: SupportedLocale
): ProductDetailContent | undefined => {
  const detail = PRODUCT_DETAIL_MAP[slug];
  return detail ? localizeProductDetail(detail, locale) : undefined;
};

export const getLocalizedProductName = (productId: string, locale: SupportedLocale) => {
  const detail = PRODUCT_DETAIL_MAP[productId];
  if (!detail) return productId;
  return locale === "ar" ? detail.productNameAr ?? detail.productName : detail.productName;
};

export const getLocalizedProductVariants = (productId: string, locale: SupportedLocale) => {
  const detail = PRODUCT_DETAIL_MAP[productId];
  if (!detail?.variants) return [];
  return detail.variants.map((variant) => localizeVariant(variant, locale));
};

export const getVariantSummaryForLocale = (
  productId: string,
  locale: SupportedLocale
): VariantSummary | null => {
  const variants = getLocalizedProductVariants(productId, locale);
  if (!variants.length) return null;
  const labels = variants.map((variant) => variant.label);
  const prices = variants.map((variant) => variant.priceNumber);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return {
    count: labels.length,
    labels,
    priceRange: prices.length ? { min, max } : undefined,
  };
};

export const PRODUCT_DETAIL_CONFIGS: ProductDetailContent[] = [
  {
    slug: "body-balm",
    productId: "body-balm",
    productName: "Body Balm",
    productNameAr: "بلسم الجسم",
    shortTagline: "Deep moisture for skin that craves calm.",
    shortTaglineAr: "ترطيب عميق لبشرة تبحث عن السكينة.",
    priceLabel: "197.99 EGP",
    priceNumber: 197.99,
    variants: [
      {
        variantId: "body-balm-lavender",
        label: "Lavender Bloom",
        labelAr: "أزهار اللافندر",
        priceLabel: "197.99 EGP",
        priceNumber: 197.99,
        attributes: {
          scent: "Lavender",
          size: "50 ml",
        },
        attributesAr: {
          scent: "لافندر",
          size: "50 مل",
        },
      },
      {
        variantId: "body-balm-unscented",
        label: "Unscented Calm",
        labelAr: "سكينة بدون عطر",
        priceLabel: "195.99 EGP",
        priceNumber: 195.99,
        attributes: {
          scent: "Unscented",
          size: "50 ml",
        },
        attributesAr: {
          scent: "بدون عطر",
          size: "50 مل",
        },
      },
      {
        variantId: "body-balm-silk",
        label: "Silk Blossom Veil",
        labelAr: "حجاب زهر الحرير",
        priceLabel: "199.99 EGP",
        priceNumber: 199.99,
        attributes: {
          scent: "Silk Blossom",
          size: "50 ml",
        },
        attributesAr: {
          scent: "زهر الحرير",
          size: "50 مل",
        },
      },
    ],
    defaultVariantId: "body-balm-lavender",
    heroSummaryBullets: [
      "Locks in long-lasting hydration without feeling greasy.",
      "Softens rough areas like elbows, knees, and hands.",
      "Wraps your body in a quiet, comforting routine at the end of the day.",
    ],
    heroSummaryBulletsAr: [
      "يحفظ الترطيب لفترة طويلة دون ملمس دهني.",
      "يلطف المناطق الخشنة مثل المرفقين والركبتين واليدين.",
      "يغلّف الجسم بروتين هادئ ومريح في نهاية اليوم.",
    ],
    heroImage: bodyBalmImage,
    whatItsMadeFor:
      "Dry, tired skin needs a peaceful interlude—our butter blend cushions, seals, and shields without the weight of heavy oils.",
    whatItsMadeForAr:
      "لبشرة جافة ومتعبة تحتاج إلى استراحة هادئة—مزيج الزبدة يهدئ ويختم ويحمي دون ثقل الزيوت الثقيلة.",
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
        description: "Boost the routine on heels, hands, and shoulders before bed for extra calm.",
      },
    ],
    ritualStepsAr: [
      {
        title: "دفّئي",
        description: "دفّئي كمية صغيرة بين راحتي اليد حتى تتحول إلى زيت.",
      },
      {
        title: "اضغطي",
        description: "اضغطي بلطف على الذراعين والساقين والمرفقين والركبتين وأي مناطق خشنة لتغطية متساوية.",
      },
      {
        title: "دلّكي",
        description: "دلّكي بحركات بطيئة للأعلى واتركي البلسم يتغلغل قبل ارتداء الملابس.",
      },
      {
        title: "كرّري عند الحاجة",
        description: "عزّزي الروتين على الكعبين واليدين والكتفين قبل النوم لمزيد من السكينة.",
      },
    ],
    ingredients: [
      { name: "Cocoa Butter", description: "Protective and occlusive, it locks in moisture and softens rough areas." },
      { name: "Shea Butter", description: "Deeply nourishing and comforting for dry, sensitive skin." },
      { name: "Sweet Almond Oil", description: "Replenishing and silky, it keeps skin smooth and supple." },
      { name: "Vitamin E", description: "Supports the skin barrier while providing gentle antioxidant care." },
    ],
    ingredientsAr: [
      {
        name: "زبدة الكاكاو",
        description: "واقية ومغلِّفة، تحبس الرطوبة وتنعّم المناطق الخشنة.",
      },
      {
        name: "زبدة الشيا",
        description: "مغذّية ومريحة للبشرة الجافة والحساسة.",
      },
      {
        name: "زيت اللوز الحلو",
        description: "مُرمّم وناعم، يحافظ على نعومة البشرة وليونتها.",
      },
      {
        name: "فيتامين E",
        description: "يدعم حاجز البشرة ويمنحها عناية مضادة للأكسدة بلطف.",
      },
    ],
    sensoryExperience: [
      "Rich in the jar, melts into a silky oil when warmed.",
      "Absorbs to a comfortable, non-sticky finish.",
      "Scent is soft, designed to support evening wind-down rather than overpower.",
    ],
    sensoryExperienceAr: [
      "قوام غني في العبوة، يذوب إلى زيت حريري عند التسخين.",
      "يمتص ليمنح لمسة مريحة غير لزجة.",
      "العطر ناعم ومصمم لدعم هدوء المساء دون أن يطغى.",
    ],
    pairsWellWith: createPairings([
      { name: "Calm & Glow Body Soap", slug: "/products/calm-glow-body-soap" },
      { name: "Hand Balm", slug: "/products/hand-balm" },
      { name: "Silk Blossom Body Soap", slug: "/products/silk-blossom-body-soap" },
    ]),
    pairsWellWithAr: createPairings([
      { name: "صابون الجسم سكينة وتوهج", slug: "/products/calm-glow-body-soap" },
      { name: "بلسم اليدين", slug: "/products/hand-balm" },
      { name: "صابون الجسم زهر الحرير", slug: "/products/silk-blossom-body-soap" },
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
    faqAr: [
      {
        question: "هل يمكن استخدام بلسم الجسم يومياً؟",
        answer: "نعم، يُستخدم مرة أو مرتين يومياً بعد التنظيف للحفاظ على تغذية عميقة.",
      },
      {
        question: "هل يترك ملمساً دهنياً؟",
        answer: "يذوب إلى زيت حريري يمتص بسرعة دون بقايا لزجة.",
      },
      {
        question: "هل يمكن استخدامه على اليدين والقدمين؟",
        answer: "بالتأكيد—ركّزي كمية إضافية على اليدين والكعبين أو المرفقين قبل النوم.",
      },
      {
        question: "هل هو آمن للبشرة الحساسة؟",
        answer: "تركيبة لطيفة بنباتات مهدئة دون مكونات قاسية، مناسبة للبشرة الحساسة.",
      },
    ],
  },
  {
    slug: "calm-glow-body-soap",
    productId: "calm-glow-body-soap",
    productName: "Calm & Glow Body Soap",
    productNameAr: "صابون الجسم سكينة وتوهج",
    shortTagline: "Chamomile serenity for luminous skin.",
    shortTaglineAr: "سكينة البابونج لبشرة مضيئة.",
    priceLabel: "228.99 EGP",
    priceNumber: 228.99,
    heroSummaryBullets: [
      "Creamy chamomile lather comforts skin while polishing the surface.",
      "Removes impurities without stripping natural oils.",
      "Builds a gentle glow so skin feels settled before routine steps.",
    ],
    heroSummaryBulletsAr: [
      "رغوة بابونج كريمية تهدئ البشرة وتنعّم السطح.",
      "يزيل الشوائب دون تجريد الزيوت الطبيعية.",
      "يبني توهجاً لطيفاً لتشعر البشرة بالهدوء قبل الخطوات التالية.",
    ],
    heroImage: bodySoapOne,
    whatItsMadeFor:
      "Crafted for unsettled, reactive skin, the blend calms and restores balance while the micro-pearl glow leaves a whisper of radiance.",
    whatItsMadeForAr:
      "مصنوع للبشرة المتوترة والمتفاعلة؛ المزيج يهدئ ويعيد التوازن بينما يمنح التوهج اللؤلؤي لمسة إشراق خفيفة.",
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
        description: "Rinse, pat lightly, and follow with the Body Balm routine to seal in calm.",
      },
    ],
    ritualStepsAr: [
      {
        title: "رغّي",
        description: "كوّني رغوة غنية على البشرة المبللة أو على ليفة.",
      },
      {
        title: "نظّفي",
        description: "دلّكي بلطف من الكتفين إلى الأسفل ودعي النباتات تهدئك.",
      },
      {
        title: "توّهجي",
        description: "اشطفي، جففي بالتربيت، واتّبعيه بروتين بلسم الجسم لإغلاق الهدوء.",
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
    ingredientsAr: [
      {
        name: "البابونج",
        description: "يهدئ الاحمرار ويمنح إحساساً دافئاً.",
      },
      {
        name: "نيرولي",
        description: "يفتح البشرة ويمنح عطراً لطيفاً ومبهجاً.",
      },
      {
        name: "الألوفيرا",
        description: "ترطيب مُبرِّد يحافظ على نعومة البشرة.",
      },
      {
        name: "لآلئ الميكا",
        description: "تمنح توهجاً خفيفاً يعكس ضوء الشموع.",
      },
    ],
    sensoryExperience: [
      "Creates a creamy foam that smells like a tranquil boudoir.",
      "Skin feels clean yet never tight.",
      "Leaves behind a soft, warming finish that invites follow-up care.",
    ],
    sensoryExperienceAr: [
      "رغوة كريمية برائحة غرفة هادئة.",
      "البشرة نظيفة دون شدّ.",
      "يترك لمسة دافئة تدعو لخطوات لاحقة.",
    ],
    pairsWellWith: createPairings([
      { name: "Body Balm", slug: "/products/body-balm" },
      { name: "Hand Balm", slug: "/products/hand-balm" },
      { name: "Silk Blossom Body Soap", slug: "/products/silk-blossom-body-soap" },
    ]),
    pairsWellWithAr: createPairings([
      { name: "بلسم الجسم", slug: "/products/body-balm" },
      { name: "بلسم اليدين", slug: "/products/hand-balm" },
      { name: "صابون الجسم زهر الحرير", slug: "/products/silk-blossom-body-soap" },
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
    faqAr: [
      {
        question: "هل يمنح توهجاً فورياً؟",
        answer: "نعم—لآلئ الميكا تمنح دفئاً فورياً دون لمعان مبالغ.",
      },
      {
        question: "هل هو مناسب للبشرة الحساسة؟",
        answer: "البابونج والألوفيرا يجعلان التركيبة لطيفة حتى للبشرة المتفاعلة.",
      },
      {
        question: "كم مرة يمكن استخدامه؟",
        answer: "يومياً، صباحاً أو مساءً، متى رغبتِ بتنظيف مريح.",
      },
    ],
  },
  {
    slug: "silk-blossom-body-soap",
    productId: "silk-blossom-body-soap",
    productName: "Silk Blossom Body Soap",
    productNameAr: "صابون الجسم زهر الحرير",
    shortTagline: "Velvety jasmine for moments that bloom.",
    shortTaglineAr: "ياسمين مخملي للحظات تتفتح.",
    priceLabel: "231.99 EGP",
    priceNumber: 231.99,
    heroSummaryBullets: [
      "Jasmine petals and silk proteins soften as you cleanse.",
      "Creates an elegant foam that rinses away effortlessly.",
      "Designed to lift the senses with a floral finish.",
    ],
    heroSummaryBulletsAr: [
      "بتلات الياسمين وبروتينات الحرير تنعّم أثناء التنظيف.",
      "تُكوّن رغوة أنيقة تُشطف بسهولة.",
      "مصمم لرفع الحواس بلمسة زهرية.",
    ],
    heroImage: bodySoapTwo,
    whatItsMadeFor:
      "For those who linger by candlelight—this soap cleanses with soft silkiness and a floral veil that keeps skin feeling poised.",
    whatItsMadeForAr:
      "لمن يحبون هدوء ضوء الشموع—هذا الصابون ينظف بملمس حريري وعبير زهري يحفظ توازن البشرة.",
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
    ritualStepsAr: [
      {
        title: "تفتّحي",
        description: "بلّلي البشرة ثم مرري الصابون على اليدين المبللتين أو الليفة.",
      },
      {
        title: "شكّلي",
        description: "دلّكي بلطف بحركات انسيابية لتنشيط الدورة.",
      },
      {
        title: "اشطفي",
        description: "اشطفي بماء فاتر ثم اتبعيه ببلسم الجسم كلمسة ختامية.",
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
    ingredientsAr: [
      {
        name: "الياسمين",
        description: "يمنح نعومة زهرية ويهدئ الحواس.",
      },
      {
        name: "بروتينات الحرير",
        description: "تمنح انسيابية فاخرة وطبقة واقية.",
      },
      {
        name: "زيت نخالة الأرز",
        description: "يغذي دون ثقل.",
      },
      {
        name: "فيتامين B5",
        description: "يساعد على الحفاظ على المرونة والحيوية.",
      },
    ],
    sensoryExperience: [
      "The petals release a soft floral mist as you lather.",
      "Rinses with a polished, satin finish.",
      "Scent lingers but never feels overpowering.",
    ],
    sensoryExperienceAr: [
      "تطلق البتلات ضباباً زهرياً ناعماً أثناء الرغوة.",
      "يشطف مع لمسة ساتانية مصقولة.",
      "يبقى العطر دون أن يكون طاغياً.",
    ],
    pairsWellWith: createPairings([
      { name: "Hand Balm", slug: "/products/hand-balm" },
      { name: "Body Balm", slug: "/products/body-balm" },
    ]),
    pairsWellWithAr: createPairings([
      { name: "بلسم اليدين", slug: "/products/hand-balm" },
      { name: "بلسم الجسم", slug: "/products/body-balm" },
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
        answer: "Yes—the formula is balanced for everyday bathing routines.",
      },
    ],
    faqAr: [
      {
        question: "هل العطر قوي؟",
        answer: "هو همسة زهرية هادئة—مصمم لدعم روتين مريح.",
      },
      {
        question: "هل يجفف البشرة؟",
        answer: "بروتينات الحرير وزيت نخالة الأرز يحافظان على الترطيب لملمس ناعم.",
      },
      {
        question: "هل هو مناسب للاستخدام اليومي؟",
        answer: "نعم—التركيبة متوازنة لروتين الاستحمام اليومي.",
      },
    ],
  },
  {
    slug: "hand-balm",
    productId: "hand-balm",
    productName: "Hand Balm",
    productNameAr: "بلسم اليدين",
    shortTagline: "Focused nourishment for palms on the go.",
    shortTaglineAr: "تغذية مركزة لراحة اليدين أثناء التنقل.",
    priceLabel: "195.99 EGP",
    priceNumber: 195.99,
    heroSummaryBullets: [
      "Lightweight yet restorative for hardworking hands.",
      "Absorbs quickly while still leaving a silky veil.",
      "Tiny tube that travels easily and revives instantly.",
    ],
    heroSummaryBulletsAr: [
      "خفيف لكنه مُرمِّم لليدين المجهدتين.",
      "يمتص بسرعة مع لمسة حريرية خفيفة.",
      "أنبوب صغير يسافر بسهولة وينعش فوراً.",
    ],
    heroImage: handBalmImage,
    whatItsMadeFor:
      "Work-worn palms, garden hands, or those who need a quick, restorative finish—this balm brings concentrated ceramides without tackiness.",
    whatItsMadeForAr:
      "لليدين المتعبة أو لمن يحتاج لمسة سريعة—هذا البلسم يوفر سيراميدات مركزة دون لزوجة.",
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
    ritualStepsAr: [
      {
        title: "اعصري",
        description: "ضعي مقدار حبة صغيرة على أطراف الأصابع.",
      },
      {
        title: "دفّئي",
        description: "افركي بين الكفين حتى يلين.",
      },
      {
        title: "مرّري",
        description: "غطي الكفين والجلد حول الأظافر والأطراف بحركات لطيفة.",
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
    ingredientsAr: [
      {
        name: "السيراميدات",
        description: "تعيد بناء الحاجز وتحمي من الضغوط اليومية.",
      },
      {
        name: "زيت بذور الميدوفوم",
        description: "يمنح نعومة مخملية دون ثقل.",
      },
      {
        name: "زيت بذور دوار الشمس",
        description: "غني بحمض اللينوليك لتهدئة وتغذية البشرة.",
      },
      {
        name: "زيت التامانو",
        description: "يهدئ ويدعم دورة تجدد البشرة الطبيعية.",
      },
    ],
    sensoryExperience: [
      "A delicate balm that dries to an invisible, non-greasy sheen.",
      "Tactile enough to feel like self-care, but quick to absorb.",
      "Fragrance is herbaceous and clean.",
    ],
    sensoryExperienceAr: [
      "بلسم لطيف يجف إلى لمعة غير دهنية.",
      "إحساس عناية ذاتية مع امتصاص سريع.",
      "العطر عشبي ونظيف.",
    ],
    pairsWellWith: createPairings([
      { name: "Body Balm", slug: "/products/body-balm" },
      { name: "Calm & Glow Body Soap", slug: "/products/calm-glow-body-soap" },
    ]),
    pairsWellWithAr: createPairings([
      { name: "بلسم الجسم", slug: "/products/body-balm" },
      { name: "صابون الجسم سكينة وتوهج", slug: "/products/calm-glow-body-soap" },
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
    faqAr: [
      {
        question: "هل يمكن استخدامه على الجلد حول الأظافر؟",
        answer: "نعم، ينعّم الجلد حول الأظافر دون ترك بقايا.",
      },
      {
        question: "هل يؤثر على العمل؟",
        answer: "يمتص بسرعة، لذا استخدميه قبل الكتابة أو بعد غسل اليدين.",
      },
      {
        question: "هل يفيد للبشرة المتشققة؟",
        answer: "السيراميدات والتامانو يمنحانه دفعة ترميمية.",
      },
    ],
  },
  {
    slug: "lip-balm",
    productId: "lip-balm",
    productName: "Lip Balm",
    productNameAr: "بلسم الشفاه",
    shortTagline: "A pocket-size balm that keeps lips soft, smooth, and protected.",
    shortTaglineAr: "بلسم بحجم الجيب يحافظ على نعومة الشفاه وسلاستها وحمايتها.",
    priceLabel: "99 EGP",
    priceNumber: 99,
    heroSummaryBullets: [
      "10 ml size for quick, on-the-go nourishment.",
      "Seals in moisture with a soft, cushiony finish.",
      "Comforts dry or wind-chapped lips without stickiness.",
    ],
    heroSummaryBulletsAr: [
      "حجم 10 مل لتغذية سريعة أثناء التنقل.",
      "يحبس الترطيب بلمسة ناعمة ومريحة.",
      "يهدئ الشفاه الجافة أو المتشققة دون لزوجة.",
    ],
    heroImage: lipBalmImage,
    whatItsMadeFor:
      "Dry, delicate lips need a lightweight seal—this balm cushions, restores, and locks in moisture wherever you are.",
    whatItsMadeForAr:
      "الشفاه الجافة والحساسة تحتاج إلى ختم خفيف—هذا البلسم يهدئ ويعيد الترطيب ويحفظه أينما كنتِ.",
    ritualSteps: [
      {
        title: "Warm",
        description: "Warm a small amount between fingertips to melt the balm.",
      },
      {
        title: "Glide",
        description: "Sweep across lips, starting at the center and working outward.",
      },
      {
        title: "Press",
        description: "Press lips together to smooth and boost absorption.",
      },
      {
        title: "Refresh",
        description: "Reapply anytime lips feel dry, especially after sun or wind.",
      },
    ],
    ritualStepsAr: [
      {
        title: "دفّئي",
        description: "دفّئي كمية صغيرة بين أطراف الأصابع حتى يذوب البلسم.",
      },
      {
        title: "مرّري",
        description: "مرّريه على الشفاه بدءاً من المنتصف باتجاه الأطراف.",
      },
      {
        title: "اضغطي",
        description: "اضغطي الشفتين معاً لتنعيم السطح وتعزيز الامتصاص.",
      },
      {
        title: "جدّدي",
        description: "أعيدي الاستخدام كلما شعرتِ بالجفاف خاصة بعد الشمس أو الرياح.",
      },
    ],
    ingredients: [
      { name: "Shea Butter", description: "Deeply nourishing lipids that soften and smooth." },
      { name: "Jojoba Oil", description: "Lightweight oil that mimics natural sebum to soothe." },
      { name: "Candelilla Wax", description: "Plant-based wax that seals in moisture without heaviness." },
      { name: "Vitamin E", description: "Antioxidant support for delicate lip skin." },
    ],
    ingredientsAr: [
      { name: "زبدة الشيا", description: "دهون مغذية بعمق تمنح نعومة." },
      { name: "زيت الجوجوبا", description: "زيت خفيف يشابه الزيوت الطبيعية لتهدئة الشفاه." },
      { name: "شمع الكنديلا", description: "شمع نباتي يحبس الترطيب دون ثقل." },
      { name: "فيتامين هـ", description: "دعم مضاد للأكسدة لبشرة الشفاه الرقيقة." },
    ],
    sensoryExperience: [
      "Silky balm with a soft, protective veil.",
      "Barely-there sheen, no sticky feel.",
      "Subtle, clean comfort.",
    ],
    sensoryExperienceAr: [
      "بلسم حريري مع طبقة حماية ناعمة.",
      "لمعان خفيف دون لزوجة.",
      "راحة لطيفة بلمسة نظيفة.",
    ],
    pairsWellWith: createPairings([
      { name: "Hand Balm", slug: "/products/hand-balm" },
      { name: "Body Balm", slug: "/products/body-balm" },
    ]),
    pairsWellWithAr: createPairings([
      { name: "بلسم اليدين", slug: "/products/hand-balm" },
      { name: "بلسم الجسم", slug: "/products/body-balm" },
    ]),
    faq: [
      {
        question: "Is it safe for sensitive lips?",
        answer: "Yes—formulated to comfort daily, even in dry climates.",
      },
      {
        question: "Can I layer it under lipstick?",
        answer: "Absolutely. Apply a thin layer, let it absorb, then add color.",
      },
      {
        question: "How often should I reapply?",
        answer: "Anytime lips feel dry; reapply after eating or drinking.",
      },
    ],
    faqAr: [
      {
        question: "هل يناسب الشفاه الحساسة؟",
        answer: "نعم—مصمم للراحة اليومية حتى في المناخات الجافة.",
      },
      {
        question: "هل يمكن استخدامه تحت أحمر الشفاه؟",
        answer: "بالتأكيد. ضعي طبقة رقيقة واتركيها تمتص ثم أضيفي اللون.",
      },
      {
        question: "كم مرة أعيد التطبيق؟",
        answer: "كلما شعرتِ بجفاف؛ جدّديه بعد الأكل أو الشرب.",
      },
    ],
  },
  {
    slug: "hair-growth-oil",
    productId: "hair-growth-oil",
    productName: "Hair Growth Oil",
    productNameAr: "زيت نمو الشعر",
    shortTagline: "Scalp nourishment for resilient shine.",
    shortTaglineAr: "تغذية لفروة الرأس ولمعان متين.",
    priceLabel: "229.99 EGP",
    priceNumber: 229.99,
    variants: [
      {
        variantId: "hair-growth-strength",
        label: "Strength Focus",
        labelAr: "تركيز القوة",
        priceLabel: "229.99 EGP",
        priceNumber: 229.99,
        attributes: {
          focus: "Growth",
          scent: "Rosemary + Cedar",
        },
        attributesAr: {
          focus: "النمو",
          scent: "إكليل الجبل + الأرز",
        },
      },
      {
        variantId: "hair-growth-glow",
        label: "Glow & Lift",
        labelAr: "توهج وانتعاش",
        priceLabel: "234.99 EGP",
        priceNumber: 234.99,
        attributes: {
          focus: "Shine",
          scent: "Citrus + Neroli",
        },
        attributesAr: {
          focus: "اللمعان",
          scent: "حمضيات + نيرولي",
        },
      },
    ],
    defaultVariantId: "hair-growth-strength",
    heroSummaryBullets: [
      "Rosemary stem cells and biotin fortify roots.",
      "Lightweight oil that never feels heavy.",
      "Supports length retention and daily shine.",
    ],
    heroSummaryBulletsAr: [
      "خلايا جذعية من إكليل الجبل والبيوتين تقوي الجذور.",
      "زيت خفيف لا يشعر بالثقل.",
      "يدعم الحفاظ على الطول ولمعاناً يومياً.",
    ],
    heroImage: hairGrowthImage,
    whatItsMadeFor:
      "For those growing their routine—this elixir nourishes the scalp, encourages resilience, and leaves hair whisper-soft.",
    whatItsMadeForAr:
      "لمن يطيلون روتينهم—هذا الإكسير يغذي الفروة ويعزز المتانة ويترك الشعر ناعماً كالهمس.",
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
    ritualStepsAr: [
      {
        title: "قسّمي",
        description: "قسّمي الشعر إلى أقسام لتوزيع متساوٍ على الفروة.",
      },
      {
        title: "ضعي",
        description: "استخدمي القطّارة لوضع بضع قطرات على كل قسم ودلّكي بلطف.",
      },
      {
        title: "اتركي",
        description: "اتركيه 30 دقيقة أو طوال الليل قبل الشطف الخفيف.",
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
    ingredientsAr: [
      {
        name: "خلايا جذعية من إكليل الجبل",
        description: "تعزز بصيلات أقوى وتوازن فروة الرأس.",
      },
      {
        name: "البيوتين",
        description: "يدعم اللمعان ويساعد الشعر على الإحساس بالكثافة.",
      },
      {
        name: "زيت الأرجان",
        description: "ترطيب خفيف ينعّم الهيشان.",
      },
      {
        name: "زيت بذور الكاميليا",
        description: "يهدئ الحساسية ويغذي الشعر.",
      },
    ],
    sensoryExperience: [
      "A fine oil that spreads with a silky glide.",
      "Leaves hair soft but never weighed down.",
      "The scent is herbal with a hint of citrus.",
    ],
    sensoryExperienceAr: [
      "زيت ناعم ينتشر بانزلاق حريري.",
      "يترك الشعر ناعماً دون ثقل.",
      "العطر عشبي مع لمسة حمضية.",
    ],
    pairsWellWith: createPairings([
      { name: "Hair Shine & Anti-Frizz Oil", slug: "/products/hair-shine-anti-frizz-oil" },
      { name: "Body Balm", slug: "/products/body-balm" },
    ]),
    pairsWellWithAr: createPairings([
      { name: "زيت لمعان الشعر ومضاد للهيشان", slug: "/products/hair-shine-anti-frizz-oil" },
      { name: "بلسم الجسم", slug: "/products/body-balm" },
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
    faqAr: [
      {
        question: "كم مرة يجب استخدامه؟",
        answer: "استخدميه ليلاً أو عدة مرات أسبوعياً للحصول على دفعة مركزة.",
      },
      {
        question: "هل سيكون ثقيلاً على الجذور؟",
        answer: "التركيبة خفيفة وتمتص سريعاً عند التدليك في الفروة.",
      },
      {
        question: "هل يمكن استخدامه مع زيوت تصفيف أخرى؟",
        answer: "نعم—استخدميه تحت منتجاتك النهائية المعتادة أو بمفرده.",
      },
    ],
  },
  {
    slug: "hair-shine-anti-frizz-oil",
    productId: "hair-shine-anti-frizz-oil",
    productName: "Hair Shine & Anti-Frizz Oil",
    productNameAr: "زيت لمعان الشعر ومضاد للهيشان",
    shortTagline: "Glass-like shine without weight.",
    shortTaglineAr: "لمعان زجاجي دون ثقل.",
    priceLabel: "196.99 EGP",
    priceNumber: 196.99,
    heroSummaryBullets: [
      "Silica-rich finish smooths cuticles for mirror-like gloss.",
      "Tames frizz while keeping movement natural.",
      "Pairs beautifully with a warm blow-dry or sleek finish.",
    ],
    heroSummaryBulletsAr: [
      "لمسة غنية بالسيليكا تنعّم القشرة لتوهج يشبه المرآة.",
      "يهدئ الهيشان مع الحفاظ على حركة طبيعية.",
      "يتناغم مع تسريح حراري أو لمسة ناعمة.",
    ],
    heroImage: hairShineImage,
    whatItsMadeFor:
      "Designed for the finish line—seal in moisture, smooth stray hairs, and add a luminous halo without heaviness.",
    whatItsMadeForAr:
      "مصمم لخطوة النهاية—اختمي الترطيب، نعّمي الشعيرات المتطايرة، وأضيفي هالة مضيئة دون ثقل.",
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
    ritualStepsAr: [
      {
        title: "اسكبي",
        description: "دفّئي بضع قطرات بين الكفين.",
      },
      {
        title: "مرّري",
        description: "طبقي على منتصف الشعر والأطراف مع التركيز على مناطق الهيشان.",
      },
      {
        title: "ادمجي",
        description: "ادمجي بخفة بالأصابع لنتيجة ناعمة.",
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
    ingredientsAr: [
      {
        name: "السيليكا",
        description: "تنعّم القشرة لتعكس الضوء.",
      },
      {
        name: "زيت البوريتي",
        description: "غني بالبيتا كاروتين لتعزيز اللمعان.",
      },
      {
        name: "زيت زهرة الربيع المسائية",
        description: "يهدئ الشعيرات المتطايرة دون تيبّس.",
      },
      {
        name: "زيت الجوجوبا",
        description: "يوازن اللمعان ويحاكي زيوت الفروة الطبيعية.",
      },
    ],
    sensoryExperience: [
      "Spreads like silk and leaves no residue.",
      "Reflective shine feels luminous but natural.",
      "Fragrance is warm amber with herbal clarity.",
    ],
    sensoryExperienceAr: [
      "ينتشر كأنه حرير ولا يترك بقايا.",
      "لمعان انعكاسي يبدو طبيعياً.",
      "العطر عنبر دافئ مع وضوح عشبي.",
    ],
    pairsWellWith: createPairings([
      { name: "Hair Growth Oil", slug: "/products/hair-growth-oil" },
      { name: "Hand Balm", slug: "/products/hand-balm" },
    ]),
    pairsWellWithAr: createPairings([
      { name: "زيت نمو الشعر", slug: "/products/hair-growth-oil" },
      { name: "بلسم اليدين", slug: "/products/hand-balm" },
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
    faqAr: [
      {
        question: "هل يمكن استخدامه على شعر رطب؟",
        answer: "نعم—طبقيه قبل التصفيف للحماية من الرطوبة.",
      },
      {
        question: "هل يثقل الشعر الناعم؟",
        answer: "ابدئي بكمية صغيرة؛ يمكن تطبيقه بطبقات دون تسطيح.",
      },
      {
        question: "هل هو آمن للشعر المصبوغ؟",
        answer: "يحمي الخصلات ويمنح نعومة دون سحب اللون.",
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

const SCENT_PREFERENCE_VARIANT_KEYWORDS: Record<ScentPreference, string[]> = {
  softFloral: ["Lavender", "Silk", "Blossom", "Floral"],
  fresh: ["Fresh", "Glow", "Citrus", "Botanical"],
  warm: ["Amber", "Warm", "Cedar", "Resin"],
  unscented: ["Unscented", "Pure", "Clean"],
};

export function getProductVariants(productId: string) {
  const detail = PRODUCT_DETAIL_MAP[productId];
  return detail?.variants ?? [];
}

export function getVariantById(productId: string, variantId?: string) {
  if (!variantId) return undefined;
  return getProductVariants(productId).find((variant) => variant.variantId === variantId);
}

export function getDefaultVariant(productId: string) {
  const detail = PRODUCT_DETAIL_MAP[productId];
  if (!detail?.variants || !detail.variants.length) return undefined;
  if (detail.defaultVariantId) {
    const preferred = detail.variants.find((variant) => variant.variantId === detail.defaultVariantId);
    if (preferred) return preferred;
  }
  return detail.variants[0];
}

export interface VariantSummary {
  count: number;
  labels: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

export function getVariantSummary(productId: string): VariantSummary | null {
  const variants = getProductVariants(productId);
  if (!variants.length) return null;
  const labels = variants.map((variant) => variant.label);
  const prices = variants.map((variant) => variant.priceNumber);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return {
    count: labels.length,
    labels,
    priceRange: prices.length ? { min, max } : undefined,
  };
}

export function chooseVariantForScent(productId: string, scentPreference: ScentPreference | null) {
  if (!scentPreference) return getDefaultVariant(productId);
  const keywords = SCENT_PREFERENCE_VARIANT_KEYWORDS[scentPreference] ?? [];
  if (!keywords.length) return getDefaultVariant(productId);
  const variants = getProductVariants(productId);
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());
  const match = variants.find((variant) => {
    const haystack = `${variant.label} ${(variant.attributes?.scent ?? "").toLowerCase()}`.toLowerCase();
    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });
  return match ?? getDefaultVariant(productId);
}

export function chooseVariantForPreferences(productId: string, scentPreference: ScentPreference | null) {
  return chooseVariantForScent(productId, scentPreference);
}
