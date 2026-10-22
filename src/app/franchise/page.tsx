import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import ApplyForm from '@/components/ApplyForm';
import JsonLd from '@/components/JsonLd';
import FaqSection from '@/components/FaqSection';
import { pageMeta, breadcrumbSchema, FRANCHISE_FAQ } from '@/lib/seo';
import '@/styles/franchise.css';

export const metadata: Metadata = pageMeta({
  title: 'Misal Hub Franchise – Own a Misal Pav Outlet | Zero Monthly Royalty',
  description: 'Open your own Misal Hub: a trusted Maharashtrian brand since 2015, our exclusive misal masala, full setup and training. Zero monthly royalty for our first 10 partners. Apply online.',
  path: '/franchise',
  absoluteTitle: true,
});

const ICONS: Record<string, string> = {
  masala: 'M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-4 3-6 5-9zM12 21v-4',
  brand: 'M4 5h16v10H4zM8 19h8M12 15v4M8 9h8',
  setup: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5',
  training: 'M12 4l10 5-10 5L2 9zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
  billing: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  delivery: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5L15.5 10',
  taste: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01',
  pin: 'M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11zM12 12a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z',
  rider: 'M5 18a3 3 0 1 0 0-.01M19 18a3 3 0 1 0 0-.01M5 18l3-7h5l3 7M13 11l-2-4H8M16 8h3',
};

function Icon({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const GET = [
  ['masala', 'Exclusive Misal Masala', 'The signature masala that makes our misal what it is, made only by us and supplied to every outlet, so the taste stays the same.'],
  ['brand', 'The Misal Hub Brand', 'Outside board, banners, menu boards and packaging, all ready to put up from day one.'],
  ['setup', 'Shop Setup at Our Rates', 'Counter, tables and chairs sourced through our suppliers at supplier rates, so you do not overpay.'],
  ['training', 'Training and Recipes', 'Hands-on training in our Mira Road kitchen: recipes, preparation, serving and customer handling.'],
  ['billing', 'Billing and Sales Tools', 'Billing software and daily sales sheets, so you always know exactly how the outlet is doing.'],
  ['delivery', 'Delivery and Online Orders', 'Trained Misal Hub delivery riders in uniform, plus help getting listed on Zomato and Swiggy.'],
] as const;

const STEPS = [
  ['1', 'Apply', 'Fill in the short form below.'],
  ['2', 'We call you', 'Within 24 hours, to understand your plan.'],
  ['3', 'Location approval', 'You suggest a location, we make the final decision.'],
  ['4', 'Agreement and setup', 'Sign the agreement; we set up the shop.'],
  ['5', 'Training and launch', 'We train your team and open your outlet.'],
] as const;

const STANDARDS = [
  ['shield', 'Hygiene comes first', 'Every outlet runs with FSSAI registration and our hygiene routine. Clean kitchens and safe food are not negotiable.'],
  ['taste', 'One taste everywhere', 'The same recipe, the same masala, the same quality in every bowl, in every outlet.'],
  ['tag', 'Protecting the brand', 'Only Misal Hub boards, packaging and menu are used in the shop. No competing brands inside the outlet.'],
  ['pin', 'Locations we approve', 'You suggest the location and we review it, so every outlet has the best chance to succeed.'],
  ['rider', 'Deliveries you can trust', 'Online orders go out with Misal Hub riders. If three online deliveries are missed, online orders pause for that outlet until it is fixed.'],
] as const;

const INVEST = [
  ['Franchise fee', '₹4,00,000', 'One time', 'Brand licence, our exclusive masala supply, training and launch support.', true],
  ['Security deposit', '₹1,00,000', 'Refundable', 'Held for the term of the agreement and returned as set out in it.', false],
  ['Shop setup', 'At cost', 'Paid separately', 'Counter, tables, chairs and boards, sourced through our suppliers at supplier rates. We quote it before you commit.', false],
] as const;

const POINTS = [
  'Tell us a little about yourself and the area you have in mind.',
  'Our team calls you within 24 hours and explains everything openly.',
  'No commitment until you have the full terms in front of you.',
] as const;

export default function FranchisePage() {
  return (
    <PageShell page="franchise">
      <Topbar />
      <Navbar active="franchise" applyAnchor />

      {/* ===== HERO ===== */}
      <section className="fr2-hero">
        <div className="fr2-glow" />
        <div className="container fr2-hero-grid">
          <div className="fr2-hero-copy">
            <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>Franchise</span></div>
            <span className="fr2-eyebrow">FRANCHISE OPPORTUNITY</span>
            <h1 className="fr2-title">Own a <em>Misal Hub</em></h1>
            <p className="fr2-lead">Bring authentic Maharashtrian misal pav to your neighbourhood with a brand Mira Road has trusted since 2015, backed by our own masala, a ready shop setup and hands-on training.</p>
            <div className="fr2-cta">
              <a href="#apply" className="btn btn-gold">Apply now</a>
              <a href="#get" className="fr2-ghost">See what you get</a>
            </div>
            <ul className="fr2-facts">
              <li><b>Since 2015</b><span>Mira Road East</span></li>
              <li><b>FSSAI licensed</b><span>Our own kitchen</span></li>
              <li><b>Exclusive</b><span>Misal Masala</span></li>
            </ul>
          </div>
          <div className="fr2-visual">
            <div className="fr2-photo">
              <img src="/images/shop-16x9.jpg" alt="The Misal Hub shop in Mira Road East" width={1280} height={720} />
            </div>
            <div className="fr2-seal" aria-label="0% monthly royalty for the first 10 partners">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <polygon points={Array.from({ length: 96 }, (_, i) => { const a = (i * Math.PI) / 48; const r = i % 2 ? 44 : 49; return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`; }).join(' ')} />
              </svg>
              <div><b>0%</b><span>monthly royalty</span><small>first 10 partners</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROYALTY BAND ===== */}
      <section className="fr2-band">
        <div className="container fr2-band-in">
          <div className="fr2-zero">0<sup>%</sup></div>
          <div className="fr2-band-txt">
            <h2>No monthly royalty for our first 10 partners</h2>
            <p>We are building the Misal Hub family one outlet at a time, and our first 10 partners keep what they earn. Full terms are set out in your franchise agreement.</p>
          </div>
          <a href="#apply" className="fr2-band-btn">Claim your place</a>
        </div>
      </section>

      {/* ===== WHAT YOU GET ===== */}
      <section className="fr2-section" id="get">
        <div className="container">
          <div className="fr2-head reveal">
            <span>WHAT YOU GET</span>
            <h2>Everything to open <em>with confidence</em></h2>
          </div>
          <div className="fr2-grid">
            {GET.map(([ic, h, p]) => (
              <div key={h} className="fr2-card reveal">
                <div className="fr2-ico"><Icon name={ic} /></div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="fr2-section fr2-alt">
        <div className="container">
          <div className="fr2-head reveal">
            <span>HOW IT WORKS</span>
            <h2>Five simple <em>steps</em></h2>
          </div>
          <ol className="fr2-steps">
            {STEPS.map(([n, h, p]) => (
              <li key={n} className="reveal">
                <i>{n}</i>
                <b>{h}</b>
                <p>{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== STANDARDS ===== */}
      <section className="fr2-section">
        <div className="container">
          <div className="fr2-head reveal">
            <span>OUR STANDARDS</span>
            <h2>What keeps the brand <em>strong</em></h2>
          </div>
          <div className="fr2-std">
            {STANDARDS.map(([ic, h, p]) => (
              <div key={h} className="fr2-std-card reveal">
                <div className="fr2-ico sm"><Icon name={ic} size={26} /></div>
                <div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INVESTMENT ===== */}
      <section className="fr2-section fr2-alt" id="investment">
        <div className="container">
          <div className="fr2-head reveal">
            <span>INVESTMENT</span>
            <h2>Clear numbers, <em>no surprises</em></h2>
          </div>
          <div className="fr2-invest">
            {INVEST.map(([h, amt, tag, p, main]) => (
              <div key={h} className={main ? 'fr2-price main reveal' : 'fr2-price reveal'}>
                <span className="fr2-price-tag">{tag}</span>
                <h3>{h}</h3>
                <div className="fr2-amt">{amt}</div>
                <p>{p}</p>
              </div>
            ))}
          </div>
          <p className="fr2-invest-note">Monthly royalty: <b>zero for our first 10 partners</b>. The full terms, including how the deposit is returned, are set out in your franchise agreement.</p>
        </div>
      </section>

      <FaqSection id="franchise-faq" title="Franchise" accent="questions" items={FRANCHISE_FAQ} />

      {/* ===== APPLY ===== */}
      <section className="fr2-apply" id="apply">
        <div className="container fr2-apply-grid">
          <div className="fr2-apply-side reveal">
            <span className="fr2-eyebrow">APPLY</span>
            <h2>Let us talk about <em>your outlet</em></h2>
            <p>The first step is a simple conversation. Share your details and we will take it from there.</p>
            <ul>
              {POINTS.map((t, i) => <li key={t}><i>{i + 1}</i><span>{t}</span></li>)}
            </ul>
            <div className="fr2-apply-badge"><b>0%</b><span>monthly royalty for our first 10 partners</span></div>
          </div>
          <div className="fr2-apply-card reveal">
            <div className="pill-tag">Franchise Application</div>
            <ApplyForm />
          </div>
        </div>
      </section>

      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Franchise', path: '/franchise' }])} />
      <Footer variant="franchise" />
      <FloatButtons />
    </PageShell>
  );
}
