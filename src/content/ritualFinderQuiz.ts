import { ritualBundles, type RitualBundle } from "./bundles";

export interface RitualFinderAnswer {
  questionId: string;
  value: string;
}

export interface QuizOption {
  value: string;
  label: string;
  helper: string;
  bundleScores: Record<string, number>;
  products?: string[];
}

export interface QuizQuestion {
  id: string;
  title: string;
  description: string;
  options: QuizOption[];
}

export const RITUAL_QUESTIONS: QuizQuestion[] = [
  {
    id: "focus",
    title: "Which routine focus feels right tonight?",
    description: "Select the mood that matches your skin + scalp story.",
    options: [
      {
        value: "body",
        label: "Body hydration & glow",
        helper: "Celebrate softness and luminous skin.",
        bundleScores: { "evening-calm-ritual": 3, "glow-hydrate-duo": 2 },
        products: ["body-balm"],
      },
      {
        value: "hands",
        label: "Hands & lips care",
        helper: "Focus on palms and pout with targeted routines.",
        bundleScores: { "hands-lips-care-set": 3 },
        products: ["hand-balm", "lip-balm"],
      },
      {
        value: "hair",
        label: "Hair growth & strength",
        helper: "Strengthen roots, tame texture, and boost shine.",
        bundleScores: { "hair-strength-ritual": 3 },
        products: ["hair-growth-oil"],
      },
    ],
  },
  {
    id: "time",
    title: "How much time feels available?",
    description: "Every routine can be brief or luxuriant—choose the cadence you want.",
    options: [
      {
        value: "express",
        label: "Express (under 5 minutes)",
        helper: "Lean into power routines that can still feel indulgent.",
        bundleScores: { "hair-strength-ritual": 2 },
      },
      {
        value: "unwind",
        label: "Unwind (10–15 minutes)",
        helper: "A gentle, slowing-down routine for evening softness.",
        bundleScores: { "evening-calm-ritual": 2, "glow-hydrate-duo": 1 },
        products: ["body-balm"],
      },
      {
        value: "indulge",
        label: "Indulge (20+ minutes)",
        helper: "Layer on sensory steps and candlelit care.",
        bundleScores: { "glow-hydrate-duo": 2, "evening-calm-ritual": 1 },
      },
    ],
  },
  {
    id: "scent",
    title: "What kind of aromatic finish do you crave?",
    description: "Pick the fragrance family that supports your slow routines.",
    options: [
      {
        value: "botanical",
        label: "Botanical + herbal",
        helper: "Rooted greens, rosemary, and quiet clarity.",
        bundleScores: { "hair-strength-ritual": 2, "evening-calm-ritual": 1 },
      },
      {
        value: "floral",
        label: "Soft floral veil",
        helper: "Neroli, orange blossom, and luminous petals.",
        bundleScores: { "evening-calm-ritual": 2, "glow-hydrate-duo": 1 },
      },
      {
        value: "amber",
        label: "Amber glow",
        helper: "Warm resins with gentle sheen.",
        bundleScores: { "glow-hydrate-duo": 2 },
      },
    ],
  },
];

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
