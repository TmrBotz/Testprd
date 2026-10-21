import './globals.css';
import { getSiteUrl } from '@/lib/config';

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: 'Digital Store',
    template: '%s | Digital Store',
  },
  description: 'Digital products with instant access after UPI payment.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
