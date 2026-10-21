import mongoose from 'mongoose';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';
import ProductForm from '@/components/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }) {
  requireAdmin();

  if (!mongoose.isValidObjectId(params.id)) notFound();

  let product = null;
  let error = '';
  try {
    await connectDB();
    const doc = await Product.findById(params.id).lean();
    if (doc) product = JSON.parse(JSON.stringify(doc));
  } catch (e) {
    error = (e && e.message) || 'Could not load product.';
  }

  if (!error && !product) notFound();

  return (
    <div className="stack">
      <h1 className="page-title">Edit product</h1>
      {error ? <div className="notice notice-err">{error}</div> : null}
      {product ? <ProductForm product={product} /> : null}
    </div>
  );
}
