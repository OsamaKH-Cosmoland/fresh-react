import reviewsHandler from "./lib/http/reviewsHandler";
import { enhanceApiResponse } from "./lib/http/responseHelpers";
import { normalizeServerlessRequest } from "./lib/http/serverlessHelpers";

export default async function handler(req: Parameters<typeof reviewsHandler>[0], res: Parameters<typeof reviewsHandler>[1]) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return reviewsHandler(req, res);
}
