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
    quote: "بيسيح على الجلد بسرعة وبيسيب جسمي ناعم من غير أي إحساس دهني.",
    author: "mayan",
    detail: "بستخدمه بالليل بعد الشاور، وصحيت تاني يوم حاسة إن الجلد أهدى وأنعم بكتير.",
  },
  {
    id: "review-body-balm-2",
    productId: "body-balm",
    rating: 4,
    quote: "الريحة لطيفة وهادية، والقوام غني بس مش تقيل على البشرة.",
    author: "yara gaber",
  },
  {
    id: "review-hair-growth",
    productId: "hair-growth-oil",
    rating: 5,
    quote: "فروة راسي بقت مرتاحة أكتر، وشعري حسيت إنه أقوى بعد كام أسبوع.",
    author: "laila",
  },
  {
    id: "review-hand-balm",
    productId: "hand-balm",
    rating: 4,
    quote: "بيتشرب بسرعة جدًا، مناسب بعد غسيل الإيدين ومش بيسيبه ملمس لزج.",
    author: "Noura",
  },
  {
    id: "review-hair-bundle",
    bundleId: "hair-strength-ritual",
    rating: 5,
    quote: "الروتين كله مع بعضه فرق معايا، اللمعة بتفضل وقت أطول والشعر شكله أرتب.",
    author: "marina",
  },
];

export const ritualStories: RitualStory[] = [];
