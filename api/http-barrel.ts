export {
  buildOrdersHandler,
  notifyTestHandler,
  streamOrdersHandler,
} from "../src/presentation/http/handlers/ordersHandler.js";

export { default as reviewsHandler } from "../src/presentation/http/handlers/reviewsHandler.js";
export { default as productsHandler } from "../src/presentation/http/handlers/productsHandler.js";
export { default as healthHandler } from "../src/presentation/http/handlers/healthHandler.js";
export { default as orderCreatedWebhookHandler } from "../src/presentation/http/handlers/orderCreatedWebhookHandler.js";

export { enhanceApiResponse } from "../src/presentation/http/responseHelpers.js";
export { normalizeServerlessRequest } from "../src/presentation/http/serverlessHelpers.js";
