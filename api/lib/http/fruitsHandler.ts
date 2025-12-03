// HTTP adapter for fruits CRUD endpoints.
import type { IncomingMessage, ServerResponse } from "http";
import { createFruit, deleteFruit, listFruits, updateFruit } from "../../server/services/fruits";

type Request = IncomingMessage & { method?: string; body?: any; query?: Record<string, string> };
type Response = ServerResponse & { status: (code: number) => Response; json: (payload: unknown) => void };

export default async function fruitsHandler(req: Request, res: Response) {
  try {
    if (req.method === "GET") {
      const clean = await listFruits();
      return res.status(200).json(clean);
    }

    if (req.method === "POST") {
      const created = await createFruit(req.body);
      return res.status(201).json(created);
    }

    if (req.method === "DELETE") {
      const id = req.query?.id;
      const result = await deleteFruit(id);
      return id ? res.status(204).end() : res.status(200).json(result);
    }

    if (req.method === "PUT") {
      const id = req.query?.id;
      const updated = await updateFruit(id || "", req.body);
      return res.status(200).json(updated);
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
    return res.status(405).end("Method Not Allowed");
  } catch (err: any) {
    console.error("API /api/fruits error:", err);
    const statusCode = err?.statusCode ?? 500;
    return res.status(statusCode).json({ error: err?.message ?? "Server error" });
  }
}
