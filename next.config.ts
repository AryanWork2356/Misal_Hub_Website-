import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  /* one address for search engines: the old *.vercel.app address forwards to the real domain (no duplicate site in Google) */
  async redirects() {
    return [
      { source: '/:path*', has: [{ type: 'host', value: 'misalhubweb.vercel.app' }], destination: 'https://www.misalhub.com/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
