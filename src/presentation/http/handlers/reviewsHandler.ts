// HTTP adapter for reviews endpoints.
import { createReview, listReviews } from "../../../application/usecases/reviews";
import { getLogger } from "@/logging/globalLogger";
import { Request, Response } from "./typeHandler";

export default async function reviewsHandler(req: Request, res: Response) {
  try {
    if (req.method === "GET") {
      const limitParam = Number.parseInt(req.query?.limit ?? "50", 10);
      const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 50;
      const docs = await listReviews(limit);
      return res.status(200).json(docs);
    }

    if (req.method === "POST") {
      const saved = await createReview(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return res.status(201).json(saved);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error: any) {
    getLogger().error("API /api/reviews error", { error });
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({ error: error?.message ?? "Server error" });
  }
}
