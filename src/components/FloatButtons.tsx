'use client';
import { useEffect, useRef, useState } from 'react';
import { useIsOpen } from './OpenLive';
import { SHOP } from '@/lib/pricing';

const WA = `https://wa.me/${SHOP.whatsapp}`;
const link = (text: string) => `${WA}?text=${encodeURIComponent(text)}`;

const QUICK = [
  { icon: '🍛', label: 'Place an order', text: 'Hi Misal Hub! I would like to place an order.' },
  { icon: '🎉', label: 'Bulk / party order', text: 'Hi Misal Hub! I want to enquire about a bulk / party order.' },
  { icon: '🤝', label: 'Franchise enquiry', text: 'Hi Misal Hub! I am interested in a Misal Hub franchise. Please share the details.' },
  { icon: '📍', label: 'Location & timings', text: 'Hi Misal Hub! Could you share your location and timings?' },
];

const WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

/** Glowing WhatsApp chat widget (quick-message panel) + back-to-top button (shown after scrolling). */
export default function FloatButtons({ threshold = 400 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);
  const [panel, setPanel] = useState(false);
  const [hint, setHint] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const isOpen = useIsOpen();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  /* a small "Chat with us" nudge a few seconds after arriving (once per visit) */
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('mh_wa_hint') === '1'; } catch { /* private mode */ }
    if (seen) return;
    const show = setTimeout(() => setHint(true), 6000);
    const hide = setTimeout(() => setHint(false), 14000);
    try { sessionStorage.setItem('mh_wa_hint', '1'); } catch { /* ignore */ }
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onDoc = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setPanel(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanel(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [panel]);

  return (
    <>
      <div className={`wa-widget${panel ? ' is-open' : ''}`} ref={wrap}>
        <div className="wa-panel" role="dialog" aria-label="Chat with Misal Hub on WhatsApp" aria-hidden={!panel}>
          <div className="wa-head">
            <span className="wa-avatar"><img src="/images/logo-round.png" alt="" /></span>
            <div>
              <strong>Misal Hub</strong>
              <small><i className={isOpen ? 'on' : 'off'} /> {isOpen ? 'Open now · replies fast' : 'Closed now · we reply when we open (8 AM)'}</small>
            </div>
            <button type="button" className="wa-x" aria-label="Close" onClick={() => setPanel(false)}>×</button>
          </div>
          <div className="wa-body">
            <p className="wa-bubble">Namaste! 🙏 How can we help you today?</p>
            {QUICK.map((q) => (
              <a key={q.label} className="wa-quick" href={link(q.text)} target="_blank" rel="noopener noreferrer" onClick={() => setPanel(false)} tabIndex={panel ? 0 : -1}>
                <span>{q.icon}</span>{q.label}<em aria-hidden="true">→</em>
              </a>
            ))}
          </div>
          <a className="wa-start" href={WA} target="_blank" rel="noopener noreferrer" tabIndex={panel ? 0 : -1}>Start a chat on WhatsApp</a>
        </div>

        <span className={`wa-hint${hint && !panel ? ' show' : ''}`} aria-hidden="true">Chat with us 👋</span>

        <button type="button" className="wa-fab" aria-label="Chat on WhatsApp" aria-expanded={panel} onClick={() => { setPanel((p) => !p); setHint(false); }}>
          <span className="wa-ring" aria-hidden="true" />
          <span className="wa-ring r2" aria-hidden="true" />
          <svg viewBox="0 0 24 24" width="30" height="30" fill="#fff" aria-hidden="true"><path d={WA_PATH} /></svg>
          <b className="wa-dot" aria-hidden="true" />
        </button>
      </div>

      <button
        className={`scroll-top${visible ? ' visible' : ''}`}
        id="scrollTop"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </>
  );
}
