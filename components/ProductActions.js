'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProductActions({ id, slug, published, title }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!window.confirm('Delete "' + (title || 'this product') + '"? This cannot be undone.')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products/' + id, { method: 'DELETE' });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (!res.ok) {
        setError(data.error || 'Could not delete product.');
      } else {
        router.refresh();
      }
    } catch (e) {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  }

  return (
    <div className="stack-sm">
      <div className="item-actions">
        <Link href={'/admin/products/' + id} className="btn btn-ghost btn-sm">
          Edit
        </Link>
        {published ? (
          <Link href={'/p/' + slug} target="_blank" className="btn btn-ghost btn-sm">
            View
          </Link>
        ) : null}
        <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={busy}>
          Delete
        </button>
      </div>
      {error ? <div className="error-text">{error}</div> : null}
    </div>
  );
}
