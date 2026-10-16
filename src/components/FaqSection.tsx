import type { Faq } from '@/lib/seo';
import JsonLd from './JsonLd';
import { faqSchema } from '@/lib/seo';

/** Visible FAQ accordion + matching FAQPage structured data. Pure HTML <details>, no JS. */
export default function FaqSection({ id = 'faq', title, accent, items }: { id?: string; title: string; accent: string; items: Faq[] }) {
  return (
    <section className="faq-sec" id={id}>
      <div className="container">
        <div className="section-hd">
          <h2 className="section-title">{title} <span className="gold">{accent}</span></h2>
        </div>
        <div className="faq-list">
          {items.map((f) => (
            <details key={f.q} className="faq-item reveal">
              <summary><h3>{f.q}</h3><span className="faq-plus" aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd data={faqSchema(items)} />
    </section>
  );
}
