// Pure formatting helpers. Safe to import from server and client code.

export function formatPrice(value) {
  const n = Number(value || 0);
  const safe = Number.isFinite(n) ? n : 0;
  return '\u20B9' + safe.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return (
    d.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }) + ' IST'
  );
}

export function shortText(value, max) {
  const limit = max || 110;
  const s = String(value || '').replace(/\s+/g, ' ').trim();
  if (s.length <= limit) return s;
  return s.slice(0, limit - 1).trimEnd() + '\u2026';
}
