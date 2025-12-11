import type { IncomingMessage, ServerResponse } from "http";
import { AuthService } from "../../src/auth/AuthService";
import { buildTestUserRepository } from "../../src/users/InMemoryUserRepository";

type Request = IncomingMessage & { method?: string; body?: any };
type Response = ServerResponse & { status: (code: number) => Response; json: (payload: unknown) => void };

const seededUsers = [{ id: "server-user", email: "user@example.com", name: "Server User" }];
const authService = new AuthService(buildTestUserRepository(seededUsers));

export async function loginHandler(req: Request, res: Response) {
  try {
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "POST,OPTIONS");
      return res.status(204).end();
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).end("Method Not Allowed");
    }

    const email = (req.body?.email ?? "").trim();
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const token = await authService.login(email);
    return res.status(200).json({ token });
  } catch (error: any) {
    if (error?.message === "Invalid credentials") {
      return res.status(401).json({ error: error.message });
    }
    return res.status(error?.statusCode ?? 500).json({ error: error?.message ?? "Server error" });
  }
}
