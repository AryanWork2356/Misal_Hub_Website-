import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Fixed date (update when page content changes meaningfully) — a changing date would make search engines distrust the field.
const UPDATED = new Date('2026-10-23');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/menu`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/franchise`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/offer`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/bulk-orders`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    ...['privacy-policy', 'terms', 'refund-policy', 'delivery-policy'].map((p) => ({ url: `${SITE_URL}/${p}`, lastModified: UPDATED, changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
}
