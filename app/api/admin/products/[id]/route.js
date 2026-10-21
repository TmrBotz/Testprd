import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { isAdmin } from '@/lib/auth';
import { validateProductInput } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const parsed = validateProductInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    await connectDB();

    const clash = await Product.exists({ slug: parsed.data.slug, _id: { $ne: id } });
    if (clash) {
      return NextResponse.json({ error: 'This slug is already used by another product.' }, { status: 409 });
    }

    try {
      const updated = await Product.findByIdAndUpdate(id, { $set: parsed.data }, { new: true, runValidators: true });
      if (!updated) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
      return NextResponse.json({ ok: true, id: String(updated._id) });
    } catch (e) {
      if (e && e.code === 11000) {
        return NextResponse.json({ error: 'This slug is already used by another product.' }, { status: 409 });
      }
      throw e;
    }
  } catch (e) {
    console.error('Update product error:', e && e.message);
    return NextResponse.json({ error: (e && e.message) || 'Could not update product.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Delete product error:', e && e.message);
    return NextResponse.json({ error: (e && e.message) || 'Could not delete product.' }, { status: 500 });
  }
}
