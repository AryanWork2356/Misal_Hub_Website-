import Link from 'next/link';

type Variant = 'home' | 'about' | 'franchise' | 'menu';

const Brand = ({ text }: { text: string }) => (
  <div className="footer-brand">
    <img src="/images/logo.png" alt="Misal Hub" className="footer-logo" />
    <p>{text}</p>
  </div>
);

const Links = () => (
  <ul>
    <li><Link href="/">Home</Link></li>
    <li><Link href="/about">About Us</Link></li>
    <li><Link href="/menu">Menu &amp; Order</Link></li>
    <li><Link href="/franchise">Franchise</Link></li>
    <li><Link href="/#contact">Contact</Link></li>
  </ul>
);

export default function Footer({ variant }: { variant: Variant }) {
  const tagline = 'Authentic Maharashtrian flavours, served fresh every day at Mira Road East. Come hungry, leave happy!';
  return (
    <footer className="footer">
      <div className="footer-gold">
        <div className="container footer-grid">
          {variant === 'menu'
            ? <Brand text="Authentic Maharashtrian flavours served fresh since 2015. Mira Road's most loved Misal destination." />
            : <Brand text={tagline} />}

          {variant === 'home' && (
            <>
              <div className="footer-col">
                <h5>Get In Touch</h5>
                <ul>
                  <li>misalhub@gmail.com</li>
                  <li>+91 90041 67448</li>
                  <li>Shop 2/3, Silver Cassia Apt,<br />Pleasant Park Rd, Mira Road East – 401107</li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Quick Links</h5>
                <ul>
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/menu">Menu &amp; Order</Link></li>
                  <li><Link href="/franchise">Franchise</Link></li>
                </ul>
                <h5 style={{ marginTop: 20 }}>Working Hours</h5>
                <ul><li>8:00 AM – 8:00 PM, all days</li></ul>
              </div>
            </>
          )}

          {variant === 'about' && (
            <>
              <div className="footer-col">
                <h5>Get In Touch</h5>
                <ul>
                  <li>misalhub@gmail.com</li>
                  <li>+91 90041 67448</li>
                  <li>Shop 2/3, Silver Cassia Apt,<br />Pleasant Park Rd, Mira Road East</li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Working Hours</h5>
                <ul>
                  <li>8:00 AM – 8:00 PM</li>
                  <li>Open all days</li>
                </ul>
              </div>
            </>
          )}

          {variant === 'franchise' && (
            <>
              <div className="footer-col">
                <h5>Get In Touch</h5>
                <ul>
                  <li>misalhub@gmail.com</li>
                  <li>+91 90041 67448</li>
                  <li>Shop 2/3, Silver Cassia Apt,<br />Mira Road East – 401107</li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Quick Links</h5>
                <Links />
                <h5 style={{ marginTop: 20 }}>Working Hours</h5>
                <ul><li>8:00 AM – 8:00 PM, all days</li></ul>
              </div>
            </>
          )}

          {variant === 'menu' && (
            <>
              <div className="footer-col">
                <h5>Quick Links</h5>
                <Links />
              </div>
              <div className="footer-col">
                <h5>Contact</h5>
                <ul>
                  <li>Shop 2/3, Silver Cassia, Pleasant Park Road, Mira Road East</li>
                  <li>+91 90041 67448</li>
                  <li>8 AM – 8 PM, all days</li>
                </ul>
              </div>
            </>
          )}
        </div>
        <div className="footer-bottom">
          <p>© 2026 Misal Hub. All rights reserved.</p>
          <p className="footer-legal">
            <Link href="/privacy-policy">Privacy Policy</Link> · <Link href="/terms">Terms &amp; Conditions</Link> · <Link href="/bulk-orders">Bulk Orders</Link> · <Link href="/refund-policy">Cancellation &amp; Refunds</Link> · <Link href="/delivery-policy">Delivery Policy</Link> · <Link href="/credits">Photo credits</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
