// HTTP adapter for products CRUD endpoints.
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../../../application/usecases/products";
import { getLogger } from "@/logging/globalLogger";
import { TOKENS, appContainer } from "../../../application/services/AppContainer";
import { Request, Response } from "./typeHandler";

export default async function productsHandler(req: Request, res: Response) {
  const requestScope = appContainer.createScope();
  const cache = requestScope.resolve(TOKENS.cache);
  try {
    if (req.method === "GET") {
      const clean = await listProducts({ cache });
      return res.status(200).json(clean);
    }

    if (req.method === "POST") {
      const created = await createProduct(req.body);
      return res.status(201).json(created);
    }

    if (req.method === "DELETE") {
      const id = req.query?.id;
      const result = await deleteProduct(id);
      return id ? res.status(204).end() : res.status(200).json(result);
    }

    if (req.method === "PUT") {
      const id = req.query?.id;
      const updated = await updateProduct(id || "", req.body);
      return res.status(200).json(updated);
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
    return res.status(405).end("Method Not Allowed");
  } catch (err: any) {
    getLogger().error("API /api/products error", { error: err });
    const statusCode = err?.statusCode ?? 500;
    return res.status(statusCode).json({ error: err?.message ?? "Server error" });
  }
}
