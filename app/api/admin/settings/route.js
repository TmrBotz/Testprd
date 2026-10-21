import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { isAdmin } from '@/lib/auth';
import { validateSettingsInput } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(req) {
  try {
    if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const parsed = validateSettingsInput(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    await connectDB();
    try {
      await Settings.findOneAndUpdate(
        { key: 'main' },
        { $set: parsed.data },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (e) {
      if (e && e.code === 11000) {
        // Two upserts raced; the document now exists, so update it.
        await Settings.findOneAndUpdate({ key: 'main' }, { $set: parsed.data }, { new: true });
      } else {
        throw e;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Save settings error:', e && e.message);
    return NextResponse.json({ error: (e && e.message) || 'Could not save settings.' }, { status: 500 });
  }
}
