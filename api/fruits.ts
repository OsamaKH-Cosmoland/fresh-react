import fruitsHandler from "./http/fruitsHandler";
import { enhanceApiResponse } from "./http/responseHelpers";
import { normalizeServerlessRequest } from "./http/serverlessHelpers";

export default async function handler(req: Parameters<typeof fruitsHandler>[0], res: Parameters<typeof fruitsHandler>[1]) {
  await normalizeServerlessRequest(req);
  enhanceApiResponse(res);
  return fruitsHandler(req, res);
}
