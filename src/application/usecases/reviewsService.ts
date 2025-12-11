// Review services: validation and persistence.
import "dotenv/config";
import type { Review } from "../../domain/shared/Review";
import { connectToDb } from "../../infrastructure/repositories/_db";

const sanitizeString = (value: unknown, { maxLength = 500 } = {}): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, maxLength);
};

const clampRating = (value: unknown): number | null => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(5, Math.max(1, Math.round(number)));
};

const cleanReviewDoc = ({ _id, ...rest }: any) => ({
  mongoId: _id?.toString(),
  ...rest,
});

export async function listReviews(limit: number) {
  const { db } = await connectToDb();
  const col = db.collection<Review>("reviews");
  const docs = await col
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(cleanReviewDoc);
}

export async function createReview(raw: any) {
  const { db } = await connectToDb();
  const col = db.collection<Review>("reviews");
  const name = sanitizeString(raw?.name ?? "Anonymous", { maxLength: 80 }) || "Anonymous";
  const message = sanitizeString(raw?.message, { maxLength: 1000 });
  const rating = clampRating(raw?.rating);
  if (!rating || !message) {
    const err: any = new Error("Rating (1-5) and message are required.");
    err.statusCode = 400;
    throw err;
  }

  const doc: Review = {
    name,
    message,
    rating,
    createdAt: new Date().toISOString(),
  };
  const result = await col.insertOne(doc);
  const saved = { ...doc, mongoId: result.insertedId.toString() };
  return saved;
}
