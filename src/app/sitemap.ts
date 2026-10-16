import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Fixed date (update when page content changes meaningfully) — a changing date would make search engines distrust the field.
const UPDATED = new Date('2026-10-16');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/menu`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/franchise`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
