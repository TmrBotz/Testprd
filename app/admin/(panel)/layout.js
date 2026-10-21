import Link from 'next/link';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  requireAdmin();

  let pending = 0;
  try {
    await connectDB();
    pending = await Order.countDocuments({ status: 'pending' });
  } catch (e) {
    pending = 0;
  }

  return (
    <div>
      <nav className="admin-nav" aria-label="Admin">
        <div className="container wide admin-nav-in">
          <div className="admin-links">
            <Link href="/admin/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link href="/admin/orders" className="nav-link">
              Orders
              {pending > 0 ? <span className="nav-badge">{pending}</span> : null}
            </Link>
            <Link href="/admin/settings" className="nav-link">
              Settings
            </Link>
          </div>
          <LogoutButton />
        </div>
      </nav>
      <div className="container wide main">{children}</div>
    </div>
  );
}
