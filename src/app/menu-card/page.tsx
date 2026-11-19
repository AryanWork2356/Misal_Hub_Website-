import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import '@/styles/about.css';

export const metadata: Metadata = {
  title: 'Menu Card',
  description: 'The Misal Hub menu card: misal pav, thali, combos, snacks and more, with prices.',
  alternates: { canonical: '/menu-card' },
  robots: { index: false, follow: true },
};

const PAGES = 10;

export default function MenuCardPage() {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar />

      <section className="page-hero">
        <div className="container">
          <h1 className="ph-title">Our <em>Menu</em></h1>
          <p className="ph-sub">Swipe down to see everything. Pinch to zoom.</p>
          <div className="mc-actions">
            <Link href="/menu" className="btn btn-gold">Order online</Link>
            <a href="/Misal-Hub-Menu.pdf" className="mc-pdf" download>Download PDF</a>
          </div>
        </div>
      </section>

      <section className="mc-section">
        <div className="container mc-wrap">
          {Array.from({ length: PAGES }, (_, i) => (
            <img
              key={i}
              className="mc-page"
              src={`/images/menucard/p${i + 1}.webp`}
              alt={`Misal Hub menu, page ${i + 1} of ${PAGES}`}
              width={1200}
              height={1200}
              loading={i < 2 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
          <div className="mc-actions mc-end">
            <Link href="/menu" className="btn btn-gold">Order online</Link>
          </div>
        </div>
      </section>

      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
