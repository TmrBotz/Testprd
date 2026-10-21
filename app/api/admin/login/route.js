import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createToken, cookieOptions, safeEqual } from '@/lib/auth';
import { ADMIN_SESSION_SECONDS } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const password = body && typeof body.password === 'string' ? body.password : '';
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: 'Admin login is not configured. Set ADMIN_PASSWORD in your environment variables.' },
        { status: 500 }
      );
    }

    if (!password || !safeEqual(password, expected)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const token = createToken({ r: 'admin' }, ADMIN_SESSION_SECONDS);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, cookieOptions(ADMIN_SESSION_SECONDS));
    return res;
  } catch (e) {
    console.error('Admin login error:', e && e.message);
    return NextResponse.json(
      { error: 'Login failed. Check that SESSION_SECRET is set and at least 32 characters long.' },
      { status: 500 }
    );
  }
}
