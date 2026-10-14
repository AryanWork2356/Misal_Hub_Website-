import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import { MENU } from '@/data/menu';
import { PHOTO_CREDITS } from '@/data/photo-credits';
import '@/styles/about.css';

export const metadata: Metadata = {
  title: 'Photo credits – Misal Hub',
  description: 'Credits and licences for the dish photographs used on the Misal Hub menu.',
};

const names = Object.fromEntries(MENU.flatMap((c) => c.items.map((i) => [i.id, i.name])));

export default function CreditsPage() {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar />

      <section className="page-hero">
        <div className="container">
          <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>Photo credits</span></div>
          <h1 className="ph-title">Photo <em>credits</em></h1>
          <p className="ph-sub">Thank you to the photographers who share their work openly</p>
        </div>
      </section>

      <section className="story-section">
        <div className="container">
          <p className="credits-intro">
            Some dishes on our menu are shown with photographs from Wikimedia Commons, used under the licences below. They were cropped to a square and
            resized for this website, and those adapted copies stay under the same licence as the original. These are stand-in pictures and may differ from
            how your order looks. Photos of our own dishes belong to Misal Hub.
          </p>
          <ul className="credits-list">
            {PHOTO_CREDITS.map((c) => (
              <li key={c.dish}>
                <strong>{names[c.dish] || c.dish}</strong>
                <span>
                  “{c.title}” by {c.author} — <a href={c.licenseUrl || c.page} target="_blank" rel="noopener noreferrer">{c.license}</a> —{' '}
                  <a href={c.page} target="_blank" rel="noopener noreferrer">source</a>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
