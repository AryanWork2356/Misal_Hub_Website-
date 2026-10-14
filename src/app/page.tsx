import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import HeroVideo from '@/components/HeroVideo';
import { OpenBadge } from '@/components/OpenLive';
import { MENU, BESTSELLERS } from '@/data/menu';
import { getReviewsData } from '@/lib/server/reviews';
import '@/styles/home.css';

const byId = Object.fromEntries(MENU.flatMap((c) => c.items.map((i) => [i.id, i])));

const MARQUEE = ['Misal Pav', 'Fry Misal Pav', 'Cheese Misal Pav', 'Nikahara Misal Pav', 'Vada Misal Pav', 'Misal Thali', 'Chulha Misal', 'Vada Pav', 'Kulhad Tea', 'Kokam Sarbat'];

function Stars({ n }: { n: number }) {
  return (
    <span className="rv-stars" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= Math.round(n) ? undefined : 'off'}>★</span>)}
    </span>
  );
}

const clip = (t: string, n = 300) => (t.length > n ? `${t.slice(0, n).trimEnd()}…` : t);

export default async function HomePage() {
  const google = await getReviewsData();
  return (
    <PageShell page="home">
      <Topbar />
      <Navbar home />

      {/* ===== HERO ===== */}
      <section className="hero hero-cine" id="home">
        <HeroVideo src="/videos/hero.mp4" poster="/videos/hero-poster.jpg" />
        <div className="hero-overlay" />
        <div className="container hero-grid">
          <div className="hero-text">
            <div className="hero-eyebrow">Since 2015 &nbsp;·&nbsp; Mira Road East</div>
            <h1 className="hero-h1">
              <span className="hl-mask"><span className="hl">Authentic Flavours,</span></span>
              <span className="hl-mask"><span className="hl"><em>Straight from the Heart</em></span></span>
            </h1>
            <p className="hero-desc">
              Every bowl of Misal Pav is crafted with hand-picked spices, fresh sprouts and a secret recipe that has kept Mira Road coming back for more — since 2015.
            </p>
            <div className="hero-btns">
              <Link href="/menu" className="btn btn-gold magnetic">Order Online</Link>
              <Link href="/franchise" className="btn btn-outline-w magnetic">Get Franchise</Link>
            </div>
          </div>
        </div>
        <div className="scroll-cue"><span />Scroll</div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="marquee-bar">
        <div className="marquee-track">
          {[0, 1].flatMap((round) => MARQUEE.flatMap((t) => [
            <span key={`${round}-${t}`}>{t}</span>,
            <span key={`${round}-${t}-d`} className="dot">✦</span>,
          ]))}
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="stats-cream">
        <div className="container stats-row">
          <div className="stat-block"><span className="sn">2015</span><p>Since</p></div>
          <div className="stat-divider" />
          <div className="stat-block"><span className="sn" data-target="10">0</span><span className="ss">+</span><p>Years Serving</p></div>
          <div className="stat-divider" />
          <div className="stat-block"><span className="sn" data-target="4.4" data-decimal="1">0</span><span className="ss">/ 5</span><p>Google Rating</p></div>
          <div className="stat-divider" />
          <div className="stat-block"><span className="sn">8AM – 8PM</span><p>Working Hours</p></div>
        </div>
      </div>

      {/* ===== BEST SELLERS ===== */}
      <section className="hs" id="best">
        <div className="hs-pin">
          <div className="container hs-head">
            <div>
              <div className="pill-tag">Best Sellers</div>
              <h2 className="section-title">The dishes people <span className="gold">come back for</span></h2>
              <p>Our most-loved plates — the heart of every Misal Hub outlet.</p>
            </div>
            <Link href="/menu" className="btn btn-gold magnetic">See the Whole Menu</Link>
          </div>
          <div className="hs-track" id="bestTrack">
            {BESTSELLERS.map((id) => {
              const it = byId[id];
              if (!it) return null;
              return (
                <Link key={id} href={`/menu#item-${it.id}`} className="hs-card spot tilt">
                  <div className="hs-media">
                    <img src={`/images/menu/${it.img || it.id}.jpg`} alt={it.name} loading="lazy" />
                  </div>
                  <div className="hs-info">
                    <h3>{it.name}</h3>
                    <span className="hs-price">{it.p != null ? `₹${it.p}` : ''}</span>
                  </div>
                  <span className="hs-order">Order this →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== ORDER ONLINE ===== */}
      <section className="order-banner" id="order">
        <div className="container ob-grid">
          <div className="ob-copy">
            <div className="pill-tag">Order Online</div>
            <h2 className="section-title">Our entire menu, <span className="gold">delivered</span></h2>
            <p>Browse every dish we serve, add to your order and send it to our kitchen in a minute. Regular and Jain menus, straight from Mira Road East.</p>
            <Link href="/menu" className="btn btn-gold magnetic">Start Your Order</Link>
            <div className="ob-points">
              <div><b>01</b><span>Pick from the full menu — regular or Jain</span></div>
              <div><b>02</b><span>Enter your name, phone and address</span></div>
              <div><b>03</b><span>Send the order to us on WhatsApp and we confirm</span></div>
            </div>
          </div>
          <div className="ob-chips" id="orderChips">
            {MENU.map((c) => <Link key={c.id} href={`/menu#cat-${c.id}`} className="oc-chip">{c.name}</Link>)}
          </div>
        </div>
      </section>

      {/* ===== STORY / RECIPE ===== */}
      <section className="story" id="about">
        <div className="container story-grid">
          <div className="story-photos">
            <img className="sp1" data-parallax="-0.12" src="/images/menu/misal-pav.jpg" alt="Misal Pav" loading="lazy" />
            <img className="sp2" data-parallax="0.1" src="/images/menu/nikahara-misal-pav.jpg" alt="Nikahara Misal Pav in a clay pot" loading="lazy" />
            <img className="sp3" data-parallax="-0.06" src="/images/menu/vada-misal-pav.jpg" alt="Vada Misal Pav" loading="lazy" />
          </div>
          <div className="story-copy">
            <div className="pill-tag">Our Story</div>
            <h2 className="section-title">The Misal Hub <span className="gold">Recipe</span></h2>
            <p>The Misal Hub recipe is a well-kept family secret, passed down with love. Our masala blend is ground fresh every morning. What makes our misal extra special is the three heat levels — each adjusted using our signature tari (spice-laden gravy) on the side.</p>
            <p>From a small roadside stall to Mira Road&apos;s favourite food stop — every bowl we serve carries years of tradition and a whole lot of love.</p>
            <div className="story-feats">
              <div><strong>Secret 12-Spice Blend</strong><small>Ground fresh every morning</small></div>
              <div><strong>Overnight Sprouted Beans</strong><small>Fresh matki soaked nightly</small></div>
              <div><strong>Real Butter Pav</strong><small>Toasted on iron tawa</small></div>
              <div><strong>Made with Love</strong><small>Every bowl, every day</small></div>
            </div>
            <Link href="/about" className="btn btn-gold magnetic">Know More</Link>
          </div>
        </div>
      </section>

      {/* ===== FRANCHISE TEASER ===== */}
      <section className="fr-teaser" id="franchise">
        <div className="container frt-grid">
          <div className="frt-copy">
            <div className="pill-tag">Franchise Opportunity</div>
            <h2 className="section-title">Own your own <span className="gold">Misal Hub</span></h2>
            <p>Love our food? Bring Misal Hub to your city. A proven recipe, a trusted brand and complete support — training, setup, supply and delivery-app onboarding.</p>
            <Link href="/franchise" className="btn btn-gold magnetic">Get Franchise</Link>
          </div>
          <div className="frt-card spot tilt">
            <img src="/images/logo.jpg" alt="Misal Hub logo" />
            <h3>Spicing up Mira Road since 2015</h3>
            <p>Join a brand people already trust.</p>
          </div>
        </div>
      </section>

      {/* ===== GOOGLE REVIEWS (src/data/reviews.ts) ===== */}
      <section className="reviews" id="reviews">
        <div className="container">
          <div className="section-hd">
            <div className="pill-tag">Google Reviews</div>
            <h2 className="section-title">What our <span className="gold">customers say</span></h2>
          </div>
          <div className="rv-score">
            <div className="rv-num">{google.rating}</div>
            <div className="rv-meta">
              <Stars n={google.rating} />
              <small>Average rating on Google{google.count ? ` · ${google.count} reviews` : ''}</small>
            </div>
          </div>
          {google.sample && (
            <p className="rv-sample" style={{ textAlign: 'center', fontSize: '.78rem', marginBottom: 18, opacity: 0.75 }}>
              Sample reviews shown only to preview the layout — not real customer reviews.
            </p>
          )}
          {google.reviews.length > 0 && (
            <div className="rv-grid">
              {google.reviews.map((r, i) => (
                <div key={i} className="rv-card spot">
                  <Stars n={r.stars || 5} />
                  <p>{clip(r.text)}</p>
                  <strong>{r.name}</strong>
                  {r.when && <small>{r.when}</small>}
                </div>
              ))}
            </div>
          )}
          <div className="rv-cta">
            <a className="btn btn-gold magnetic" href={google.url} target="_blank" rel="noopener noreferrer">Read all our reviews on Google</a>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="section-hd">
            <h2 className="section-title">Visit <span className="gold">Misal Hub</span></h2>
          </div>
          <div className="contact-grid">
            <div className="contact-card reveal">
              <h4>Address</h4>
              <p>Shop 2/3, Silver Cassia Apartment,<br />Pleasant Park Road, Mira Road East</p>
            </div>
            <div className="contact-card reveal">
              <h4>Opening Hours</h4>
              <p>Monday – Sunday<br />8:00 AM – 8:00 PM</p>
              <OpenBadge />
            </div>
            <div className="contact-card reveal">
              <h4>Call / WhatsApp</h4>
              <p>+91 90041 67448</p>
              <a href="https://wa.me/919004167448" className="btn btn-gold btn-sm" target="_blank" rel="noopener noreferrer">WhatsApp Us</a>
            </div>
          </div>
          <div className="map-wrap reveal">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3763.2637845027457!2d72.85905!3d19.28920!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDE3JzIxLjEiTiA3MsKwNTEnMzIuNiJF!5e0!3m2!1sen!2sin!4v1234567890"
              width="100%" height="360" style={{ border: 0 }} allowFullScreen loading="lazy" title="Misal Hub Location"
            />
          </div>
        </div>
      </section>

      <Footer variant="home" />
      <FloatButtons />
    </PageShell>
  );
}
