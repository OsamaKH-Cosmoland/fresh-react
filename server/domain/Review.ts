import type { ObjectId } from "mongodb";

export interface Review {
  _id?: ObjectId;
  mongoId?: string;
  name: string;
  message: string;
  rating: number;
  createdAt: string;
}
