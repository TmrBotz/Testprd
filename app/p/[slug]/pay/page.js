import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getAccess } from '@/lib/access';
import { getSettingsSafe } from '@/lib/settings';
import { generateOrderId } from '@/lib/verify';
import { formatPrice } from '@/lib/format';
import PublicShell from '@/components/PublicShell';
import CopyButton from '@/components/CopyButton';
import UtrForm from '@/components/UtrForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pay',
  robots: { index: false, follow: false },
};

export default async function PayPage({ params }) {
  const slug = params.slug;
  const settings = await getSettingsSafe();
  let product = null;
  let access = { state: 'none', order: null };
  let failed = false;

  try {
    await connectDB();
    const doc = await Product.findOne({ slug, status: 'published' }).lean();
    if (doc) {
      product = JSON.parse(JSON.stringify(doc));
      access = await getAccess(product._id);
    }
  } catch (e) {
    console.error('Pay page load failed:', e && e.message);
    failed = true;
  }

  if (!failed && !product) notFound();
  if (!failed && (access.state === 'unlocked' || access.state === 'pending')) {
    redirect('/p/' + slug);
  }

  if (failed) {
    return (
      <PublicShell settings={settings}>
        <div className="notice notice-err">We could not load this page right now. Please try again in a minute.</div>
      </PublicShell>
    );
  }

  const price = Number(product.price || 0);
  const orderId = generateOrderId();
  const upiId = settings.upiId;
  const payee = settings.payeeName || settings.siteName;
  const useCustomQr = settings.qrMode === 'custom' && !!settings.qrImageUrl;
  const priceText = formatPrice(price);

  let upiUri = '';
  let qrDataUrl = '';
  if (upiId && price > 0) {
    upiUri =
      'upi://pay?pa=' + upiId +
      '&pn=' + encodeURIComponent(payee) +
      '&am=' + price.toFixed(2) +
      '&cu=INR&tn=' + orderId;
    if (!useCustomQr) {
      try {
        qrDataUrl = await QRCode.toDataURL(upiUri, { width: 480, margin: 1 });
      } catch (e) {
        console.error('QR generation failed:', e && e.message);
        qrDataUrl = '';
      }
    }
  }

  const ready = !!upiId && price > 0;

  return (
    <PublicShell settings={settings}>
      <div className="stack">
        <Link href={'/p/' + product.slug} className="back-link">
          &larr; Back to product
        </Link>

        <div className="card summary">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="summary-img" src={product.imageUrl} alt={product.title} />
          ) : null}
          <div className="summary-info">
            <div className="summary-title">{product.title}</div>
            <div className="price">{priceText}</div>
          </div>
        </div>

        {price <= 0 ? (
          <div className="notice notice-err">This product is not available for purchase right now.</div>
        ) : null}
        {price > 0 && !upiId ? (
          <div className="notice notice-err">Payment is not set up yet. Please contact support.</div>
        ) : null}

        {ready ? (
          <>
            <div className="card stack">
              <div className="card-title">1. Pay {priceText}</div>

              {useCustomQr ? (
                <div className="qr-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="qr-img" src={settings.qrImageUrl} alt="UPI payment QR code" />
                </div>
              ) : null}
              {!useCustomQr && qrDataUrl ? (
                <div className="qr-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="qr-img" src={qrDataUrl} alt="UPI payment QR code" />
                </div>
              ) : null}
              {!useCustomQr && !qrDataUrl ? (
                <div className="notice notice-warn">QR code could not be generated. Use the UPI ID or the button below.</div>
              ) : null}

              <div className="center muted small">Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)</div>
              {useCustomQr ? <div className="center hint">Pay exactly {priceText}</div> : null}

              <div className="upi-box">
                <div className="upi-id">{upiId}</div>
                <CopyButton text={upiId} label="Copy" />
              </div>

              <a className="btn btn-ghost btn-lg" href={upiUri}>
                Pay with UPI app
              </a>
            </div>

            <div className="card stack">
              <div className="card-title">2. Enter your UTR</div>
              <div className="hint">
                After paying, open your payment app, find this payment and copy the 12-digit UTR (transaction reference) number.
              </div>
              <div className="order-tag">Order: {orderId}</div>
              <UtrForm slug={product.slug} orderId={orderId} />
            </div>
          </>
        ) : null}
      </div>
    </PublicShell>
  );
}
