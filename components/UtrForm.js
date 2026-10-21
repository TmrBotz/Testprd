'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
  'Contacting bank network',
  'Checking your payment',
  'Matching transaction details',
  'Almost done',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function UtrForm({ slug, orderId }) {
  const router = useRouter();
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!loading) return undefined;
    setStep(0);
    const timer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1800);
    return () => clearInterval(timer);
  }, [loading]);

  function handleChange(e) {
    const cleaned = e.target.value.replace(/[^\d\s]/g, '').slice(0, 14);
    setUtr(cleaned);
    if (error) setError('');
  }

  async function requestVerify(digits) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65000);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, utr: digits, orderId }),
        signal: controller.signal,
      });
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (res.ok && data.ok === true) return { ok: true, error: '' };
      return { ok: false, error: data.error || 'Something went wrong. Please try again.' };
    } catch (e) {
      if (e && e.name === 'AbortError') {
        return { ok: false, error: 'Verification is taking longer than expected. Please try again in a minute.' };
      }
      return { ok: false, error: 'Network error. Check your connection and try again.' };
    } finally {
      clearTimeout(timer);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    const digits = utr.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(digits)) {
      setError('Enter the 12-digit UTR number from your payment app.');
      return;
    }
    setError('');
    setLoading(true);

    const minMs = 5000 + Math.floor(Math.random() * 3000);
    const results = await Promise.all([requestVerify(digits), sleep(minMs)]);
    const result = results[0];

    if (result.ok) {
      setSuccess(true);
      router.replace('/p/' + slug);
      router.refresh();
      return;
    }
    setLoading(false);
    setError(result.error);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="stack" noValidate>
        <div className="field">
          <label className="label" htmlFor="utr">
            UTR / Transaction reference number
          </label>
          <input
            id="utr"
            name="utr"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="input utr-input"
            placeholder="123456789012"
            value={utr}
            onChange={handleChange}
            maxLength={14}
            disabled={loading}
          />
        </div>
        {error ? (
          <div className="error-text" role="alert">
            {error}
          </div>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          Unlock content
        </button>
      </form>

      {loading ? (
        <div className="overlay" role="alert" aria-live="polite">
          <div className="overlay-box">
            <div className="spinner" aria-hidden="true"></div>
            <div className="overlay-title">{success ? 'Payment verified' : 'Verifying payment...'}</div>
            <div className="overlay-sub">{success ? 'Opening your content' : STEPS[step]}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
