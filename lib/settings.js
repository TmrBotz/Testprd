import connectDB from '@/lib/db';
import Settings, { DEFAULT_TERMS, DEFAULT_REFUND } from '@/models/Settings';

export const FALLBACK_SETTINGS = {
  siteName: 'Digital Store',
  upiId: '',
  payeeName: '',
  qrMode: 'auto',
  qrImageUrl: '',
  approveMode: 'auto',
  supportEmail: '',
  supportWhatsapp: '',
  termsText: DEFAULT_TERMS,
  refundText: DEFAULT_REFUND,
};

function normalize(doc) {
  const s = doc || {};
  return {
    siteName: s.siteName || FALLBACK_SETTINGS.siteName,
    upiId: s.upiId || '',
    payeeName: s.payeeName || '',
    qrMode: s.qrMode === 'custom' ? 'custom' : 'auto',
    qrImageUrl: s.qrImageUrl || '',
    approveMode: s.approveMode === 'manual' ? 'manual' : 'auto',
    supportEmail: s.supportEmail || '',
    supportWhatsapp: s.supportWhatsapp || '',
    termsText: s.termsText || DEFAULT_TERMS,
    refundText: s.refundText || DEFAULT_REFUND,
  };
}

// Reads (and creates on first use) the single settings document.
export async function getSettings() {
  await connectDB();
  let doc = await Settings.findOne({ key: 'main' }).lean();
  if (!doc) {
    try {
      const created = await Settings.create({ key: 'main' });
      doc = created.toObject();
    } catch (e) {
      if (e && e.code === 11000) {
        doc = await Settings.findOne({ key: 'main' }).lean();
      } else {
        throw e;
      }
    }
  }
  return normalize(JSON.parse(JSON.stringify(doc)));
}

// Never throws. Used by public pages so a database problem cannot crash them.
export async function getSettingsSafe() {
  try {
    return await getSettings();
  } catch (e) {
    console.error('Settings load failed:', e && e.message);
    return { ...FALLBACK_SETTINGS };
  }
}
