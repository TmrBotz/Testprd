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
    const p = await Product.findOne({ slug: params.slug, status: 'published' })
      .select('title description price imageUrl')
      .lean();
    if (p) {
      const title = p.title + ' - ' + formatPrice(p.price);
      const description = String(p.description || 'Get ' + p.title + ' instantly.')
        .replace(/\s+/g, ' ')
        .slice(0, 160);
      return {
        title,
        description,
        openGraph: {
          title,
          description,
          type: 'website',
          images: p.imageUrl ? [{ url: p.imageUrl }] : undefined,
        },
        twitter: {
          card: p.imageUrl ? 'summary_large_image' : 'summary',
          title,
          description,
          images: p.imageUrl ? [p.imageUrl] : undefined,
        },
      };
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
  const priceText = formatPrice(product.price);
  const state = access.state;
  const unlocked = state === 'unlocked';
  const pending = state === 'pending';
  const showLocked = !unlocked && !pending;
  const contactHint =
    settings.supportWhatsapp || settings.supportEmail
      ? ' Please pay again or contact support.'
      : ' Please pay again or use the Contact page.';

  return (
    <PublicShell settings={settings} variant="product">
      <div className="pdp">
        {product.imageUrl ? (
          <div className="pdp-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.title} />
          </div>
        ) : null}

        <h1 className="pdp-title">{product.title}</h1>
        <div className="pdp-price-row">
          <span className="pdp-price">{priceText}</span>
          <span className="pdp-chip">One-time payment</span>
        </div>

        {product.description ? <p className="pdp-desc pre">{product.description}</p> : null}

        {features.length > 0 ? (
          <section className="pdp-block">
            <h2 className="pdp-block-title">What you get</h2>
            <ul className="pdp-features">
              {features.map((f, i) => (
                <li key={i}>
                  <span className="pdp-tick" aria-hidden="true">&#10003;</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="pdp-block">
          <h2 className="pdp-block-title">Your content</h2>

          {unlocked ? (
            <>
              <div className="notice notice-ok">
                Unlocked. Access stays active on this device until {formatDateTime(access.order && access.order.accessUntil)}.
              </div>
              {links.length === 0 ? (
                <div className="hint">No links have been added to this product yet. Please contact support.</div>
              ) : null}
              <div className="pdp-links">
                {links.map((l, i) => (
                  <a key={i} className="pdp-link" href={l.url} target="_blank" rel="noopener noreferrer">
                    <span className="pdp-link-no">{i + 1}</span>
                    <span className="pdp-link-title">{l.title || 'Open link'}</span>
                    <span className="pdp-link-go" aria-hidden="true">Open</span>
                  </a>
                ))}
              </div>
            </>
          ) : null}

          {pending ? (
            <div className="pdp-vault">
              <div className="pdp-vault-note">
                <b>Payment received. Waiting for confirmation.</b>
                <span>This page updates automatically as soon as your payment is approved.</span>
              </div>
              <AutoRefresh seconds={10} />
            </div>
          ) : null}

          {showLocked ? (
            <div className="pdp-vault">
              {state === 'rejected' ? (
                <div className="notice notice-err">Your last payment could not be verified.{contactHint}</div>
              ) : null}
              {state === 'expired' ? (
                <div className="notice notice-warn">Your access period has ended. Unlock again to continue.</div>
              ) : null}
              <div className="pdp-vault-rows" aria-hidden="true">
                {links.slice(0, 4).map((_, i) => (
                  <div key={i} className="pdp-vault-row">
                    <span />
                    <span />
                  </div>
                ))}
              </div>
              <div className="pdp-vault-note">
                <b>
                  {links.length > 0
                    ? links.length + (links.length === 1 ? ' link is locked' : ' links are locked')
                    : 'Content is locked'}
                </b>
                <span>Pay once to unlock everything on this page.</span>
                <Link href={payHref} className="btn btn-primary btn-lg">
                  Unlock now for {priceText}
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {showLocked ? (
        <div className="pdp-sticky">
          <div>
            <small>Price</small>
            <b>{priceText}</b>
          </div>
          <Link href={payHref} className="btn btn-primary">
            Unlock now
          </Link>
        </div>
      ) : null}
    </PublicShell>
  );
}
