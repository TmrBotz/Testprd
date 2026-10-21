'use client';

import { useState, useRef, useEffect } from 'react';

export default function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    const value = String(text || '');
    let done = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        done = true;
      }
    } catch (e) {
      done = false;
    }
    if (!done) {
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        done = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) {
        done = false;
      }
    }
    if (done) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
      {copied ? 'Copied' : label || 'Copy'}
    </button>
  );
}
