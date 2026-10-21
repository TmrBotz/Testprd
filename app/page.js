import Link from 'next/link';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getSettingsSafe } from '@/lib/settings';
import { formatPrice, shortText } from '@/lib/format';
import PublicShell from '@/components/PublicShell';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getSettingsSafe();
  let products = [];
  let failed = false;

  try {
    await connectDB();
    const docs = await Product.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
    products = JSON.parse(JSON.stringify(docs));
  } catch (e) {
    console.error('Home page load failed:', e && e.message);
    failed = true;
  }

  return (
    <PublicShell settings={settings}>
      <div className="stack">
        <h1 className="page-title">{settings.siteName}</h1>
        {failed ? (
          <div className="notice notice-err">We could not load products right now. Please try again in a minute.</div>
        ) : null}
        {!failed && products.length === 0 ? (
          <div className="card empty">No products yet. Please check back soon.</div>
        ) : null}
        <div className="grid">
          {products.map((p) => (
            <Link key={p._id} href={'/p/' + p.slug} className="pcard">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pcard-img" src={p.imageUrl} alt={p.title} loading="lazy" />
              ) : (
                <div className="pcard-img placeholder-img" aria-hidden="true">
                  {String(p.title || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="pcard-body">
                <div className="pcard-title">{p.title}</div>
                {p.description ? <div className="pcard-desc">{shortText(p.description, 110)}</div> : null}
                <div className="price">{formatPrice(p.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
