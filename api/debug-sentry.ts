// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY — Sentry verification endpoint.  Route: /api/debug-sentry
//
// Use this once to confirm Sentry is wired up, then DELETE THIS FILE.
//   • GET /api/debug-sentry          → sends a test event, returns 200 + JSON.
//   • GET /api/debug-sentry?throw=1  → throws so the withSentry wrapper's
//                                       uncaught-error path is exercised (500).
// After you see the event in your Sentry dashboard's "Issues", remove this file.
// ─────────────────────────────────────────────────────────────────────────────
import * as Sentry from "@sentry/node";
import { withSentry, flushSentry } from "../src/infrastructure/monitoring/sentry.js";
import { enhanceApiResponse } from "./http-barrel.js";

async function debugSentryRoute(req: any, res: any) {
  enhanceApiResponse(res);

  const shouldThrow = /[?&]throw=1\b/.test(String(req?.url ?? ""));
  if (shouldThrow) {
    // Exercises the wrapper: captured by withSentry, flushed, returned as 500.
    throw new Error("Sentry debug: intentional uncaught test error");
  }

  const eventId = Sentry.captureException(new Error("Sentry debug: manual test event"));
  await flushSentry();

  const dsnConfigured = Boolean(process.env.SENTRY_DSN);
  return res.status(200).json({
    ok: true,
    dsnConfigured,
    eventId: eventId ?? null,
    message: dsnConfigured
      ? "Test event sent to Sentry. Check your project's Issues in a few seconds."
      : "SENTRY_DSN is not set, so nothing was sent. Set it (locally in .env, or in the Vercel dashboard) and retry.",
  });
}

export default withSentry(debugSentryRoute, "/api/debug-sentry");
