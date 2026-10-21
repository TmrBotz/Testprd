import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { verifyPayment, generateOrderId } from '@/lib/verify';
import { attachAccessCookie } from '@/lib/access';
import { getAccessHours } from '@/lib/config';
import { cleanStr, normalizeUtr, isValidUtr, isValidOrderId } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UNAVAILABLE = 'Payment verification is temporarily unavailable. Please try again in a minute.';

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const slug = cleanStr(body.slug, 100).toLowerCase();
    const utr = normalizeUtr(body.utr);
    const orderId = isValidOrderId(body.orderId) ? body.orderId : generateOrderId();

    if (!slug) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    if (!isValidUtr(utr)) {
      return NextResponse.json({ error: 'Enter a valid 12-digit UTR number.' }, { status: 400 });
    }

    await connectDB();

    const product = await Product.findOne({ slug, status: 'published' }).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Amount always comes from the database, never from the client.
    const amount = Number(product.price);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'This product is not available for purchase right now.' }, { status: 400 });
    }

    if (await Order.exists({ utr })) {
      return NextResponse.json({ error: 'This UTR has already been used.' }, { status: 409 });
    }

    const result = await verifyPayment({ utr, amount, orderId });

    if (!result.ok) {
      if (result.unavailable) {
        return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
      }
      return NextResponse.json(
        { error: result.message || 'Payment could not be verified.' },
        { status: 402 }
      );
    }

    let order;
    try {
      order = await Order.create({
        product: product._id,
        orderCode: orderId,
        productTitle: product.title,
        amount,
        utr,
        status: 'approved',
        accessUntil: new Date(Date.now() + getAccessHours() * 3600 * 1000),
      });
    } catch (e) {
      if (e && e.code === 11000) {
        return NextResponse.json({ error: 'This UTR has already been used.' }, { status: 409 });
      }
      throw e;
    }

    const res = NextResponse.json({ ok: true });
    attachAccessCookie(res, product._id, order._id);
    return res;
  } catch (e) {
    console.error('Pay route error:', e && e.message);
    return NextResponse.json(
      { error: 'Something went wrong on our side. Please try again in a minute.' },
      { status: 500 }
    );
  }
}
