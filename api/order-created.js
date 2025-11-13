// /api/order-created.js
export default async function handler(req, res) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; // set to your site origin in Vercel for production

  // CORS
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    // Parse JSON safely (Vercel may already parse; guard both cases)
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // Minimal validation (n8n Normalize node expects these fields)
    const required = ['orderId', 'orderNumber', 'email', 'items', 'total', 'currency'];
    const missing = required.filter(k => payload[k] == null);
    if (missing.length) {
      return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` });
    }

    // Optionally normalize items => [{ title, quantity }]
    // Ensure etaDate and createdAt exist
    payload.etaDate = payload.etaDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    payload.createdAt = payload.createdAt || new Date().toISOString();

    const r = await fetch(process.env.N8N_ORDERS_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.N8N_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(502).json({ ok: false, error: `n8n error: ${r.status} ${text}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Server error' });
  }
}

// Vercel config (ensure Node runtime)
export const config = {
  runtime: 'nodejs',
};
