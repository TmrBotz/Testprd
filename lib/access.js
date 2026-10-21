import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { createToken, verifyToken, cookieOptions } from '@/lib/auth';
import { getAccessHours } from '@/lib/config';

export function accessCookieName(productId) {
  return 'acc_' + String(productId);
}

// Call from a Route Handler only (cookies can be set there). `res` is a NextResponse.
export function attachAccessCookie(res, productId, orderId) {
  const ttl = Math.round(getAccessHours() * 3600);
  const token = createToken({ p: String(productId), o: String(orderId) }, ttl);
  res.cookies.set(accessCookieName(productId), token, cookieOptions(ttl));
}

// Server-side access check. Returns { state, order } where state is one of
// 'none' | 'pending' | 'unlocked' | 'rejected' | 'expired'.
export async function getAccess(productId) {
  const pid = String(productId);
  const entry = cookies().get(accessCookieName(pid));
  const raw = entry ? entry.value : '';
  if (!raw) return { state: 'none', order: null };

  const payload = verifyToken(raw);
  if (!payload || payload.p !== pid || !mongoose.isValidObjectId(payload.o)) {
    return { state: 'none', order: null };
  }

  await connectDB();
  const found = await Order.findOne({ _id: payload.o, product: pid }).lean();
  if (!found) return { state: 'none', order: null };

  const order = JSON.parse(JSON.stringify(found));
  if (order.status === 'pending') return { state: 'pending', order };
  if (order.status === 'rejected') return { state: 'rejected', order };

  if (order.status === 'approved') {
    const until = order.accessUntil ? new Date(order.accessUntil).getTime() : 0;
    if (until > Date.now()) return { state: 'unlocked', order };
    return { state: 'expired', order };
  }
  return { state: 'none', order: null };
}
