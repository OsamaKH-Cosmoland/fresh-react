import { healthHandler, enhanceApiResponse } from "./http-barrel.js";
import { withSentry } from "../src/infrastructure/monitoring/sentry.js";

function healthRoute(req: Parameters<typeof healthHandler>[0], res: Parameters<typeof healthHandler>[1]) {
  enhanceApiResponse(res);
  return healthHandler(req, res);
}

export default withSentry(healthRoute, "/api/health");
