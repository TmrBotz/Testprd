'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsForm({ settings }) {
  const router = useRouter();
  const s = settings || {};
  const [siteName, setSiteName] = useState(s.siteName || '');
  const [upiId, setUpiId] = useState(s.upiId || '');
  const [payeeName, setPayeeName] = useState(s.payeeName || '');
  const [qrMode, setQrMode] = useState(s.qrMode === 'custom' ? 'custom' : 'auto');
  const [qrImageUrl, setQrImageUrl] = useState(s.qrImageUrl || '');
  const [approveMode, setApproveMode] = useState(s.approveMode === 'manual' ? 'manual' : 'auto');
  const [supportEmail, setSupportEmail] = useState(s.supportEmail || '');
  const [supportWhatsapp, setSupportWhatsapp] = useState(s.supportWhatsapp || '');
  const [termsText, setTermsText] = useState(s.termsText || '');
  const [refundText, setRefundText] = useState(s.refundText || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName,
          upiId,
          payeeName,
          qrMode,
          qrImageUrl,
          approveMode,
          supportEmail,
          supportWhatsapp,
          termsText,
          refundText,
        }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        setError(data.error || 'Could not save settings.');
      } else {
        setMessage('Settings saved.');
        router.refresh();
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="stack" noValidate>
      <div className="card stack">
        <div className="card-title">Store</div>
        <div className="field">
          <label className="label" htmlFor="st-name">Site name</label>
          <input id="st-name" className="input" type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} maxLength={60} />
        </div>
      </div>

      <div className="card stack">
        <div className="card-title">Payments</div>
        <div className="field">
          <label className="label" htmlFor="st-upi">UPI ID</label>
          <input id="st-upi" className="input" type="text" placeholder="name@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} maxLength={100} autoCapitalize="none" />
        </div>
        <div className="field">
          <label className="label" htmlFor="st-payee">Payee name</label>
          <input id="st-payee" className="input" type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} maxLength={80} />
        </div>
        <div className="field">
          <label className="label" htmlFor="st-qrmode">QR mode</label>
          <select id="st-qrmode" className="select" value={qrMode} onChange={(e) => setQrMode(e.target.value)}>
            <option value="auto">Auto (recommended: QR includes the order ID)</option>
            <option value="custom">Custom image</option>
          </select>
          <div className="hint">Auto mode puts the order ID in the payment note, which automatic verification needs.</div>
        </div>
        {qrMode === 'custom' ? (
          <div className="field">
            <label className="label" htmlFor="st-qrurl">QR image URL</label>
            <input id="st-qrurl" className="input" type="url" placeholder="https://..." value={qrImageUrl} onChange={(e) => setQrImageUrl(e.target.value)} maxLength={1000} />
          </div>
        ) : null}
        <div className="field">
          <label className="label" htmlFor="st-approve">Approve mode</label>
          <select id="st-approve" className="select" value={approveMode} onChange={(e) => setApproveMode(e.target.value)}>
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
          </select>
          <div className="hint">Payments are verified automatically, so a verified payment is always approved.</div>
        </div>
      </div>

      <div className="card stack">
        <div className="card-title">Support</div>
        <div className="field">
          <label className="label" htmlFor="st-email">Support email</label>
          <input id="st-email" className="input" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} maxLength={120} autoCapitalize="none" />
        </div>
        <div className="field">
          <label className="label" htmlFor="st-wa">WhatsApp number (with country code)</label>
          <input id="st-wa" className="input" type="tel" placeholder="919876543210" value={supportWhatsapp} onChange={(e) => setSupportWhatsapp(e.target.value)} maxLength={30} />
        </div>
      </div>

      <div className="card stack">
        <div className="card-title">Legal pages</div>
        <div className="field">
          <label className="label" htmlFor="st-terms">Terms text</label>
          <textarea id="st-terms" className="textarea" rows={8} value={termsText} onChange={(e) => setTermsText(e.target.value)} maxLength={10000} />
        </div>
        <div className="field">
          <label className="label" htmlFor="st-refund">Refund policy text</label>
          <textarea id="st-refund" className="textarea" rows={8} value={refundText} onChange={(e) => setRefundText(e.target.value)} maxLength={10000} />
        </div>
      </div>

      {error ? (
        <div className="notice notice-err" role="alert">
          {error}
        </div>
      ) : null}
      {message ? <div className="notice notice-ok">{message}</div> : null}

      <div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
