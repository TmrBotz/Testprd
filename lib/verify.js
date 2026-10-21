import crypto from 'crypto';

const UNAVAILABLE_MESSAGE =
  'Payment verification is temporarily unavailable. Please try again in a minute.';

const ATTEMPT_TIMEOUT_MS = 55000; // per attempt (Render free tier can be asleep)
const TOTAL_BUDGET_MS = 57000; // stays under the route maxDuration of 60s

// "ORD" + 8 uppercase hex chars, e.g. ORD3FA91C2B
export function generateOrderId() {
  return 'ORD' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// One HTTP attempt. Returns { kind: 'network' } or { kind: 'response', status, json }.
async function attempt(endpoint, apiKey, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });
    let json = null;
    try {
      json = await res.json();
    } catch (e) {
      json = null;
    }
    return { kind: 'response', status: res.status, json };
  } catch (e) {
    return { kind: 'network', reason: e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || 'network error' };
  } finally {
    clearTimeout(timer);
  }
}

// -> { ok: true } | { ok: false, message, unavailable? }
export async function verifyPayment({ utr, amount, orderId }) {
  const base = process.env.PAYMENT_API_URL;
  const apiKey = process.env.PAYMENT_API_KEY;
  if (!base || !apiKey) {
    console.error('Payment verification is not configured: PAYMENT_API_URL or PAYMENT_API_KEY is missing.');
    return { ok: false, message: UNAVAILABLE_MESSAGE, unavailable: true };
  }

  const endpoint = String(base).trim().replace(/\/+$/, '') + '/api/verify';
  const payload = { utr: String(utr), amount: Number(amount), orderId: String(orderId) };
  const startedAt = Date.now();
  let last = null;

  for (let i = 0; i < 2; i++) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (remaining < 3000) break;
    last = await attempt(endpoint, apiKey, payload, Math.min(ATTEMPT_TIMEOUT_MS, remaining));
    if (last.kind === 'response') break;
    console.error('Payment API attempt ' + (i + 1) + ' failed: ' + last.reason);
    if (i === 0) await sleep(1500);
  }

  if (!last || last.kind !== 'response') {
    console.error('Payment API unreachable after retry.');
    return { ok: false, message: UNAVAILABLE_MESSAGE, unavailable: true };
  }

  const { status, json } = last;

  if (status === 401 || status === 403 || status === 429 || status >= 500) {
    console.error('Payment API returned HTTP ' + status + (json && json.message ? ': ' + json.message : ''));
    return { ok: false, message: UNAVAILABLE_MESSAGE, unavailable: true };
  }

  if (!json || typeof json !== 'object') {
    console.error('Payment API returned an invalid (non-JSON) response, HTTP ' + status);
    return { ok: false, message: UNAVAILABLE_MESSAGE, unavailable: true };
  }

  if (json.success === true && status >= 200 && status < 300) {
    return { ok: true };
  }

  if (json.success === false) {
    const message =
      typeof json.message === 'string' && json.message.trim()
        ? json.message.trim().slice(0, 300)
        : 'Payment could not be verified. Check your UTR and try again.';
    return { ok: false, message };
  }

  console.error('Payment API returned an unexpected response, HTTP ' + status);
  return { ok: false, message: UNAVAILABLE_MESSAGE, unavailable: true };
}
