import Link from 'next/link';

export default function Footer({ settings }) {
  const name = (settings && settings.siteName) || 'Digital Store';
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <nav className="footer-links" aria-label="Legal">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/refund">Refund policy</Link>
          <Link href="/legal/contact">Contact</Link>
        </nav>
        <p className="footer-copy">
          &copy; {year} {name}
        </p>
      </div>
    </footer>
  );
}
