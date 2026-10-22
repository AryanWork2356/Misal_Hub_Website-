import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import MenuApp from '@/components/MenuApp';
import JsonLd from '@/components/JsonLd';
import { pageMeta, menuSchema, breadcrumbSchema } from '@/lib/seo';
import '@/styles/menu.css';

export const metadata: Metadata = pageMeta({
  title: 'Misal Pav Menu & Online Order – Mira Road East | Misal Hub',
  description: 'Full Misal Hub menu with prices: misal pav, fry misal, thali, vada pav, sandwiches and Jain options. Order online for hot, fresh delivery in Mira Road East.',
  path: '/menu',
  absoluteTitle: true,
});

export default function MenuPage() {
  return (
    <PageShell page="menu" className="order-page">
      <Topbar />
      <Navbar active="menu" />
      <MenuApp />
      <JsonLd data={menuSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Menu & Order', path: '/menu' }])} />
      <Footer variant="menu" />
      <FloatButtons threshold={500} />
    </PageShell>
  );
}
