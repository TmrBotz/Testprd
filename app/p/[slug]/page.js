import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getAccess } from '@/lib/access';
import { getSettingsSafe } from '@/lib/settings';
import { formatPrice, formatDateTime } from '@/lib/format';
import PublicShell from '@/components/PublicShell';
import AutoRefresh from '@/components/AutoRefresh';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  try {
    await connectDB();
    const p = await Product.findOne({ slug: params.slug, status: 'published' }).select('title description').lean();
    if (p) {
      return { title: p.title, description: String(p.description || '').slice(0, 160) };
    }
  } catch (e) {
    // fall through to default metadata
  }
  return { title: 'Product' };
}

export default async function ProductPage({ params }) {
  const settings = await getSettingsSafe();
  let product = null;
  let access = { state: 'none', order: null };
  let failed = false;

  try {
    await connectDB();
    const doc = await Product.findOne({ slug: params.slug, status: 'published' }).lean();
    if (doc) {
      product = JSON.parse(JSON.stringify(doc));
      access = await getAccess(product._id);
    }
  } catch (e) {
    console.error('Product page load failed:', e && e.message);
    failed = true;
  }

  if (!failed && !product) notFound();

  if (failed) {
    return (
      <PublicShell settings={settings}>
        <div className="notice notice-err">We could not load this page right now. Please try again in a minute.</div>
      </PublicShell>
    );
  }

  const features = Array.isArray(product.features) ? product.features : [];
  const links = Array.isArray(product.links) ? product.links : [];
  const payHref = '/p/' + product.slug + '/pay';
  const state = access.state;
  const contact = settings.supportWhatsapp || settings.supportEmail ? ' Please contact support with your UTR number.' : ' Please use the Contact page for help.';

  return (
    <PublicShell settings={settings}>
      <div className="stack">
        <Link href="/" className="back-link">
          &larr; All products
        </Link>

        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-img" src={product.imageUrl} alt={product.title} />
        ) : null}

        <div className="card stack">
          <h1 className="product-title">{product.title}</h1>
          <div className="product-price">{formatPrice(product.price)}</div>
          {product.description ? <p className="pre">{product.description}</p> : null}
          {features.length > 0 ? (
            <ul className="features">
              {features.map((f, i) => (
                <li className="feature-item" key={i}>
                  <span className="check" aria-hidden="true">&#10003;</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {state === 'unlocked' ? (
          <div className="card stack">
            <div className="notice notice-ok">
              Payment verified. Access valid until {formatDateTime(access.order && access.order.accessUntil)}.
            </div>
            {links.length === 0 ? (
              <div className="hint">No links have been added to this product yet. Please contact support.</div>
            ) : null}
            {links.map((l, i) => (
              <a key={i} className="btn btn-primary btn-lg" href={l.url} target="_blank" rel="noopener noreferrer">
                {l.title || 'Open link'}
              </a>
            ))}
          </div>
        ) : null}

        {state === 'pending' ? (
          <div className="card stack">
            <div className="notice notice-warn">
              Payment under review. This page updates automatically once your payment is confirmed.
            </div>
            <AutoRefresh seconds={10} />
          </div>
        ) : null}

        {state === 'rejected' ? (
          <div className="card stack">
            <div className="notice notice-err">
              Your payment could not be verified.{contact}
            </div>
            <Link href={payHref} className="btn btn-primary btn-lg">
              Unlock now
            </Link>
          </div>
        ) : null}

        {state === 'expired' ? (
          <div className="card stack">
            <div className="notice notice-warn">Your access period has ended. Unlock again to continue.</div>
            <Link href={payHref} className="btn btn-primary btn-lg">
              Unlock now
            </Link>
          </div>
        ) : null}

        {state === 'none' ? (
          <div className="card stack locked">
            <div className="locked-title">Locked content</div>
            <div className="hint">Pay once by UPI and the links open on this page right away.</div>
            <Link href={payHref} className="btn btn-primary btn-lg">
              Unlock now
            </Link>
          </div>
        ) : null}
      </div>
    </PublicShell>
  );
}
