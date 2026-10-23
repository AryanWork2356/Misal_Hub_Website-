import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import '@/styles/about.css';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar />

      <section className="page-hero nf-hero">
        <div className="container nf-wrap">
          <span className="nf-code">404</span>
          <h1 className="ph-title">This page is <em>not on the menu</em></h1>
          <p className="ph-sub">The link may be old or mistyped. Let us get you back to something delicious.</p>
          <div className="nf-actions">
            <Link href="/menu" className="btn btn-gold">Order online</Link>
            <Link href="/" className="nf-link">Back to home</Link>
          </div>
        </div>
      </section>

      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
