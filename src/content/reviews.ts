export interface CustomerReview {
  id: string;
  productId?: string;
  bundleId?: string;
  rating: number;
  quote: string;
  author: string;
  location?: string;
  detail?: string;
  createdAt?: string;
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
    createdAt: "2026-01-03T10:14:00.000Z",
  },
  {
    id: "review-body-balm-2",
    productId: "body-balm",
    rating: 5,
    quote: "الريحة لطيفة وهادية، والقوام غني بس مش تقيل على البشرة.",
    author: "yara gaber",
    createdAt: "2026-01-07T18:32:00.000Z",
  },
  {
    id: "review-hair-growth",
    productId: "hair-growth-oil",
    rating: 5,
    quote: "فروة راسي بقت مرتاحة أكتر، وشعري حسيت إنه أقوى بعد كام أسبوع.",
    author: "laila",
    createdAt: "2026-01-12T13:05:00.000Z",
  },
  {
    id: "review-hand-balm",
    productId: "hand-balm",
    rating: 4,
    quote: "بيتشرب بسرعة جدًا، مناسب بعد غسيل الإيدين ومش بيسيبه ملمس لزج.",
    author: "Noura",
    createdAt: "2026-01-18T09:41:00.000Z",
  },
  {
    id: "review-hair-bundle",
    bundleId: "hair-strength-ritual",
    rating: 5,
    quote: "الروتين كله مع بعضه فرق معايا، اللمعة بتفضل وقت أطول والشعر شكله أرتب.",
    author: "marina",
    createdAt: "2026-01-22T20:10:00.000Z",
  },
  {
    id: "review-hand-balm-2",
    productId: "hand-balm",
    rating: 5,
    quote: "الكريم ده عملي جدًا في الشنطة، بحطه بعد السanitizer وإيدي بترجع طرية بسرعة.",
    author: "سلمى",
    createdAt: "2026-01-27T16:22:00.000Z",
  },
  {
    id: "review-lip-balm-1",
    productId: "lip-balm",
    rating: 5,
    quote: "خفيف ومش لازق، وفرق معايا في تشققات الشفايف من أول يومين.",
    author: "ملك",
    createdAt: "2026-02-01T11:18:00.000Z",
  },
  {
    id: "review-body-soap-1",
    productId: "calm-glow-body-soap",
    rating: 4,
    quote: "الصابونة ريحتها نضيفة وبتسيب الجلد مشدود بس مش ناشف، عجبتني جدًا.",
    author: "منة",
    createdAt: "2026-02-04T19:27:00.000Z",
  },
  {
    id: "review-body-balm-3",
    productId: "body-balm",
    rating: 5,
    quote: "كنت خايفة يكون تقيل، بس بيتفرد بسهولة وبيخلي الجلد ملمسه أهدى.",
    author: "Hana",
    createdAt: "2026-02-09T08:55:00.000Z",
  },
  {
    id: "review-hair-shine-1",
    productId: "hair-shine-oil",
    rating: 5,
    quote: "نقطتين بس بعد السيشوار خلو الشعر شكله أطرى والهيشان قل جامد.",
    author: "ريم",
    createdAt: "2026-02-13T17:04:00.000Z",
  },
  {
    id: "review-hand-balm-3",
    productId: "hand-balm",
    rating: 4,
    quote: "مناسب جدًا للاستخدام خلال اليوم، مش محتاجة أستنى كتير عشان أرجع أمسك الموبايل.",
    author: "دينا",
    createdAt: "2026-02-18T12:36:00.000Z",
  },
  {
    id: "review-body-balm-4",
    productId: "body-balm",
    rating: 5,
    quote: "بعد أسبوع استخدام حسيت المناطق الجافة في رجلي بقت أنعم بفرق واضح.",
    author: "يارا",
    createdAt: "2026-02-21T21:49:00.000Z",
  },
  {
    id: "review-soap-2",
    productId: "silk-blossom-body-soap",
    rating: 4,
    quote: "الرغوة ناعمة ومش بتسحب ترطيب الجلد، والريحة فايقة بس مش مزعجة.",
    author: "نور",
    createdAt: "2026-02-26T15:12:00.000Z",
  },
  {
    id: "review-hair-bundle-2",
    bundleId: "hair-strength-ritual",
    rating: 5,
    quote: "الروتين منظم وسهل، حسيت إني عارفة أستخدم كل حاجة إمتى من غير لخبطة.",
    author: "جنى",
    createdAt: "2026-03-02T10:44:00.000Z",
  },
  {
    id: "review-body-balm-5",
    productId: "body-balm",
    rating: 5,
    quote: "الملمس فاخر بس مش مبالغ فيه، وبيدي لمعة صحية حلوة من غير ما يبقى مزيت.",
    author: "Farida",
    createdAt: "2026-03-06T18:20:00.000Z",
  },
  {
    id: "review-lip-balm-2",
    productId: "lip-balm",
    rating: 4,
    quote: "حلو تحت الروج ومش بيكور، بس كنت أتمنى ريحته تكون أخف سنة بسيطة.",
    author: "هبة",
    createdAt: "2026-03-11T14:02:00.000Z",
  },
  {
    id: "review-hand-lip-bundle-1",
    bundleId: "hand-lip-softness",
    rating: 5,
    quote: "الكومبو ده لطيف جدًا، الإيدين والشفايف بقوا دايمًا مترطبين معايا في الشنطة.",
    author: "ليلى",
    createdAt: "2026-03-15T09:30:00.000Z",
  },
  {
    id: "review-hair-growth-2",
    productId: "hair-growth-oil",
    rating: 5,
    quote: "بحطه قبل الغسيل بساعتين، والفروة بقت أهدى والحكة قلت جدًا.",
    author: "أميرة",
    createdAt: "2026-03-19T22:16:00.000Z",
  },
  {
    id: "review-body-soap-3",
    productId: "calm-glow-body-soap",
    rating: 5,
    quote: "من المنتجات اللي بتحسسك إن الشاور بقى أهدى، والجلد بعده مش محتاج ترطيب كتير.",
    author: "مريم",
    createdAt: "2026-03-24T13:58:00.000Z",
  },
  {
    id: "review-body-balm-6",
    productId: "body-balm",
    rating: 4,
    quote: "جميل بعد إزالة الشعر، هدى الاحمرار بسرعة ومسببليش أي لسعة.",
    author: "نادية",
    createdAt: "2026-03-29T16:43:00.000Z",
  },
  {
    id: "review-hair-shine-2",
    productId: "hair-shine-oil",
    rating: 5,
    quote: "الشعر بيبان ألمع من غير ما يهبط، وده أهم حاجة بالنسبة لي.",
    author: "Mariam",
    createdAt: "2026-04-02T11:09:00.000Z",
  },
  {
    id: "review-hand-balm-4",
    productId: "hand-balm",
    rating: 5,
    quote: "إيدي بتتنشف بسرعة من الشغل، ده الوحيد اللي حسيت ترطيبه بيكمل معايا.",
    author: "بسنت",
    createdAt: "2026-04-06T20:24:00.000Z",
  },
  {
    id: "review-body-bundle-1",
    bundleId: "body-calm-glow",
    rating: 5,
    quote: "البادي بلم مع الصابونة عاملين روتين بسيط بس نتيجته واضحة في النعومة.",
    author: "آية",
    createdAt: "2026-04-10T08:37:00.000Z",
  },
  {
    id: "review-lip-balm-3",
    productId: "lip-balm",
    rating: 5,
    quote: "بيسيب الشفايف شكلها صحي، ومش محتاجة أعيده كل شوية.",
    author: "سارة",
    createdAt: "2026-04-14T17:51:00.000Z",
  },
  {
    id: "review-soap-4",
    productId: "silk-blossom-body-soap",
    rating: 4,
    quote: "ريحة نضيفة وناعمة، حسيتها مناسبة للصبح أكتر عشان بتفوق.",
    author: "رنا",
    createdAt: "2026-04-18T12:12:00.000Z",
  },
  {
    id: "review-hair-growth-3",
    productId: "hair-growth-oil",
    rating: 5,
    quote: "مش بيسيب طبقة تقيلة على الشعر، وبغسله بسهولة بعد الماسك.",
    author: "ياسمين",
    createdAt: "2026-04-22T19:05:00.000Z",
  },
  {
    id: "review-hand-balm-5",
    productId: "hand-balm",
    rating: 4,
    quote: "الحجم مناسب والخطوة نفسها سريعة، بس نفسي يبقى في منه حجم أكبر.",
    author: "كريم",
    createdAt: "2026-04-25T15:40:00.000Z",
  },
  {
    id: "review-body-balm-7",
    productId: "body-balm",
    rating: 5,
    quote: "أكتر حاجة عجبتني إنه بيرطب من غير ما يوسخ الهدوم أو يسيب أثر.",
    author: "Noha",
    createdAt: "2026-04-28T10:26:00.000Z",
  },
  {
    id: "review-hair-bundle-3",
    bundleId: "hair-strength-ritual",
    rating: 5,
    quote: "بعد شهر حسيت الروتين ثابت ونتيجته بتبان في اللمعة والملمس.",
    author: "فاطمة",
    createdAt: "2026-05-01T21:33:00.000Z",
  },
  {
    id: "review-body-bundle-2",
    bundleId: "body-calm-glow",
    rating: 5,
    quote: "طلبته تاني عشان فعلاً بقى جزء من روتيني، خصوصًا بعد الشاور بالليل.",
    author: "هاجر",
    createdAt: "2026-05-03T18:07:00.000Z",
  },
];

export const ritualStories: RitualStory[] = [];
