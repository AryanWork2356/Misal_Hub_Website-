import Link from 'next/link';
import PageShell from './PageShell';
import Topbar from './Topbar';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatButtons from './FloatButtons';
import JsonLd from './JsonLd';
import { LEGAL_UPDATED, type LegalDoc } from '@/data/legal';
import { breadcrumbSchema } from '@/lib/seo';
import '@/styles/about.css';

/** Shared layout for the policy pages (privacy, terms, refunds, delivery). */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar />

      <section className="page-hero">
        <div className="container">
          <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>{doc.title} {doc.accent}</span></div>
          <h1 className="ph-title">{doc.title} <em>{doc.accent}</em></h1>
          <p className="ph-sub">{doc.sub}</p>
        </div>
      </section>

      <section className="story-section">
        <div className="container">
          <article className="legal">
            <p className="legal-updated">Last updated: {LEGAL_UPDATED}</p>
            {doc.blocks.map((b) => (
              <div key={b.h} className="legal-block">
                <h2>{b.h}</h2>
                {b.p?.map((t) => <p key={t}>{t}</p>)}
                {b.ul && <ul>{b.ul.map((t) => <li key={t}>{t}</li>)}</ul>}
              </div>
            ))}
            <nav className="legal-links" aria-label="Other policies">
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <Link href="/refund-policy">Cancellation &amp; Refunds</Link>
              <Link href="/delivery-policy">Delivery Policy</Link>
            </nav>
          </article>
        </div>
      </section>

      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: `${doc.title} ${doc.accent}`, path: `/${doc.slug}` }])} />
      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
