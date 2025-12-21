import bodySoapOne from "../assets/BodySoap1.jpg";
import bodySoapTwo from "../assets/BodySoap2.png";
import bodyBalmImage from "../assets/BodyBalmEnhanced1.jpg";
import handBalmImage from "../assets/HandBalmEnhanced.jpg";
import hairGrowthImage from "../assets/HairGrowthEnhanced.jpg";
import hairShineImage from "../assets/HairShineEnhanced.jpg";
export interface CatalogProduct {
  id: number;
  title: string;
  titleAr?: string;
  desc: string;
  descAr?: string;
  price: string;
  image: string;
  category: string;
}

export const PRODUCTS: CatalogProduct[] = [
  {
    id: 1,
    title: "Silk Blossom Body Soap",
    titleAr: "صابون الجسم زهر الحرير",
    desc: "Infused with jasmine petals for a velvety cleanse and lingering floral aura.",
    descAr: "مُعزّز ببتلات الياسمين لتنظيف مخملي وعطر زهري يدوم.",
    price: "231.99 EGP",
    image: bodySoapTwo,
    category: "cleansing",
  },
  {
    id: 2,
    title: "Calm & Glow Body Soap",
    titleAr: "صابون الجسم سكينة وتوهج",
    desc: "Soothing chamomile and neroli calm the skin while mica pearls add a soft glow.",
    descAr: "البابونج المهدئ والنيرولي يهدئان البشرة بينما تمنح لآلئ الميكا توهجاً ناعماً.",
    price: "228.99 EGP",
    image: bodySoapOne,
    category: "cleansing",
  },
  {
    id: 3,
    title: "Body Balm",
    titleAr: "بلسم الجسم",
    desc: "A concentrated butter blend that melts on contact to replenish deep hydration.",
    descAr: "مزيج زبدة مركّز يذوب عند اللمس ليعيد الترطيب العميق.",
    price: "197.99 EGP",
    image: bodyBalmImage,
    category: "moisturizer",
  },
  {
    id: 4,
    title: "Hand Balm",
    titleAr: "بلسم اليدين",
    desc: "Fast-absorbing restorative balm that cushions hands with botanical ceramides.",
    descAr: "بلسم مُرمّم سريع الامتصاص يلين اليدين بسيراميدات نباتية.",
    price: "195.99 EGP",
    image: handBalmImage,
    category: "treatment",
  },
  {
    id: 5,
    title: "Hair Growth Oil",
    titleAr: "زيت نمو الشعر",
    desc: "Lightweight elixir powered by rosemary stem cells and biotin to fortify roots.",
    descAr: "إكسير خفيف يدعم الجذور بخلايا جذعية إكليل الجبل والبيوتين.",
    price: "229.99 EGP",
    image: hairGrowthImage,
    category: "treatment",
  },
  {
    id: 6,
    title: "Hair Shine & Anti-Frizz Oil",
    titleAr: "زيت لمعان الشعر ومضاد للهيشان",
    desc: "Silica-rich formula that seals cuticles for mirror-like gloss without weight.",
    descAr: "تركيبة غنية بالسيليكا تُغلق القشرة لتوهج يشبه المرآة دون ثقل.",
    price: "196.99 EGP",
    image: hairShineImage,
    category: "finisher",
  },
];

export type CatalogProductIndex = Record<number, CatalogProduct>;

export const PRODUCT_INDEX: CatalogProductIndex = PRODUCTS.reduce<CatalogProductIndex>((acc, product) => {
  acc[product.id] = product;
  return acc;
}, {});
