import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { legalBySlug } from '@/data/legal';
import { pageMeta } from '@/lib/seo';

const doc = legalBySlug('refund-policy')!;

export const metadata: Metadata = pageMeta({ title: `${doc.title} ${doc.accent}`, description: doc.description, path: '/refund-policy' });

export default function Page() {
  return <LegalPage doc={doc} />;
}
