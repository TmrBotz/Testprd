'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ seconds }) {
  const router = useRouter();
  const delay = Math.max(3, Number(seconds) || 10) * 1000;

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, delay);
    return () => clearInterval(timer);
  }, [router, delay]);

  return null;
}
