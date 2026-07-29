import * as Sentry from "@sentry/node";
import { getLogger, setLogger } from "../../logging/globalLogger.js";
import { SentryLogger } from "../logging/SentryLogger.js";

let initialized = false;
let sentryEnabled = false;

/**
 * Initializes Sentry exactly once per process (i.e. once per serverless cold
 * start). The DSN is read from the `SENTRY_DSN` environment variable. When no
 * DSN is set — e.g. local development — this is a safe no-op, so the app keeps
 * working with zero Sentry overhead.
 *
 * On success it also swaps the global logger for a {@link SentryLogger}, so
 * every `getLogger().error(...)` across the codebase is reported to Sentry.
 */
export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    getLogger().warn("[sentry] SENTRY_DSN not set; error monitoring disabled");
    return;
  }

  const tracesRaw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  const tracesSampleRate = tracesRaw !== undefined ? Number(tracesRaw) : undefined;

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV ??
      "production",
    release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
    // Error monitoring only by default. Set SENTRY_TRACES_SAMPLE_RATE to enable
    // performance tracing (e.g. 0.1 for 10% of requests).
    ...(tracesSampleRate !== undefined && Number.isFinite(tracesSampleRate)
      ? { tracesSampleRate }
      : {}),
  });

  setLogger(new SentryLogger(getLogger()));
  sentryEnabled = true;
  getLogger().info("[sentry] initialized");
}

/**
 * Sends any buffered Sentry events. This is essential on serverless platforms,
 * where the process can be frozen or killed the instant a response is returned —
 * without a flush, pending errors would be lost.
 */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!sentryEnabled) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch {
    // Ignore flush failures; they must not affect the response.
  }
}

type ServerlessHandler = (req: any, res: any) => unknown | Promise<unknown>;

/**
 * Wraps a serverless function so that, for every invocation:
 *   1. Sentry is initialized (once, guarded) before the handler runs;
 *   2. any error that escapes the handler is captured; and
 *   3. buffered events are flushed before the function shuts down.
 *
 * Existing handler behavior — responses, status codes, streaming — is left
 * untouched. Errors that a handler catches internally are already reported via
 * the global logger; this wrapper is the safety net for anything uncaught, plus
 * the guaranteed init + flush.
 */
export function withSentry<H extends ServerlessHandler>(handler: H, endpoint?: string): H {
  const wrapped = async (req: any, res: any): Promise<unknown> => {
    initSentry();
    try {
      return await handler(req, res);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          endpoint: endpoint ?? (typeof req?.url === "string" ? req.url : "unknown"),
        },
      });
      throw error;
    } finally {
      await flushSentry();
    }
  };
  return wrapped as unknown as H;
}
