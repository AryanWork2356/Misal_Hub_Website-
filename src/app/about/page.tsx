import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import '@/styles/about.css';

export const metadata: Metadata = {
  title: 'About Us – Misal Hub | Mira Road East',
  description: 'The story behind Misal Hub — it started on the street in 2015 and word spread fast.',
};

export default function AboutPage() {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar active="about" />

      {/* ===== PAGE HERO ===== */}
      <section className="page-hero">
        <div className="container">
          <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>About Us</span></div>
          <h1 className="ph-title">About <em>Misal Hub</em></h1>
          <p className="ph-sub">Serving Mira Road since 2015</p>
        </div>
      </section>

      {/* ===== STORY ===== */}
      <section className="story-section">
        <div className="container">
          <div className="timeline">
            <div className="tl-item reveal">
              <div className="tl-icon">1</div>
              <div className="tl-content left">
                <div className="tl-year">2015</div>
                <h3>It Started on the Street</h3>
                <p>Misal Hub began as a small roadside stall in Mira Road — a gas stove, a big pot of misal and a simple belief that honest, authentic Maharashtrian flavour would always find its people. Every morning the pot was set up fresh, and every morning it ran out.</p>
              </div>
            </div>

            <div className="tl-item reveal">
              <div className="tl-icon">2</div>
              <div className="tl-content right">
                <div className="tl-year">Soon After</div>
                <h3>Word Spreads Fast</h3>
                <p>Word of mouth did the rest. Office-goers, students, families and neighbours kept coming back, and they kept bringing friends. The reviews said the same thing again and again — the misal, the tari and the pav were something special.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOUNDERS ===== */}
      <section className="founders-section">
        <div className="container">
          <div className="section-hd reveal">
            <div className="pill-tag">The People Behind It</div>
            <h2 className="section-title">Our <span className="gold">Founders</span></h2>
          </div>
          <div className="founders-grid founders-two">
            <div className="founder-card reveal">
              <img className="founder-photo" src="/images/team/founder.jpg" alt="Vinay Jadhav, Founder of Misal Hub" />
              <div className="fc-name">Vinay Jadhav</div>
              <div className="fc-role">Founder</div>
            </div>
            <div className="founder-card reveal">
              <img className="founder-photo" src="/images/team/co-founder.jpg" alt="Sonam Jadhav, Co-Founder of Misal Hub" />
              <div className="fc-name">Sonam Jadhav</div>
              <div className="fc-role">Co-Founder</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA STRIP ===== */}
      <section className="cta-strip">
        <div className="container cta-inner">
          <div>
            <h3>Come visit us — open daily, 8 AM to 8 PM</h3>
            <p>Shop 2/3, Silver Cassia Apartment, Pleasant Park Road, Mira Road East</p>
          </div>
          <div className="cta-btns">
            <Link href="/menu" className="btn btn-gold">Order Online</Link>
          </div>
        </div>
      </section>

      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
