import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import OfferCta from '@/components/OfferCta';
import { MENU } from '@/data/menu';
import { PROMOS } from '@/lib/promo';
import { DELIVERY } from '@/lib/pricing';
import { pageMeta } from '@/lib/seo';
import '@/styles/about.css';

export const metadata: Metadata = pageMeta({
  title: `${PROMOS.MISAL10.title} – order direct from Misal Hub`,
  description: 'Order Misal Pav straight from the Misal Hub kitchen and get 10% off your first order, whatever you order. Fresh, hot, delivered in Mira Road and Bhayandar.',
  path: '/offer',
  noindex: true,
});

const P = PROMOS.MISAL10;
const byId = Object.fromEntries(MENU.flatMap((c) => c.items.map((i) => [i.id, i])));
const PICKS = ['misal-pav', 'fry-misal-pav', 'misal-thali'];

/** a 24-point starburst, used as the spinning "10% OFF" seal */
const SEAL = Array.from({ length: 48 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 48 - Math.PI / 2;
  const r = i % 2 === 0 ? 49 : 43;
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

/* fixed positions so the sparkles render the same on the server and in the browser */
const SPARKS = [
  [6, 18, 0], [14, 62, 1.2], [22, 30, 0.6], [31, 80, 1.8], [40, 12, 0.3], [48, 56, 2.1], [57, 24, 1.5], [64, 74, 0.9],
  [72, 14, 2.4], [80, 48, 0.2], [87, 78, 1.1], [93, 26, 1.9], [11, 90, 2.6], [52, 92, 0.7], [76, 92, 1.4], [96, 60, 2.2],
];
const MARQUEE = ['FRESH & HOT', 'STRAIGHT FROM OUR KITCHEN', 'SINCE 2015', 'MIRA ROAD EAST', '10% OFF YOUR FIRST ORDER', 'MISAL PAV'];

export default function OfferPage() {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="of-hero">
        <div className="of-glow g1" aria-hidden="true" />
        <div className="of-glow g2" aria-hidden="true" />
        {SPARKS.map(([x, y, d], i) => <i key={i} className="of-spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} aria-hidden="true" />)}

        <div className="container of-grid">
          <div className="of-copy">
            <span className="of-pill"><i aria-hidden="true">✦</i> WELCOME OFFER</span>
            <h1 className="of-title">
              Your first order,<br />
              <em>{P.percent}% off</em>
            </h1>
            <p className="of-sub">
              Hot, fresh misal straight from our kitchen to your door — and a little thank-you for trying us. Your discount is added for you.
            </p>
            <OfferCta code="MISAL10" />
            <ul className="of-points">
              <li><span aria-hidden="true">✓</span> {P.percent}% off your whole food order</li>
              <li><span aria-hidden="true">✓</span> Delivery ₹{DELIVERY.nearFee} (to {DELIVERY.nearKm} km) · ₹{DELIVERY.farFee} (to {DELIVERY.maxKm} km)</li>
              <li><span aria-hidden="true">✓</span> Pay online · UPI, cards, net banking</li>
            </ul>
          </div>

          <div className="of-visual" aria-hidden="true">
            <div className="of-plate" />
            <div className="of-photo ph1"><img src="/images/menu/misal-pav.jpg" alt="" /><span>Misal Pav</span></div>
            <div className="of-photo ph2"><img src="/images/menu/fry-misal-pav.jpg" alt="" /><span>Fry Misal</span></div>
            <div className="of-photo ph3"><img src="/images/menu/vada-misal-pav.jpg" alt="" /><span>Vada Misal</span></div>
            <div className="of-seal">
              <svg viewBox="0 0 100 100"><polygon points={SEAL} /></svg>
              <div><b>{P.percent}%</b><small>OFF</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="of-marquee" aria-hidden="true">
        <div className="of-marquee-track">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => <span key={i}>{t}<i>✦</i></span>)}
        </div>
      </div>

      {/* ============ HOW IT WORKS ============ */}
      <section className="of-section">
        <div className="container">
          <div className="of-head reveal">
            <span>HOW IT WORKS</span>
            <h2>Three easy steps to <em>your discount</em></h2>
          </div>
          <div className="of-steps">
            <div className="of-step reveal"><div className="of-num">1</div><h3>Pick your favourites</h3><p>Misal Pav, Fry Misal, Thali, Vada Pav and more from our full menu.</p></div>
            <div className="of-step reveal"><div className="of-num">2</div><h3>Offer applied for you</h3><p>Tap the button above — {P.percent}% off your whole order is added at checkout. No typing needed.</p></div>
            <div className="of-step reveal"><div className="of-num">3</div><h3>Pay online, we deliver</h3><p>Pay securely, and we bring it hot to your door in Mira Road &amp; Bhayandar.</p></div>
          </div>
        </div>
      </section>

      {/* ============ FAVOURITES ============ */}
      <section className="of-section of-alt">
        <div className="container">
          <div className="of-head reveal">
            <span>CROWD FAVOURITES</span>
            <h2>Great dishes for your <em>first order</em></h2>
          </div>
          <div className="of-picks">
            {PICKS.map((id) => {
              const it = byId[id];
              if (!it) return null;
              return (
                <Link key={id} href={`/menu?promo=MISAL10#item-${id}`} className="of-pick reveal">
                  <div className="of-pick-img"><img src={`/images/menu/${it.img || it.id}.jpg`} alt={it.name} loading="lazy" /></div>
                  <div className="of-pick-body">
                    <h3>{it.name}</h3>
                    {it.note && <p>{it.note}</p>}
                    <div className="of-pick-foot"><b>₹{it.p}</b><span>Order with {P.percent}% off →</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TRUST + TERMS ============ */}
      <section className="of-section">
        <div className="container">
          <div className="of-trust">
            <div className="reveal"><b>Straight from the kitchen</b><p>Made fresh when you order, with the same recipe since 2015.</p></div>
            <div className="reveal"><b>Clear, simple pricing</b><p>Menu prices plus a flat delivery fee, shown before you pay.</p></div>
            <div className="reveal"><b>A real shop you can visit</b><p>Silver Cassia Apartment, Pleasant Park Road, Mira Road East.</p></div>
          </div>

          <details className="of-terms reveal">
            <summary>Offer terms</summary>
            <ul>
              <li>{P.percent}% off the food total, on any order amount. The delivery fee is not discounted.</li>
              <li>Valid on your first order from misalhub.com, once per customer. It cannot be combined with other offers.</li>
              <li>If you have already used it, you can still order at the normal price.</li>
              <li>We may change or end this offer at any time. See our <Link href="/terms">Terms &amp; Conditions</Link>.</li>
            </ul>
          </details>
        </div>
      </section>

      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
