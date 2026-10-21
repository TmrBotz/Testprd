import { requireAdmin } from '@/lib/auth';
import ProductForm from '@/components/ProductForm';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  requireAdmin();
  return (
    <div className="stack">
      <h1 className="page-title">New product</h1>
      <ProductForm product={null} />
    </div>
  );
}
