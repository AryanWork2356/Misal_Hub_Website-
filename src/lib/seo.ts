import type { Metadata } from 'next';
import { HOURS } from './hours';
import { MENU } from '@/data/menu';
import { GOOGLE } from '@/data/reviews';

/**
 * One place for everything search engines see.
 * When the real domain is connected, set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://misalhub.in) and redeploy:
 * canonical links, the sitemap, Open Graph and structured data all follow it automatically.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://misalhubweb.vercel.app')
).replace(/\/$/, '');

export const BRAND = {
  name: 'Misal Hub',
  legalAlt: 'मिसळ HUB',
  phone: '+919004167448',
  phoneDisplay: '+91 90041 67448',
  email: 'misalhub@gmail.com',
  since: 2015,
  street: 'Shop 2/3, Silver Cassia Apartment, Pleasant Park Road, Near Gayatri Dham',
  locality: 'Mira Road East',
  city: 'Mira Bhayandar',
  region: 'Maharashtra',
  postal: '401107',
  country: 'IN',
  lat: 19.274968,
  lng: 72.8772034,
  mapsUrl: 'https://maps.app.goo.gl/X4WVaYoAc3xvo5Pu5',
  googleListing: GOOGLE.url,
  founders: ['Vinay Jadhav', 'Sonam Jadhav'],
};

export const KEYWORDS = [
  'misal pav', 'misal pav in Mira Road', 'best misal pav Mira Road East', 'misal pav Mira Bhayandar', 'Maharashtrian restaurant Mira Road',
  'Kolhapuri misal', 'Fry Misal', 'Nikhara Misal', 'Misal Thali', 'Vada Pav Mira Road', 'Usal Pav', 'Jain misal pav',
  'misal pav home delivery Mira Road', 'order misal pav online', 'misal pav franchise', 'misal franchise India', 'Misal Hub',
];

const abs = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Shared <head> data for one page: title, description, canonical, Open Graph and Twitter card. */
export function pageMeta({ title, description, path, absoluteTitle = false, noindex = false }:
  { title: string; description: string; path: string; absoluteTitle?: boolean; noindex?: boolean }): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${BRAND.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'website', siteName: BRAND.name, locale: 'en_IN', url: path, title: fullTitle, description,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Misal Hub – authentic Misal Pav, Mira Road East' }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: ['/opengraph-image'] },
  };
}

/** JSON for a <script type="application/ld+json"> tag (< escaped so it can never close the tag early). */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/* ---------------- structured data ---------------- */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export const RESTAURANT_ID = `${SITE_URL}/#restaurant`;

export function restaurantSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'FastFoodRestaurant'],
    '@id': RESTAURANT_ID,
    name: BRAND.name,
    alternateName: [BRAND.legalAlt, 'Misal Hub Mira Road'],
    description: 'Authentic Maharashtrian Misal Pav restaurant in Mira Road East, serving since 2015. Dine-in, takeaway and online delivery. Franchise opportunities available.',
    url: SITE_URL,
    logo: abs('/images/logo-round.png'),
    image: [abs('/images/logo-round.png'), abs('/images/menu/misal-pav.jpg'), abs('/images/menu/fry-misal-pav.jpg'), abs('/images/menu/misal-thali.jpg')],
    telephone: BRAND.phone,
    email: BRAND.email,
    foundingDate: String(BRAND.since),
    founder: BRAND.founders.map((name) => ({ '@type': 'Person', name })),
    slogan: 'Authentic flavours, straight from the heart',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking',
    servesCuisine: ['Maharashtrian', 'Indian', 'Street Food', 'Misal Pav'],
    acceptsReservations: false,
    hasMenu: abs('/menu'),
    menu: abs('/menu'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.street,
      addressLocality: BRAND.locality,
      addressRegion: BRAND.region,
      postalCode: BRAND.postal,
      addressCountry: BRAND.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: BRAND.lat, longitude: BRAND.lng },
    hasMap: BRAND.mapsUrl,
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification', dayOfWeek: DAYS, opens: hh(HOURS.openHour), closes: hh(HOURS.closeHour),
    }],
    areaServed: [
      { '@type': 'City', name: 'Mira Road' }, { '@type': 'City', name: 'Bhayandar' }, { '@type': 'City', name: 'Mira Bhayandar' },
    ],
    sameAs: [BRAND.googleListing, BRAND.mapsUrl],
    potentialAction: {
      '@type': 'OrderAction',
      target: { '@type': 'EntryPoint', urlTemplate: abs('/menu'), inLanguage: 'en-IN', actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] },
      deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet', 'http://purl.org/goodrelations/v1#DeliveryModePickUp'],
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BRAND.name,
    inLanguage: 'en-IN',
    publisher: { '@id': RESTAURANT_ID },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path) })),
  };
}

export type Faq = { q: string; a: string };

export function faqSchema(items: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** Full menu with prices (regular menu) — lets Google show dishes and prices for the restaurant. */
export function menuSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${SITE_URL}/menu#menu`,
    name: 'Misal Hub Menu',
    inLanguage: 'en-IN',
    url: abs('/menu'),
    mainEntityOfPage: abs('/menu'),
    provider: { '@id': RESTAURANT_ID },
    hasMenuSection: MENU.map((c) => ({
      '@type': 'MenuSection',
      name: c.name,
      description: c.blurb,
      hasMenuItem: c.items.filter((i) => i.p != null).map((i) => ({
        '@type': 'MenuItem',
        name: i.name,
        ...(i.note ? { description: i.note } : {}),
        image: abs(`/images/menu/${i.img || i.id}.jpg`),
        offers: { '@type': 'Offer', price: i.p, priceCurrency: 'INR', availability: 'https://schema.org/InStock' },
      })),
    })),
  };
}

/* ---------------- FAQ content (shown on the page AND sent as FAQPage data — they must match) ---------------- */

export const HOME_FAQ: Faq[] = [
  {
    q: 'Where is Misal Hub located?',
    a: 'Misal Hub is at Shop 2/3, Silver Cassia Apartment, Pleasant Park Road, near Gayatri Dham, Mira Road East, Mira Bhayandar, Maharashtra 401107. Use the Directions button on this page to open it in Google Maps.',
  },
  {
    q: 'What are the opening hours?',
    a: 'We are open every day, Monday to Sunday, from 8:00 AM to 8:00 PM (India time).',
  },
  {
    q: 'Do you offer home delivery in Mira Road and Bhayandar?',
    a: 'Yes. You can order straight from this website. Delivery within 1.5 km is free on orders above ₹250. Otherwise the fee is ₹4 per km with a minimum of ₹30, and we deliver up to 10 km from the shop. Payment is online only (no cash on delivery).',
  },
  {
    q: 'What is Misal Pav and what makes yours special?',
    a: 'Misal Pav is Maharashtra’s favourite spicy sprouted-moth-bean curry (usal) topped with farsan, onion and lemon, and served with soft buttery pav. Ours is made fresh every day from a hand-picked spice blend, with a separate tari (spicy gravy) on the side so you can set the heat yourself.',
  },
  {
    q: 'Which dishes are your best sellers?',
    a: 'Our most-ordered dishes are the classic Misal Pav, Fry Misal Pav, Nikahara Misal Pav, Vada Misal Pav, Misal Thali and Nikhara Misal Thali.',
  },
  {
    q: 'Do you have Jain options?',
    a: 'Yes. Most of our menu is available as a Jain version made without onion and garlic. Switch to the Jain Menu on the menu page to see the Jain items and prices.',
  },
  {
    q: 'Can I buy a Misal Hub franchise?',
    a: 'Yes. We offer a franchise-owned, franchise-operated (FOFO) model. See the Franchise page and fill in the short application form, and our team will call you back within 24 hours.',
  },
];

export const FRANCHISE_FAQ: Faq[] = [
  {
    q: 'What is the Misal Hub franchise model?',
    a: 'Misal Hub follows a FOFO model — franchise owned, franchise operated. You own and run your outlet, while Misal Hub provides the brand, the signature recipes and the know-how to run a focused Maharashtrian menu.',
  },
  {
    q: 'Why is a Misal Pav outlet a good franchise business?',
    a: 'Misal is an everyday, high-repeat food. The menu is focused and quick to prepare, so the business is simple to manage with a small team, and the pocket-friendly prices keep customer volume steady.',
  },
  {
    q: 'How do I apply for a Misal Hub franchise?',
    a: 'Fill in the application form on this page with your name, phone, email, city and a convenient time to talk. Our team will call you within 24 hours to discuss the next steps.',
  },
  {
    q: 'Which cities can I open a Misal Hub in?',
    a: 'Tell us your city in the application form and our team will discuss availability and the process with you on the call.',
  },
  {
    q: 'Where did Misal Hub start?',
    a: 'Misal Hub started in 2015 in Mira Road East, Mumbai (Thane district), founded by Vinay Jadhav and Sonam Jadhav, and has been serving authentic Maharashtrian misal ever since.',
  },
];
