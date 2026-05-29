import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: '50mb', // upload PDF/Word/PPT up to 50MB
    },
  },
  images: {
    remotePatterns: [
      // Supabase Storage
      { protocol: 'https', hostname: '**.supabase.co' },
      // Lottie / mascot assets
      { protocol: 'https', hostname: 'lottie.host' },
    ],
  },
  i18n: undefined, // App Router doesn't use config-based i18n; we set dir/lang in layout.tsx
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
