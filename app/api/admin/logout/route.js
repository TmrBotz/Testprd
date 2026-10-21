import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, cookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, '', cookieOptions(0));
    return res;
  } catch (e) {
    console.error('Admin logout error:', e && e.message);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
