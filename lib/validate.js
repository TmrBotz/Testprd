import { slugify, isValidSlug } from '@/lib/slug';

export function cleanStr(v, max) {
  const limit = max || 200;
  return String(v === null || v === undefined ? '' : v)
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function cleanText(v, max) {
  const limit = max || 5000;
  return String(v === null || v === undefined ? '' : v)
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, limit);
}

export function normalizeUtr(v) {
  return String(v === null || v === undefined ? '' : v).replace(/\s+/g, '');
}

export function isValidUtr(v) {
  return /^\d{12}$/.test(normalizeUtr(v));
}

export function isValidOrderId(v) {
  return typeof v === 'string' && /^ORD[A-Z0-9]{8}$/.test(v);
}

export function isValidHttpUrl(v) {
  try {
    const u = new URL(String(v));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

export function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v));
}

export function isValidUpiId(v) {
  return /^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,64}$/.test(String(v));
}

export function validateProductInput(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid request.' };

  const title = cleanStr(body.title, 120);
  if (!title) return { error: 'Title is required.' };

  const slug = slugify(body.slug || title);
  if (!isValidSlug(slug)) {
    return { error: 'Slug is invalid. Use letters, numbers and hyphens only.' };
  }

  const rawPrice = body.price;
  const priceNum = Number(rawPrice);
  if (
    rawPrice === '' ||
    rawPrice === null ||
    rawPrice === undefined ||
    !Number.isFinite(priceNum) ||
    priceNum < 0 ||
    priceNum > 10000000
  ) {
    return { error: 'Enter a valid price (0 or more).' };
  }
  const price = Math.round(priceNum * 100) / 100;

  const description = cleanText(body.description, 5000);

  const imageUrl = cleanStr(body.imageUrl, 1000);
  if (imageUrl && !isValidHttpUrl(imageUrl)) {
    return { error: 'Image URL must start with http:// or https://' };
  }

  const featureSource = Array.isArray(body.features)
    ? body.features
    : String(body.features || '').split(/\r?\n/);
  const features = featureSource
    .map((f) => cleanStr(f, 200))
    .filter(Boolean)
    .slice(0, 30);

  const linkSource = Array.isArray(body.links) ? body.links : [];
  if (linkSource.length > 50) return { error: 'Too many links (max 50).' };
  const links = [];
  for (const l of linkSource) {
    const lt = cleanStr(l && l.title, 120);
    const lu = cleanStr(l && l.url, 2000);
    if (!lt && !lu) continue;
    if (!lt || !lu) return { error: 'Each link needs both a title and a URL.' };
    if (!isValidHttpUrl(lu)) {
      return { error: 'Link URLs must start with http:// or https://' };
    }
    links.push({ title: lt, url: lu });
  }

  const status = body.status === 'published' ? 'published' : 'draft';

  return { data: { title, slug, description, price, imageUrl, features, links, status } };
}

export function validateSettingsInput(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid request.' };

  const siteName = cleanStr(body.siteName, 60) || 'Digital Store';

  const upiId = cleanStr(body.upiId, 100);
  if (upiId && !isValidUpiId(upiId)) {
    return { error: 'UPI ID looks invalid. Example: name@bank' };
  }

  const payeeName = cleanStr(body.payeeName, 80);
  const qrMode = body.qrMode === 'custom' ? 'custom' : 'auto';

  const qrImageUrl = cleanStr(body.qrImageUrl, 1000);
  if (qrImageUrl && !isValidHttpUrl(qrImageUrl)) {
    return { error: 'QR image URL must start with http:// or https://' };
  }
  if (qrMode === 'custom' && !qrImageUrl) {
    return { error: 'Add a QR image URL or switch QR mode to Auto.' };
  }

  const approveMode = body.approveMode === 'manual' ? 'manual' : 'auto';

  const supportEmail = cleanStr(body.supportEmail, 120);
  if (supportEmail && !isValidEmail(supportEmail)) {
    return { error: 'Support email looks invalid.' };
  }

  const supportWhatsapp = cleanStr(body.supportWhatsapp, 30).replace(/\D/g, '').slice(0, 15);
  if (supportWhatsapp && supportWhatsapp.length < 8) {
    return { error: 'WhatsApp number looks too short. Include the country code.' };
  }

  const termsText = cleanText(body.termsText, 10000);
  const refundText = cleanText(body.refundText, 10000);

  return {
    data: {
      siteName,
      upiId,
      payeeName,
      qrMode,
      qrImageUrl,
      approveMode,
      supportEmail,
      supportWhatsapp,
      termsText,
      refundText,
    },
  };
}
