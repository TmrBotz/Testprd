import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth';
import { formatPrice, formatDateTime } from '@/lib/format';
import OrderActions from '@/components/OrderActions';
import AutoRefresh from '@/components/AutoRefresh';

export const dynamic = 'force-dynamic';

const BADGES = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

export default async function OrdersPage() {
  requireAdmin();

  let orders = [];
  let error = '';
  try {
    await connectDB();
    const docs = await Order.find().sort({ createdAt: -1 }).limit(500).lean();
    orders = JSON.parse(JSON.stringify(docs));
  } catch (e) {
    error = (e && e.message) || 'Could not load orders.';
  }

  return (
    <div className="stack">
      <h1 className="page-title">Orders</h1>
      <AutoRefresh seconds={15} />

      {error ? <div className="notice notice-err">{error}</div> : null}

      {!error && orders.length === 0 ? <div className="card empty">No orders yet.</div> : null}

      {orders.map((o) => {
        const status = o.status || 'pending';
        return (
          <div className="card order-card stack" key={o._id}>
            <div className="page-head">
              <div className="item-title">{o.productTitle || 'Unknown product'}</div>
              <span className={'badge ' + (BADGES[status] || 'badge-pending')}>{status}</span>
            </div>
            <div className="order-grid">
              <div>
                <div className="kv-label">Amount</div>
                <div className="kv-value">{formatPrice(Number(o.amount || 0))}</div>
              </div>
              <div>
                <div className="kv-label">UTR</div>
                <div className="kv-value">{o.utr || '-'}</div>
              </div>
              <div>
                <div className="kv-label">Order ID</div>
                <div className="kv-value">{o.orderCode || '-'}</div>
              </div>
              <div>
                <div className="kv-label">Date</div>
                <div className="kv-value">{formatDateTime(o.createdAt) || '-'}</div>
              </div>
              <div>
                <div className="kv-label">Access until</div>
                <div className="kv-value">{formatDateTime(o.accessUntil) || '-'}</div>
              </div>
            </div>
            <OrderActions id={o._id} status={status} />
          </div>
        );
      })}
    </div>
  );
}
