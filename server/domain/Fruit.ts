import type { ObjectId } from "mongodb";

export interface Fruit {
  _id?: ObjectId | string;
  name: string;
  price: number;
}
