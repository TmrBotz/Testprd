'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {
      // ignore, we still leave the panel
    }
    router.replace('/admin');
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout} disabled={busy}>
      {busy ? 'Logging out...' : 'Logout'}
    </button>
  );
}
