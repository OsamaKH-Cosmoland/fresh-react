import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { connectToDb } from "../server/_db";
import type { Review } from "../server/domain/Review";

type ServerlessRequest = IncomingMessage & {
  body?: any;
  query?: Record<string, string>;
  url?: string;
  method?: string;
};
type ServerlessResponse = ServerResponse & {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => ServerlessResponse;
};

const parseRequestBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  }).catch(() => {});
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
};

async function normalizeServerlessRequest(req: ServerlessRequest) {
  const base = `http://${req.headers.host ?? "localhost"}`;
  const parsedUrl = new URL(req.url ?? "/", base);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  if (req.method && req.method !== "GET") {
    req.body = await parseRequestBody(req);
  } else {
    req.body = {};
  }
  return req;
}

function enhanceApiResponse(res: ServerlessResponse) {
  if (!res.status) {
    (res as any).status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    (res as any).json = (payload: unknown) => {
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }
}

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

async function listReviews(limit: number) {
  const { db } = await connectToDb();
  const col = db.collection<Review>("reviews");
  const docs = await col
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(cleanReviewDoc);
}

async function createReview(raw: any) {
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


export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);

  try {
    if (req.method === "GET") {
      const limitParam = Number.parseInt(req.query?.limit ?? "50", 10);
      const limit = Number.isFinite(limitParam)
        ? Math.max(1, Math.min(limitParam, 200))
        : 50;
      const docs = await listReviews(limit);
      return res.status(200).json(docs);
    }

    if (req.method === "POST") {
      const saved = await createReview(
        typeof req.body === "string" ? JSON.parse(req.body) : req.body
      );
      return res.status(201).json(saved);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error: any) {
    console.error("API /api/reviews error:", error);
    const statusCode = error?.statusCode ?? 500;
    return res
      .status(statusCode)
      .json({ error: error?.message ?? "Server error" });
  }
}
