import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import Topbar from '@/components/Topbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatButtons from '@/components/FloatButtons';
import MyOrders from '@/components/MyOrders';
import { pageMeta } from '@/lib/seo';
import '@/styles/about.css';

export const metadata: Metadata = pageMeta({
  title: 'My Orders – live tracking and bills',
  description: 'Your Misal Hub orders: live tracking for active orders and the full bill for every past order.',
  path: '/my-orders',
  noindex: true,
});

export default function MyOrdersPage() {
  return (
    <PageShell page="about">
      <Topbar />
      <Navbar active="orders" />

      <section className="page-hero">
        <div className="container">
          <div className="mb-breadcrumb"><Link href="/">Home</Link> › <span>My orders</span></div>
          <h1 className="ph-title">My <em>orders</em></h1>
          <p className="ph-sub">Live tracking for what is on its way, and the bill for every order you have placed</p>
        </div>
      </section>

      <section className="story-section">
        <div className="container mo-wrap">
          <MyOrders />
        </div>
      </section>

      <Footer variant="about" />
      <FloatButtons />
    </PageShell>
  );
}
