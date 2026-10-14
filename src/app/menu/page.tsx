import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import MenuApp from '@/components/MenuApp';
import '@/styles/menu.css';

export const metadata: Metadata = {
  title: 'Menu & Order Online – Misal Hub | Mira Road East',
  description: 'The full Misal Hub menu with prices — Misal Pav, Usal Pav, Thali, Combos, Snacks, Vada Pav, Sandwiches, Beverages and Jain options. Order online.',
};

export default function MenuPage() {
  return (
    <PageShell page="menu" className="order-page">
      <Topbar />
      <Navbar active="menu" />
      <MenuApp />
      <Footer variant="menu" />
      <FloatButtons threshold={500} />
    </PageShell>
  );
}
