import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PublicShell({ settings, children }) {
  const name = (settings && settings.siteName) || 'Digital Store';
  return (
    <div className="shell">
      <header className="topbar">
        <div className="container topbar-in">
          <Link href="/" className="brand">
            {name}
          </Link>
        </div>
      </header>
      <main className="container main">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
