const ORDER_ENDPOINT = "/api/order-created";

/**
 * @typedef {Object} OrderItem
 * @property {string} title
 * @property {number} quantity
 */

/**
 * @typedef {Object} OrderPayload
 * @property {string} orderId
 * @property {string} orderNumber
 * @property {string} email
 * @property {string} customerName
 * @property {OrderItem[]} items
 * @property {number} total
 * @property {string} currency
 */

/**
 * Sends a sanitized order payload to the backend webhook.
 * @param {OrderPayload} order
 * @returns {Promise<Record<string, unknown>>}
 */
export async function sendOrderToN8N(order) {
  const response = await fetch(ORDER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || data?.ok !== true) {
    console.error("[orders] Failed to send order", { status: response.status, data });
    throw new Error(data?.error || `Failed to send order (status ${response.status})`);
  }

  return data;
}

export { ORDER_ENDPOINT };
