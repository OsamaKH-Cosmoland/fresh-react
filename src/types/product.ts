export interface Product {
  id: number;
  title: string;
  desc: string;
  price: string;
  image?: string;
  category?: string;
}

export type ProductIndex = Record<number, Product>;
