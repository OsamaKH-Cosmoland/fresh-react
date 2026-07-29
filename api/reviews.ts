import { enhanceApiResponse, normalizeServerlessRequest, reviewsHandler } from "./http-barrel.js";
import { withSentry } from "../src/infrastructure/monitoring/sentry.js";

async function reviewsRoute(
  req: Parameters<typeof reviewsHandler>[0],
  res: Parameters<typeof reviewsHandler>[1]
) {
  await normalizeServerlessRequest(req as any);
  enhanceApiResponse(res as any);
  return reviewsHandler(req as any, res as any);
}

export default withSentry(reviewsRoute, "/api/reviews");
