import type { ObjectId } from "mongodb";

export interface Product {
  _id?: ObjectId | string;
  name: string;
  price: number;
}
