'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    if (!password) {
      setError('Enter the admin password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setBusy(false);
        return;
      }
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="container narrow login-wrap">
      <form className="card stack" onSubmit={handleSubmit} noValidate>
        <h1 className="page-title">Admin login</h1>
        <div className="field">
          <label className="label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? (
          <div className="error-text" role="alert">
            {error}
          </div>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
