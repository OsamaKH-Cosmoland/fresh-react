import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { createFruit, deleteFruit, listFruits, updateFruit } from "../server/services/fruits";

type ServerlessRequest = IncomingMessage & { method?: string; body?: any; query?: Record<string, string>; url?: string };
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

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);

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
