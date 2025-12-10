type MetaEnv = Partial<Record<string, string | undefined>>;
const resolvedEnv: MetaEnv =
  typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined"
    ? (import.meta.env as MetaEnv)
    : (process.env as MetaEnv);

const BASE = (resolvedEnv.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export const apiGet = (path: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, { ...init });

export const apiPost = (path: string, body: unknown, init?: RequestInit) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });

export const apiDelete = (path: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, { method: "DELETE", ...init });

export const apiPut = (path: string, body: unknown, init?: RequestInit) =>
  fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });

// Expose BASE for places that need a full URL (e.g., EventSource)
export const API_BASE = BASE;
