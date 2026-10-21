import mongoose from 'mongoose';

export const DEFAULT_TERMS = [
  'By purchasing from this store you agree to the following terms.',
  '',
  '1. Digital products: Every product sold here is a digital product (files, links or online content). Nothing is shipped physically.',
  '2. Access: After your payment is verified you receive access to the product links for a limited time shown on the product page. Access is linked to the device and browser used for the purchase.',
  '3. Personal use: Products are licensed for your personal use only. Reselling, sharing or redistributing the content without written permission is not allowed.',
  '4. Payments: Payments are made by UPI. Each UTR (transaction reference) number can be used only once. A payment that cannot be verified will not unlock the content.',
  '5. Availability: We try to keep all content available, but we do not guarantee uninterrupted access to third-party links or services.',
  '6. Changes: We may update products, prices and these terms at any time. The price shown at the time of payment applies to your order.',
  '7. Support: If you face any problem, please use the Contact page and share your UTR number and order ID.',
].join('\n');

export const DEFAULT_REFUND = [
  'Because digital products can be accessed and copied immediately after payment, all sales are generally final.',
  '',
  'We will review a refund request in these cases:',
  '- You were charged but could not access the product because of a technical problem that we could not fix.',
  '- You were charged more than once for the same product.',
  '- The product is clearly different from its description.',
  '',
  'Refunds are not given for change of mind, wrong purchase or lack of use.',
  '',
  'To request a refund, contact us within 7 days of the payment with your UTR number, order ID and a short description of the problem. Approved refunds are returned to the original UPI account within 5 to 7 working days.',
].join('\n');

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'Digital Store' },
    upiId: { type: String, default: '' },
    payeeName: { type: String, default: '' },
    qrMode: { type: String, enum: ['auto', 'custom'], default: 'auto' },
    qrImageUrl: { type: String, default: '' },
    approveMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    supportEmail: { type: String, default: '' },
    supportWhatsapp: { type: String, default: '' },
    termsText: { type: String, default: DEFAULT_TERMS },
    refundText: { type: String, default: DEFAULT_REFUND },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
