import { getLogger } from "@/logging/globalLogger";
import { TOKENS, appContainer } from "../../../application/services/AppContainer";
import type { Request, Response } from "./typeHandler";

export async function getUsersHandler(req: Request, res: Response) {
  try {
    const requestScope = appContainer.createScope();

    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "GET,PUT,DELETE,OPTIONS");
      return res.status(204).end();
    }

    const userRepository = requestScope.resolve(TOKENS.userRepository);

    if (req.method === "GET") {
      const users = await userRepository.listAll();
      return res.status(200).json({ users });
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body ?? {};
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing user id" });
      }
      const updated = await userRepository.updateById(id, updates);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      const stored = await userRepository.findById(id);
      if (!stored) {
        return res.status(500).json({ error: "Failed to read updated user" });
      }
      return res.status(200).json({ user: stored });
    }

    if (req.method === "DELETE") {
      const { id } = req.body ?? {};
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Missing user id" });
      }
      const existing = await userRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }
      await userRepository.deleteById(id);
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET,PUT,DELETE");
    return res.status(405).end("Method Not Allowed");
  } catch (error) {
    getLogger().error("API /api/users error", { error });
    return res.status((error as any)?.statusCode ?? 500).json({
      error: (error as any)?.message ?? "Server error",
    });
  }
}
