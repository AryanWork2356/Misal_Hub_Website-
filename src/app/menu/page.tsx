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
  title: 'Menu & Order Online – Misal Pav, Thali, Vada Pav | Mira Road East',
  description: 'See the full Misal Hub menu with prices: Misal Pav, Fry Misal, Misal Thali, Usal Pav, Vada Pav, Sandwiches, Beverages and Jain options. Order online for delivery in Mira Road.',
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
