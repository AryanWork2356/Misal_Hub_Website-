import { jsonLd } from '@/lib/seo';

/** Structured data for search engines (renders nothing visible). */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}
