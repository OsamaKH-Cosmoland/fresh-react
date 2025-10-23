import soapImage from "../assets/soap.png";
import bodyBalmImage from "../assets/BodyBalm.png";
import handBalmImage from "../assets/HandBalm.png";
import hairGrowthImage from "../assets/HairGrowth.png";
import hairShineImage from "../assets/HairShine.png";

export const PRODUCTS = [
  {
    id: 1,
    title: "Silk Blossom Body Soap",
    desc: "Infused with jasmine petals for a velvety cleanse and lingering floral aura.",
    price: "231.99 EGP",
    image: soapImage,
    category: "cleansing",
  },
  {
    id: 2,
    title: "Calm & Glow Body Soap",
    desc: "Soothing chamomile and neroli calm the skin while mica pearls add a soft glow.",
    price: "228.99 EGP",
    image: soapImage,
    category: "cleansing",
  },
  {
    id: 3,
    title: "Body Balm",
    desc: "A concentrated butter blend that melts on contact to replenish deep hydration.",
    price: "197.99 EGP",
    image: bodyBalmImage,
    category: "moisturizer",
  },
  {
    id: 4,
    title: "Hand Balm",
    desc: "Fast-absorbing restorative balm that cushions hands with botanical ceramides.",
    price: "195.99 EGP",
    image: handBalmImage,
    category: "treatment",
  },
  {
    id: 5,
    title: "Hair Growth Oil",
    desc: "Lightweight elixir powered by rosemary stem cells and biotin to fortify roots.",
    price: "229.99 EGP",
    image: hairGrowthImage,
    category: "treatment",
  },
  {
    id: 6,
    title: "Hair Shine & Anti-Frizz Oil",
    desc: "Silica-rich formula that seals cuticles for mirror-like gloss without weight.",
    price: "196.99 EGP",
    image: hairShineImage,
    category: "finisher",
  },
];

export const PRODUCT_INDEX = PRODUCTS.reduce((acc, product) => {
  acc[product.id] = product;
  return acc;
}, {});
