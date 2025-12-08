export interface CustomerReview {
  id: string;
  productId?: string;
  bundleId?: string;
  rating: number;
  quote: string;
  author: string;
  location?: string;
  detail?: string;
}

export interface RitualStory {
  id: string;
  bundleId: string;
  title: string;
  quote: string;
  body: string;
  author: string;
}

export const customerReviews: CustomerReview[] = [
  {
    id: "review-body-balm-1",
    productId: "body-balm",
    rating: 5,
    quote: "It melts in and leaves my arms feeling like silk—no greasiness, just a calm glow.",
    author: "Maya, Cairo",
    detail: "Completely replaced my heavy night creams. I use it nightly after the Calm & Glow routine and wake up with smoother skin.",
  },
  {
    id: "review-body-balm-2",
    productId: "body-balm",
    rating: 4,
    quote: "The textures and citrus woody scent feel like a spa capsule.",
    author: "Yara, Alexandria",
  },
  {
    id: "review-hair-growth",
    productId: "hair-growth-oil",
    rating: 5,
    quote: "My scalp feels nourished and the hair seems stronger after a few weeks.",
    author: "Leila, Sharm El Sheikh",
  },
  {
    id: "review-hand-balm",
    productId: "hand-balm",
    rating: 4,
    quote: "Love the quick absorption; perfect post-handwash guard.",
    author: "Nour, Giza",
  },
  {
    id: "review-hair-bundle",
    bundleId: "hair-strength-ritual",
    rating: 5,
    quote: "I was skeptical about bundles, but this routine feels like a ceremony. The salon shine stays longer.",
    author: "Sara, Maadi",
  },
];

export const ritualStories: RitualStory[] = [];
