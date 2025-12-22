import { ritualBundles, type RitualBundle } from "./bundles";

export interface RitualFinderAnswer {
  questionId: string;
  value: string;
}

export interface QuizOption {
  value: string;
  label: string;
  labelAr?: string;
  helper: string;
  helperAr?: string;
  bundleScores: Record<string, number>;
  products?: string[];
}

export interface QuizQuestion {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  options: QuizOption[];
}

type SupportedLocale = "en" | "ar";

export const RITUAL_QUESTIONS: QuizQuestion[] = [
  {
    id: "focus",
    title: "Which routine focus feels right tonight?",
    titleAr: "ما نوع التركيز الذي يناسب روتينك الليلة؟",
    description: "Select the mood that matches your skin + scalp story.",
    descriptionAr: "اختاري المزاج الذي يناسب قصة بشرتك وفروة رأسك.",
    options: [
      {
        value: "body",
        label: "Body hydration & glow",
        labelAr: "ترطيب وإشراقة للجسم",
        helper: "Celebrate softness and luminous skin.",
        helperAr: "احتفلي بنعومة البشرة وإشراقتها.",
        bundleScores: { "evening-calm-ritual": 3, "glow-hydrate-duo": 2 },
        products: ["body-balm"],
      },
      {
        value: "hands",
        label: "Hands & lips care",
        labelAr: "عناية باليدين والشفاه",
        helper: "Focus on palms and pout with targeted routines.",
        helperAr: "ركّزي على راحة اليدين والشفاه بروتينات مخصّصة.",
        bundleScores: { "hands-lips-care-set": 3 },
        products: ["hand-balm", "lip-balm"],
      },
      {
        value: "hair",
        label: "Hair growth & strength",
        labelAr: "نمو الشعر وقوّته",
        helper: "Strengthen roots, tame texture, and boost shine.",
        helperAr: "قوّي الجذور، هدّئي الملمس، وزيدي اللمعان.",
        bundleScores: { "hair-strength-ritual": 3 },
        products: ["hair-growth-oil"],
      },
    ],
  },
  {
    id: "time",
    title: "How much time feels available?",
    titleAr: "كم من الوقت لديك؟",
    description: "Every routine can be brief or luxuriant—choose the cadence you want.",
    descriptionAr: "كل روتين يمكن أن يكون سريعًا أو مترفًا—اختاري الإيقاع الذي تريدينه.",
    options: [
      {
        value: "express",
        label: "Express (under 5 minutes)",
        labelAr: "سريع (أقل من 5 دقائق)",
        helper: "Lean into power routines that can still feel indulgent.",
        helperAr: "روتينات قوية وسريعة لكنها ما زالت فاخرة.",
        bundleScores: { "hair-strength-ritual": 2 },
      },
      {
        value: "unwind",
        label: "Unwind (10–15 minutes)",
        labelAr: "استرخاء (10–15 دقيقة)",
        helper: "A gentle, slowing-down routine for evening softness.",
        helperAr: "روتين لطيف يهدّئ المساء ويمنح نعومة.",
        bundleScores: { "evening-calm-ritual": 2, "glow-hydrate-duo": 1 },
        products: ["body-balm"],
      },
      {
        value: "indulge",
        label: "Indulge (20+ minutes)",
        labelAr: "ترف (20 دقيقة أو أكثر)",
        helper: "Layer on sensory steps and candlelit care.",
        helperAr: "طبّقي خطوات حسّية وعناية بأجواء دافئة.",
        bundleScores: { "glow-hydrate-duo": 2, "evening-calm-ritual": 1 },
      },
    ],
  },
  {
    id: "scent",
    title: "What kind of aromatic finish do you crave?",
    titleAr: "أي نَفَس عطري تفضلينه؟",
    description: "Pick the fragrance family that supports your slow routines.",
    descriptionAr: "اختاري عائلة العطور التي تدعم روتينك الهادئ.",
    options: [
      {
        value: "botanical",
        label: "Botanical + herbal",
        labelAr: "نباتي وعشبي",
        helper: "Rooted greens, rosemary, and quiet clarity.",
        helperAr: "خُضرة متجذّرة، إكليل الجبل، وصفاء هادئ.",
        bundleScores: { "hair-strength-ritual": 2, "evening-calm-ritual": 1 },
      },
      {
        value: "floral",
        label: "Soft floral veil",
        labelAr: "حجاب زهري ناعم",
        helper: "Neroli, orange blossom, and luminous petals.",
        helperAr: "نيرولي وزهر البرتقال وبتلات مضيئة.",
        bundleScores: { "evening-calm-ritual": 2, "glow-hydrate-duo": 1 },
      },
      {
        value: "amber",
        label: "Amber glow",
        labelAr: "وهج العنبر",
        helper: "Warm resins with gentle sheen.",
        helperAr: "راتنجات دافئة ولمعة رقيقة.",
        bundleScores: { "glow-hydrate-duo": 2 },
      },
    ],
  },
];

export const getLocalizedRitualQuestions = (locale: SupportedLocale) =>
  RITUAL_QUESTIONS.map((question) => ({
    ...question,
    title: locale === "ar" ? question.titleAr ?? question.title : question.title,
    description: locale === "ar" ? question.descriptionAr ?? question.description : question.description,
    options: question.options.map((option) => ({
      ...option,
      label: locale === "ar" ? option.labelAr ?? option.label : option.label,
      helper: locale === "ar" ? option.helperAr ?? option.helper : option.helper,
    })),
  }));

export type RitualFinderAnswers = Record<string, string | undefined>;

export interface RitualFinderResult {
  primary?: RitualBundle;
  secondary: RitualBundle[];
  productSuggestions: string[];
}

export function matchRituals(answers: RitualFinderAnswers): RitualFinderResult {
  const scores: Record<string, number> = {};
  const products: string[] = [];

  RITUAL_QUESTIONS.forEach((question) => {
    const value = answers[question.id];
    const option = question.options.find((opt) => opt.value === value);
    if (!option) return;
    Object.entries(option.bundleScores).forEach(([bundleId, weight]) => {
      scores[bundleId] = (scores[bundleId] ?? 0) + weight;
    });
    if (option.products) {
      option.products.forEach((productId) => {
        if (!products.includes(productId)) {
          products.push(productId);
        }
      });
    }
  });

  const ranked = ritualBundles
    .map((bundle) => ({ bundle, score: scores[bundle.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const primary = ranked[0]?.bundle;
  const secondary = ranked.slice(1, 3).map((item) => item.bundle);

  return {
    primary,
    secondary,
    productSuggestions: products,
  };
}
