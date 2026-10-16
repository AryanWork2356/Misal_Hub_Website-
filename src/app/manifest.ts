import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Misal Hub – Authentic Misal Pav, Mira Road East',
    short_name: 'Misal Hub',
    description: 'Order authentic Maharashtrian Misal Pav online from Misal Hub, Mira Road East.',
    start_url: '/menu',
    display: 'standalone',
    background_color: '#1b0d05',
    theme_color: '#1b0d05',
    lang: 'en-IN',
    icons: [
      { src: '/images/logo-round.png', sizes: '800x800', type: 'image/png', purpose: 'any' },
      { src: '/images/logo-round.png', sizes: '800x800', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
