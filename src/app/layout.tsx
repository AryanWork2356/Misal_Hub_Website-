import type { Metadata, Viewport } from 'next';
import SmoothScroll from '@/components/SmoothScroll';
import Cursor from '@/components/Cursor';
import JsonLd from '@/components/JsonLd';
import { BRAND, KEYWORDS, SITE_URL, websiteSchema } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Misal Hub – Best Misal Pav in Mira Road East | Order Online', template: '%s | Misal Hub' },
  description: 'Hot, fresh Maharashtrian misal pav since 2015 in Mira Road East. Order online for home delivery within 5 km, with Jain options, bulk orders and franchise opportunities.',
  applicationName: 'Misal Hub',
  keywords: KEYWORDS,
  authors: [{ name: 'Misal Hub' }],
  creator: 'Misal Hub',
  publisher: 'Misal Hub',
  category: 'restaurant',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', siteName: 'Misal Hub', locale: 'en_IN', url: '/',
    title: 'Misal Hub – Best Misal Pav in Mira Road East | Order Online',
    description: 'Hot, fresh Maharashtrian misal pav since 2015. Order online for home delivery in Mira Road, with Jain options and bulk orders.',
    images: [{ url: '/images/og-share.jpg', width: 1200, height: 630, alt: 'Misal Hub shop front on Pleasant Park Road, Mira Road East' }],
  },
  twitter: { card: 'summary_large_image', title: 'Misal Hub – Best Misal Pav in Mira Road East | Order Online', description: 'Hot, fresh Maharashtrian misal pav since 2015. Order online for home delivery in Mira Road, with Jain options and bulk orders.', images: ['/images/og-share.jpg'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  formatDetection: { telephone: true, address: true, email: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  other: {
    'geo.region': 'IN-MH',
    'geo.placename': 'Mira Road East, Mira Bhayandar',
    'geo.position': `${BRAND.lat};${BRAND.lng}`,
    ICBM: `${BRAND.lat}, ${BRAND.lng}`,
    ...(process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : {}),
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#1b0d05' };

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
        <JsonLd data={websiteSchema()} />
        {children}
        <SmoothScroll />
        <Cursor />
      </body>
    </html>
  );
}

