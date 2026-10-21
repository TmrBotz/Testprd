import Link from 'next/link';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import ProductActions from '@/components/ProductActions';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  requireAdmin();

  let products = [];
  let error = '';
  try {
    await connectDB();
    const docs = await Product.find().sort({ createdAt: -1 }).lean();
    products = JSON.parse(JSON.stringify(docs));
  } catch (e) {
    error = (e && e.message) || 'Could not load products.';
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1 className="page-title">Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary">
          + New product
        </Link>
      </div>

      {error ? <div className="notice notice-err">{error}</div> : null}

      {!error && products.length === 0 ? (
        <div className="card empty">No products yet. Create your first product to start selling.</div>
      ) : null}

      {products.map((p) => {
        const linkCount = (p.links || []).length;
        const published = p.status === 'published';
        return (
          <div className="card item-row" key={p._id}>
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="thumb" src={p.imageUrl} alt="" />
            ) : (
              <div className="thumb placeholder-img" aria-hidden="true">
                {String(p.title || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="item-main">
              <div className="item-title">{p.title || 'Untitled'}</div>
              <div className="item-meta">
                <span>{formatPrice(Number(p.price || 0))}</span>
                <span>{linkCount} {linkCount === 1 ? 'link' : 'links'}</span>
                <span className={'badge ' + (published ? 'badge-published' : 'badge-draft')}>
                  {published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
            <ProductActions id={p._id} slug={p.slug || ''} published={published} title={p.title || ''} />
          </div>
        );
      })}
    </div>
  );
}
