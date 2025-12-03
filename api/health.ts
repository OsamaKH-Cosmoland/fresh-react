import healthHandler from "./lib/http/healthHandler";
import { enhanceApiResponse } from "./lib/http/responseHelpers";

export default function handler(req: Parameters<typeof healthHandler>[0], res: Parameters<typeof healthHandler>[1]) {
  enhanceApiResponse(res);
  return healthHandler(req, res);
}
