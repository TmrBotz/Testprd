'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderActions({ id, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call(method, body, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders/' + id, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (!res.ok) {
        setError(data.error || 'Action failed.');
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
        {status !== 'approved' ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => call('PUT', { action: 'approve' })}>
            Approve
          </button>
        ) : null}
        {status === 'pending' ? (
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => call('PUT', { action: 'reject' })}>
            Reject
          </button>
        ) : null}
        {status === 'approved' ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => call('PUT', { action: 'revoke' }, 'Revoke access for this order?')}
          >
            Revoke
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-danger btn-sm"
          disabled={busy}
          onClick={() => call('DELETE', null, 'Delete this order permanently? The UTR can then be used again.')}
        >
          Delete
        </button>
      </div>
      {error ? <div className="error-text">{error}</div> : null}
    </div>
  );
}
