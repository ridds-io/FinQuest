import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SupabaseProvider } from '@/components/SupabaseProvider';

export const metadata: Metadata = {
  title: 'FinQuest — A Monetary Odyssey',
  description: 'Master budgeting, investing & loans through an immersive RPG. Real Indian scenarios — ₹ rents, UPI, PG life.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
