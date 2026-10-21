import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { isAdmin } from '@/lib/auth';
import { validateProductInput } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const parsed = validateProductInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    await connectDB();

    if (await Product.exists({ slug: parsed.data.slug })) {
      return NextResponse.json({ error: 'This slug is already used by another product.' }, { status: 409 });
    }

    try {
      const product = await Product.create(parsed.data);
      return NextResponse.json({ ok: true, id: String(product._id) });
    } catch (e) {
      if (e && e.code === 11000) {
        return NextResponse.json({ error: 'This slug is already used by another product.' }, { status: 409 });
      }
      throw e;
    }
  } catch (e) {
    console.error('Create product error:', e && e.message);
    return NextResponse.json({ error: (e && e.message) || 'Could not save product.' }, { status: 500 });
  }
}
