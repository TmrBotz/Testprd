import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { isAdmin } from '@/lib/auth';
import { getAccessHours } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const action = body && typeof body.action === 'string' ? body.action : '';
    let update;
    if (action === 'approve') {
      update = {
        status: 'approved',
        accessUntil: new Date(Date.now() + getAccessHours() * 3600 * 1000),
      };
    } else if (action === 'reject' || action === 'revoke') {
      update = { status: 'rejected', accessUntil: null };
    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    await connectDB();
    const updated = await Order.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!updated) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Update order error:', e && e.message);
    return NextResponse.json({ error: (e && e.message) || 'Could not update order.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Delete order error:', e && e.message);
    return NextResponse.json({ error: (e && e.message) || 'Could not delete order.' }, { status: 500 });
  }
}
