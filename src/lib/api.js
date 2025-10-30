// src/lib/api.js
// Works locally (VITE_API_BASE_URL=http://localhost:3000/api)
// and on Vercel (defaults to same-origin /api)
const BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export const apiGet = (path, init) =>
  fetch(`${BASE}${path}`, { ...init });

export const apiPost = (path, body, init) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });

export const apiDelete = (path, init) =>
  fetch(`${BASE}${path}`, { method: "DELETE", ...init });

export const apiPut = (path, body, init) =>
  fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });

// Expose BASE for places that need a full URL (e.g., EventSource)
export const API_BASE = BASE;
