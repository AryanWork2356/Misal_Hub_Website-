import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import BulkForm from '@/components/BulkForm';
import JsonLd from '@/components/JsonLd';
import { BULK } from '@/lib/bulk';
import { pageMeta, breadcrumbSchema } from '@/lib/seo';
import '@/styles/about.css';

export const metadata: Metadata = pageMeta({
  title: 'Bulk & Party Orders – Misal Pav for 10 to 100+ People | Misal Hub',
  description: 'Birthday, office lunch, puja or family function? Order hot misal pav and Maharashtrian snacks in bulk from Misal Hub, Mira Road East. Share your event and get a quote.',
  path: '/bulk-orders',
  absoluteTitle: true,
});

export default function BulkPage() {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar />

      <section className="bk-hero">
        <div className="container">
          <div className="mb-breadcrumb"><Link href="/">Home</Link> › <Link href="/menu">Menu &amp; Order</Link> › <span>Bulk orders</span></div>
          <span className="bk-pill">PARTIES · OFFICES · FUNCTIONS</span>
          <h1 className="bk-title">Bulk &amp; party <em>orders</em></h1>
          <p className="bk-sub">Feeding 10, 50 or 100+ people? We prepare hot, fresh Maharashtrian food in large quantities, with Jain options, delivered to your venue or ready for pickup.</p>
          <a href="#bulk-form" className="btn btn-gold btn-lg">Request a quote ↓</a>
        </div>
      </section>

      <section className="story-section">
        <div className="container">
          <div className="bk-steps">
            <div className="reveal"><em>1</em><b>Tell us about your event</b><p>Date, time, number of people and what you would like. It takes two minutes.</p></div>
            <div className="reveal"><em>2</em><b>We call you with a quote</b><p>Within about {BULK.callbackHours} hours we confirm the menu, the price and the timing with you.</p></div>
            <div className="reveal"><em>3</em><b>Fresh food, on time</b><p>We prepare your order fresh and deliver it hot to your venue, or you collect it from the shop.</p></div>
          </div>

          <div className="bk-layout">
            <aside className="bk-side reveal">
              <h3>Good to know</h3>
              <ul>
                <li>Please send your request at least <b>{BULK.leadHours} hours</b> before the event.</li>
                <li>Jain and special-diet requests are welcome. Tell us in the form.</li>
                <li>We will confirm everything on a call before you pay anything.</li>
                <li>In a hurry? Call or WhatsApp <b>+91 90041 67448</b>.</li>
              </ul>
              <a href="https://wa.me/919004167448?text=Hi%20Misal%20Hub!%20I%20want%20to%20enquire%20about%20a%20bulk%20%2F%20party%20order." className="btn btn-sm bk-wa" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </aside>
            <div className="bk-card reveal" id="bulk-form">
              <BulkForm />
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Menu & Order', path: '/menu' }, { name: 'Bulk orders', path: '/bulk-orders' }])} />
      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
