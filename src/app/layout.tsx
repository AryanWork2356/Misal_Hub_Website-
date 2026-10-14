import type { Metadata, Viewport } from 'next';
import SmoothScroll from '@/components/SmoothScroll';
import Cursor from '@/components/Cursor';
import './globals.css';

export const metadata: Metadata = {
  title: 'Misal Hub – Authentic Misal Pav | Mira Road East',
  description: 'Misal Hub – authentic Maharashtrian Misal Pav in Mira Road East since 2015. Order online or own a Misal Hub franchise.',
  icons: { icon: '/images/logo.jpg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <SmoothScroll />
        <Cursor />
      </body>
    </html>
  );
}

