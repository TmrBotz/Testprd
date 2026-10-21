// Safe configuration helpers. Nothing here throws at import time.

export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    try {
      let v = String(raw).trim();
      if (!v) continue;
      if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
      return new URL(v).origin;
    } catch (e) {
      // try next candidate
    }
  }
  return 'http://localhost:3000';
}

export function getAccessHours() {
  const n = Number(process.env.ACCESS_HOURS);
  return Number.isFinite(n) && n > 0 ? n : 24;
}

export function isProd() {
  return process.env.NODE_ENV === 'production';
}

export const ADMIN_SESSION_SECONDS = 7 * 24 * 60 * 60;
