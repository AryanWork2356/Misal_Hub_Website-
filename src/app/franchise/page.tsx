import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import ApplyForm from '@/components/ApplyForm';
import '@/styles/franchise.css';

export const metadata: Metadata = {
  title: 'Franchise – Misal Hub | Own Your Misal Hub',
  description: 'Join the Misal Hub franchise family. Own your own authentic Maharashtrian Misal Pav outlet in your city.',
};

const PARTNER = [
  ['01', 'Authentic & High-Demand Product', 'Misal is a daily-consumption food with strong repeat customers and consistent demand throughout the year.'],
  ['02', 'Quality & Hygiene Focus', 'We maintain strict hygiene standards and use quality ingredients to ensure great taste and customer satisfaction.'],
  ['03', 'Affordable & Profitable Menu', 'Pocket-friendly pricing keeps customer volume high and daily sales steady, with strong margins.'],
  ['04', 'Simple & Efficient Operations', 'With a limited menu and fast preparation, the business is easy to manage with minimal staff and low overhead.'],
] as const;

const WHY = [
  ['Brand', 'Brand', 'Legacy | Recognition | Trust', ['Established name in Mira Road since 2015', '4.4 rating from our customers', 'A loyal, returning customer base']],
  ['SOP', 'Framework', 'High Standard | Proven SOP', ['Detailed operations manual', 'Quality control systems', 'Consistent recipe and process']],
  ['Team', 'Support', 'Business | Operational | Crew', ['Business and operations training', 'Staff recruitment help', 'Ongoing guidance']],
  ['Legal', 'Agreement', 'Transparent | Fair | Protected', ['Clear, extendable term', 'Pre-defined territory rights', 'Legal and compliance support']],
  ['Tech', 'Technology Support', 'Digital | Smart | Connected', ['Zomato & Swiggy onboarding and service', 'POS and billing system', 'Digital marketing tools']],
] as const;

const SHINES = [
  ['Target Audience', 'Breakfast-goers, college students, working professionals, families and food lovers who appreciate authentic, affordable Maharashtrian street food.'],
  ['Prominence', "Misal Hub has grown through honest word-of-mouth and a loyal customer base. Our brand is recognised as one of Mira Road's most trusted Misal destinations."],
  ['Authentic Concept', 'We serve Misal the way it was always meant to be — fresh ingredients, a secret spice blend and real butter. No shortcuts, no compromise.'],
  ['Quality & Hygiene', 'Every outlet is trained to follow strict hygiene and food-safety protocols — because we care about every bowl we serve.'],
] as const;

const STEPS = [
  ['01', 'Apply Online', 'Fill in our franchise application form with your details and city.'],
  ['02', 'Discovery Call', 'Our franchise team calls you within 24 hours to understand your goals and answer questions.'],
  ['03', 'Agreement Signed', 'Review and sign the franchise agreement. Your territory is locked exclusively for you.'],
  ['04', 'Setup & Training', 'We help set up your outlet and train your team on recipes, operations and customer service.'],
  ['05', 'Grand Opening', 'Launch your Misal Hub with our full marketing support and start serving from Day 1.'],
] as const;

export default function FranchisePage() {
  return (
    <PageShell page="franchise">
      <Topbar />
      <Navbar active="franchise" applyAnchor />

      {/* ===== BANNER WITH LOGO ===== */}
      <section className="fr-banner">
        <div className="container fr-banner-grid">
          <div>
            <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>Franchise</span></div>
            <h1 className="fr-banner-title">Own a <em>Misal Hub</em></h1>
            <p className="fr-banner-sub">Bring authentic Maharashtrian Misal Pav to your neighbourhood with a brand people already trust.</p>
            <a href="#apply" className="btn btn-gold">Get Franchise</a>
          </div>
          <div className="fr-banner-logo">
            <img src="/images/logo-round.png" alt="Misal Hub logo" />
          </div>
        </div>
      </section>

      {/* ===== PITCH ===== */}
      <section className="pitch-section">
        <div className="container pitch-grid">
          <div className="pitch-copy reveal">
            <div className="pill-tag">Join Our Family</div>
            <h2 className="section-title">Join Hands With<br /><span className="gold">Misal Hub</span></h2>
            <p className="pitch-tagline">Spicing up Mira Road since 2015</p>
            <p>What started on the street is now one of Mira Road&apos;s most loved Misal destinations. We are looking for passionate partners who want to bring authentic Maharashtrian flavours to their neighbourhood — with a proven brand behind them.</p>
            <div className="pitch-stats">
              <div className="ps-item"><span className="ps-n">2015</span><span className="ps-l">Since</span></div>
              <div className="ps-div" />
              <div className="ps-item"><span className="ps-n">10+</span><span className="ps-l">Years Serving</span></div>
              <div className="ps-div" />
              <div className="ps-item"><span className="ps-n">4.4</span><span className="ps-l">Rating</span></div>
            </div>
            <a href="#apply" className="btn btn-gold">Apply Now</a>
          </div>
          <div className="pitch-visual reveal">
            <div className="pv-card">
              <div className="pv-top pv-logo-block">
                <div className="pvc-logo"><img src="/images/logo-round.png" alt="Misal Hub" /></div>
                <div className="pvc-tag">Experience success with <strong>Misal Hub</strong><br />as a Franchise Partner.</div>
                <div className="pvc-sub">Start Your Own Business Journey</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* ===== WHY PARTNER WITH US ===== */}
      <section className="partner-section">
        <div className="container">
          <div className="section-hd reveal">
            <div className="pill-tag">Real Reasons to Join</div>
            <h2 className="section-title">Why <span className="gold">Partner With Us?</span></h2>
            <p className="section-sub">Built on values that make the business work — every single day.</p>
          </div>
          <div className="partner-grid">
            {PARTNER.map(([n, h, p]) => (
              <div key={n} className="partner-card reveal">
                <div className="pc-dot" />
                <div className="pc-icon">{n}</div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
            <div className="partner-card reveal pc-wide">
              <div className="pc-dot" />
              <div className="pc-icon">05</div>
              <h3>Strong Local Connect</h3>
              <p>Misal Hub delivers authentic Maharashtrian taste that creates an emotional connection with customers — turning first-timers into regulars.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* ===== FRANCHISE MODEL ===== */}
      <section className="model-section" id="model">
        <div className="container">
          <div className="section-hd reveal">
            <div className="pill-tag">Franchise Model</div>
            <h2 className="section-title">How you <span className="gold">partner with us</span></h2>
          </div>
          <div className="model-block reveal">
            <div className="model-visual"><img src="/images/logo-round.png" alt="Misal Hub" /></div>
            <div className="model-copy">
              <span className="model-tag">FOFO</span>
              <h3>Franchise Owned, Franchise Operated</h3>
              <h4>You own the outlet and run it. We bring the brand behind it.</h4>
              <p>In this model, Misal Hub licenses its brand name to the franchise partner for an agreed franchise fee and an agreed period of time. The partner owns and operates the outlet day to day, with the recipe, training and guidance of the Misal Hub team behind them.</p>
              <ul className="model-points">
                <li>Brand licence for an agreed term</li>
                <li>Recipe, SOPs and training from the Misal Hub team</li>
                <li>Zomato and Swiggy onboarding and service support</li>
                <li>Franchise fee and terms shared on your discovery call</li>
              </ul>
              <a href="#apply" className="btn btn-gold">Apply for a Franchise</a>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* ===== WHY FRANCHISE ===== */}
      <section className="why-section">
        <div className="container">
          <div className="section-hd reveal">
            <div className="pill-tag">Your Advantage</div>
            <h2 className="section-title">Why <span className="gold">Misal Hub</span> Franchise?</h2>
            <p className="section-sub">Everything you need to build a successful food business — we&apos;ve got you covered.</p>
          </div>
          <div className="why-grid why-grid-5">
            {WHY.map(([tag, title, sub, items]) => (
              <div key={title} className="why-card reveal">
                <div className="wc-icon-wrap"><span>{tag}</span></div>
                <h3>{title}</h3>
                <p>{sub.replaceAll(' | ', '  |  ')}</p>
                <ul>{items.map((li) => <li key={li}>{li}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* ===== WHY MISAL HUB SHINES BRIGHT ===== */}
      <section className="shines-section">
        <div className="container">
          <div className="section-hd reveal">
            <h2 className="section-title" style={{ textTransform: 'uppercase', letterSpacing: 2 }}>Why Misal Hub <span className="gold">Shines Bright</span></h2>
            <p className="section-sub" style={{ maxWidth: 700, margin: '14px auto 0' }}>Misal Hub offers you the opportunity to turn your passion for authentic Maharashtrian food into a successful business. Partner with us and become part of a family built on tradition, quality and community.</p>
          </div>
          <div className="shines-grid">
            {SHINES.map(([h, p]) => (
              <div key={h} className="shine-card reveal"><h4>{h}</h4><p>{p}</p></div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* ===== PROCESS STEPS ===== */}
      <section className="process-section">
        <div className="container">
          <div className="section-hd reveal">
            <div className="pill-tag">How It Works</div>
            <h2 className="section-title">Your Journey to <span className="gold">Owning a Misal Hub</span></h2>
          </div>
          <div className="process-steps">
            {STEPS.map(([n, h, p], i) => (
              <div key={n} className="ps-step reveal">
                <div className="pss-num">{n}</div>
                <h4>{h}</h4>
                <p>{p}</p>
                <div className={i === STEPS.length - 1 ? 'pss-arrow last' : 'pss-arrow'}>{i === STEPS.length - 1 ? '' : '→'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* ===== APPLICATION FORM ===== */}
      <section className="apply-section" id="apply">
        <div className="apply-grid">
          <div className="apply-image apply-logo-panel">
            <img src="/images/logo-round.png" alt="Misal Hub logo" />
            <p>Misal Hub<br /><span>Since 2015</span></p>
          </div>
          <div className="apply-form-wrap">
            <div className="apply-form-card">
              <div className="pill-tag">Franchise Application</div>
              <h2 className="section-title">Join Misal Hub <span className="gold">Family</span></h2>
              <p className="form-sub">Fill in your details — our team will call you back within 24 hours.</p>
              <ApplyForm />
            </div>
          </div>
        </div>
      </section>

      <Footer variant="franchise" />
      <FloatButtons />
    </PageShell>
  );
}
