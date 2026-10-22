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
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
