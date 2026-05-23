import bodySoapOne from "../assets/BodySoap1.jpg";
import bodySoapTwo from "../assets/BodySoap2.png";
import bodyBalmImage from "../assets/BodyBalmEnhanced1.jpg";
import handBalmImage from "../assets/HandBalmEnhanced.jpg";
import hairGrowthImage from "../assets/HairGrowthEnhanced.jpg";
import hairShineImage from "../assets/HairShineEnhanced.jpg";
import lipBalmImage from "../assets/LipBalm.jpg";
export interface CatalogProduct {
  id: number;
  title: string;
  titleAr?: string;
  desc: string;
  descAr?: string;
  size: string;
  price: number;
  compareAtPrice: number;
  discountPercentage: number;
  image: string;
  category: string;
}

export const PRODUCTS: CatalogProduct[] = [
  {
    id: 1,
    title: "Calm & Glow Body Soap",
    titleAr: "صابون الجسم سكينة وتوهج",
    desc: "Soothing chamomile and neroli calm the skin while mica pearls add a soft glow.",
    descAr: "البابونج المهدئ والنيرولي يهدئان البشرة بينما تمنح لآلئ الميكا توهجاً ناعماً.",
    size: "100g",
    price: 75,
    compareAtPrice: 109,
    discountPercentage: 30,
    image: bodySoapOne,
    category: "cleansing",
  },
  {
    id: 2,
    title: "Silk Blossom Body Soap",
    titleAr: "صابون الجسم زهر الحرير",
    desc: "Infused with jasmine petals for a velvety cleanse and lingering floral aura.",
    descAr: "مُعزّز ببتلات الياسمين لتنظيف مخملي وعطر زهري يدوم.",
    size: "100g",
    price: 75,
    compareAtPrice: 109,
    discountPercentage: 30,
    image: bodySoapTwo,
    category: "cleansing",
  },
  {
    id: 3,
    title: "Lip Balm",
    titleAr: "بلسم الشفاه",
    desc: "A 10 ml daily balm that cushions lips with lasting moisture.",
    descAr: "بلسم يومي بحجم 10 مل يغلّف الشفاه بترطيب يدوم.",
    size: "10ml",
    price: 65,
    compareAtPrice: 95,
    discountPercentage: 30,
    image: lipBalmImage,
    category: "treatment",
  },
  {
    id: 4,
    title: "Hair Shine & Anti-Frizz Oil",
    titleAr: "زيت لمعان الشعر ومضاد للهيشان",
    desc: "Silica-rich formula that seals cuticles for mirror-like gloss without weight.",
    descAr: "تركيبة غنية بالسيليكا تُغلق القشرة لتوهج يشبه المرآة دون ثقل.",
    size: "30ml",
    price: 139,
    compareAtPrice: 199,
    discountPercentage: 30,
    image: hairShineImage,
    category: "finisher",
  },
  {
    id: 5,
    title: "Hair Shine & Anti-Frizz Oil",
    titleAr: "زيت لمعان الشعر ومضاد للهيشان",
    desc: "Silica-rich formula that seals cuticles for mirror-like gloss without weight.",
    descAr: "تركيبة غنية بالسيليكا تُغلق القشرة لتوهج يشبه المرآة دون ثقل.",
    size: "50ml",
    price: 229,
    compareAtPrice: 329,
    discountPercentage: 30,
    image: hairShineImage,
    category: "finisher",
  },
  {
    id: 6,
    title: "Hair Growth Oil",
    titleAr: "زيت نمو الشعر",
    desc: "Lightweight elixir powered by rosemary stem cells and biotin to fortify roots.",
    descAr: "إكسير خفيف يدعم الجذور بخلايا جذعية إكليل الجبل والبيوتين.",
    size: "30ml",
    price: 149,
    compareAtPrice: 215,
    discountPercentage: 30,
    image: hairGrowthImage,
    category: "treatment",
  },
  {
    id: 7,
    title: "Hair Growth Oil",
    titleAr: "زيت نمو الشعر",
    desc: "Lightweight elixir powered by rosemary stem cells and biotin to fortify roots.",
    descAr: "إكسير خفيف يدعم الجذور بخلايا جذعية إكليل الجبل والبيوتين.",
    size: "50ml",
    price: 249,
    compareAtPrice: 359,
    discountPercentage: 30,
    image: hairGrowthImage,
    category: "treatment",
  },
  {
    id: 8,
    title: "Hand Balm",
    titleAr: "بلسم اليدين",
    desc: "Fast-absorbing restorative balm that cushions hands with botanical ceramides.",
    descAr: "بلسم مُرمّم سريع الامتصاص يلين اليدين بسيراميدات نباتية.",
    size: "30ml",
    price: 179,
    compareAtPrice: 259,
    discountPercentage: 30,
    image: handBalmImage,
    category: "treatment",
  },
  {
    id: 9,
    title: "Hand Balm",
    titleAr: "بلسم اليدين",
    desc: "Fast-absorbing restorative balm that cushions hands with botanical ceramides.",
    descAr: "بلسم مُرمّم سريع الامتصاص يلين اليدين بسيراميدات نباتية.",
    size: "50ml",
    price: 289,
    compareAtPrice: 415,
    discountPercentage: 30,
    image: handBalmImage,
    category: "treatment",
  },
  {
    id: 10,
    title: "Body Balm",
    titleAr: "بلسم الجسم",
    desc: "A concentrated butter blend that melts on contact to replenish deep hydration.",
    descAr: "مزيج زبدة مركّز يذوب عند اللمس ليعيد الترطيب العميق.",
    size: "30ml",
    price: 179,
    compareAtPrice: 259,
    discountPercentage: 30,
    image: bodyBalmImage,
    category: "moisturizer",
  },
  {
    id: 11,
    title: "Body Balm",
    titleAr: "بلسم الجسم",
    desc: "A concentrated butter blend that melts on contact to replenish deep hydration.",
    descAr: "مزيج زبدة مركّز يذوب عند اللمس ليعيد الترطيب العميق.",
    size: "50ml",
    price: 289,
    compareAtPrice: 415,
    discountPercentage: 30,
    image: bodyBalmImage,
    category: "moisturizer",
  },
];

export type CatalogProductIndex = Record<number, CatalogProduct>;

export const PRODUCT_INDEX: CatalogProductIndex = PRODUCTS.reduce<CatalogProductIndex>((acc, product) => {
  acc[product.id] = product;
  return acc;
}, {});
