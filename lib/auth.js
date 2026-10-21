import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isProd } from '@/lib/config';

export const ADMIN_COOKIE = 'admin_session';

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET is missing or shorter than 32 characters.');
  }
  return s;
}

function hmac(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

// Token format: <base64url(json)>.<base64url(hmac)>  (cookie safe)
export function createToken(payload, ttlSeconds) {
  const exp = Math.floor(Date.now() / 1000) + Math.floor(ttlSeconds);
  const body = Buffer.from(JSON.stringify({ ...payload, exp }), 'utf8').toString('base64url');
  return body + '.' + hmac(body);
}

export function verifyToken(token) {
  try {
    if (typeof token !== 'string' || token.length === 0 || token.length > 2000) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const body = parts[0];
    const sig = parts[1];
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(hmac(body), 'utf8');
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Constant-time string comparison (hashes first so lengths always match).
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  if (ha.length !== hb.length) return false;
  return crypto.timingSafeEqual(ha, hb);
}

export function cookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: isProd(),
    maxAge: Math.floor(maxAgeSeconds),
  };
}

// Read-only check. Works in Server Components and Route Handlers (Next 14.2: cookies() is sync).
export function isAdmin() {
  const store = cookies();
  const entry = store.get(ADMIN_COOKIE);
  const token = entry ? entry.value : '';
  if (!token) return false;
  const payload = verifyToken(token);
  return !!payload && payload.r === 'admin';
}

// For admin pages/layouts. redirect() throws by design, so never wrap this in try/catch.
export function requireAdmin() {
  if (!isAdmin()) redirect('/admin');
}
