/* eslint-env node */

import "dotenv/config";
import { connectToDb } from "./_db.js";

const sanitizeString = (value, { maxLength = 500 } = {}) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, maxLength);
};

const clampRating = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(5, Math.max(1, Math.round(number)));
};

const cleanReviewDoc = ({ _id, ...rest }) => ({
  mongoId: _id?.toString(),
  ...rest,
});

export default async function reviewsHandler(req, res) {
  try {
    const { db } = await connectToDb();
    const col = db.collection("reviews");

    if (req.method === "GET") {
      const limitParam = Number.parseInt(req.query?.limit ?? "50", 10);
      const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 50;
      const docs = await col
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return res.status(200).json(docs.map(cleanReviewDoc));
    }

    if (req.method === "POST") {
      const raw = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const name = sanitizeString(raw?.name ?? "Anonymous", { maxLength: 80 }) || "Anonymous";
      const message = sanitizeString(raw?.message, { maxLength: 1000 });
      const rating = clampRating(raw?.rating);
      if (!rating || !message) {
        return res.status(400).json({ error: "Rating (1-5) and message are required." });
      }

      const doc = {
        name,
        message,
        rating,
        createdAt: new Date().toISOString(),
      };
      const result = await col.insertOne(doc);
      const saved = { ...doc, mongoId: result.insertedId.toString() };
      return res.status(201).json(saved);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("API /api/reviews error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
